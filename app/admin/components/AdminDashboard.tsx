"use client";

import axios from "axios";
import { UserRole } from "@prisma/client";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AdminUserItem {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole | null;
  createdAt: Date;
}

interface AdminDashboardProps {
  stats: {
    totalUsers: number;
    totalAdmins: number;
    totalConversations: number;
    totalMessages: number;
  };
  users: AdminUserItem[];
  currentUserId: string;
}

const roleOptions: UserRole[] = ["USER", "ADMIN"];

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  users,
  currentUserId,
}) => {
  const router = useRouter();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      setUpdatingUserId(userId);
      await axios.patch(`/api/admin/users/${userId}/role`, { role });
      router.refresh();
    } catch (error) {
      console.error("ADMIN_ROLE_UPDATE_ERROR", error);
      window.alert("Không thể cập nhật quyền lúc này.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="min-h-full bg-neutral-50 lg:pl-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
            Admin Panel
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Quản trị hệ thống</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Theo dõi dữ liệu chính và phân quyền tài khoản ngay trong dashboard.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-gray-500">Tổng người dùng</p>
            <p className="mt-3 text-3xl font-semibold text-gray-900">
              {stats.totalUsers}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-gray-500">Quản trị viên</p>
            <p className="mt-3 text-3xl font-semibold text-gray-900">
              {stats.totalAdmins}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-gray-500">Cuộc trò chuyện</p>
            <p className="mt-3 text-3xl font-semibold text-gray-900">
              {stats.totalConversations}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-gray-500">Tin nhắn</p>
            <p className="mt-3 text-3xl font-semibold text-gray-900">
              {stats.totalMessages}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Người dùng và phân quyền
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Admin có thể nâng quyền hoặc hạ quyền tài khoản khác ngay tại đây.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Quyền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Ngày tạo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {users.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const currentRole = user.role ?? "USER";

                  return (
                    <tr key={user.id}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {user.name || "Chưa đặt tên"}
                        </div>
                        {isSelf && (
                          <div className="mt-1 text-xs font-medium text-sky-600">
                            Tài khoản hiện tại
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.email || "Không có email"}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={currentRole}
                          disabled={isSelf || updatingUserId === user.id}
                          onChange={(event) =>
                            handleRoleChange(user.id, event.target.value as UserRole)
                          }
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(user.createdAt), "dd/MM/yyyy HH:mm")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
