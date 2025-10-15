'use client';
import { useState, useMemo } from "react";
import { User } from "@prisma/client";
import UserBox from "./UserBox";
import { Search } from "lucide-react";

interface UserListProps {
  items: User[];
}

const Userlist: React.FC<UserListProps> = ({ items }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === "") {
      setError("Không được để trống ô tìm kiếm");
    } else {
      setError("");
    }
  };

  const filteredUsers = useMemo(() => {
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
          <div className="relative mb-2">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={handleChange}
              className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm transition ${
                error
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
          </div>

          {/* Hiển thị lỗi */}
          {error && (
            <p className="text-red-500 text-xs mb-3">{error}</p>
          )}
        </div>

        {/* Danh sách user */}
        {filteredUsers.length > 0 ? (
          filteredUsers.map((item) => (
            <UserBox key={item.id} data={item} />
          ))
        ) : (
          !error && <p className="text-gray-500 text-sm">tên không tồn tại</p>
        )}
      </div>
    </aside>
  );
};

export default Userlist;
