'use client';

import { useState, useMemo } from "react";
import { User } from "@prisma/client";
import UserBox, { FriendStatus } from "./UserBox"; // Import FriendStatus từ UserBox
import { Search } from "lucide-react";

// Tạo một kiểu mới để User object bao gồm cả friendStatus
type UserWithStatus = User & {
  friendStatus: FriendStatus;
};

interface UserListProps {
  items: UserWithStatus[]; // Sử dụng kiểu mới ở đây
}

const UserList: React.FC<UserListProps> = ({ items }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Bỏ state `error` vì logic hiển thị "tên không tồn tại" đã đủ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = useMemo(() => {
    // Chỉ tìm kiếm khi có nhập liệu
    if (!searchTerm.trim()) return [];
    return items.filter((user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  return (
    <aside
      className="
        fixed inset-y-0 pb-20 lg:pb-0 lg:left-20 lg:w-80
        overflow-y-auto border-r border-gray-200 bg-white w-full left-0
      "
    >
      <div className="px-5">
        <div className="flex flex-col">
          <div className="text-2xl font-bold text-neutral-800 py-4">
            People
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative mb-4">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={handleChange}
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm transition border-gray-300"
            />
          </div>
        </div>

        {/* Danh sách user */}
        {searchTerm.trim() && (
            filteredUsers.length > 0 ? (
                filteredUsers.map((item) => (
                    <UserBox
                        key={item.id}
                        data={item}
                        // **QUAN TRỌNG: Truyền friendStatus xuống UserBox**
                        initialStatus={item.friendStatus}
                    />
                ))
            ) : (
                <p className="text-gray-500 text-sm px-2">User not found.</p>
            )
        )}
      </div>
    </aside>
  );
};

export default UserList;