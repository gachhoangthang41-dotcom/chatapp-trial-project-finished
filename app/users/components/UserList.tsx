'use client';

import { useState, useMemo, useEffect } from "react"; // Thêm useEffect
import { User } from "@prisma/client";
import UserBox, { FriendStatus } from "./UserBox";
import { Search } from "lucide-react";
import { useSession } from "next-auth/react"; // Thêm useSession
import { pusherClient } from "@/app/libs/pusher"; // Thêm pusherClient

type UserWithStatus = User & {
  friendStatus: FriendStatus;
};

interface UserListProps {
  items: UserWithStatus[];
}

const UserList: React.FC<UserListProps> = ({ items }) => {
  const { data: session } = useSession();

  const [users, setUsers] = useState(items);
  const [searchTerm, setSearchTerm] = useState("");

  // BƯỚC 2: Lắng nghe các sự kiện bạn bè từ Pusher
  useEffect(() => {
    // Chỉ lắng nghe khi đã có thông tin session
    if (!session?.user?.id) return;

    // Kênh cá nhân của người dùng hiện tại
    const channelName = session.user.id;
    pusherClient.subscribe(channelName);

    // Hàm xử lý khi có bạn mới (chấp nhận lời mời hoặc người khác chấp nhận lời mời của bạn)
    const newFriendHandler = (newFriend: User) => {
      console.log("[UserList] Received new friend event:", newFriend);
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === newFriend.id ? { ...user, friendStatus: 'FRIEND' } : user
        )
      );
    };

    // Hàm xử lý khi xóa hoặc bị xóa khỏi danh sách bạn bè
    const removeFriendHandler = (removedFriend: { id: string }) => {
      console.log("[UserList] Received remove friend event:", removedFriend);
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === removedFriend.id ? { ...user, friendStatus: 'NOT_FRIEND' } : user
        )
      );
    };

    pusherClient.bind('friend:new', newFriendHandler);
    pusherClient.bind('friend:remove', removeFriendHandler);

    
    return () => {
      pusherClient.unsubscribe(channelName);
      pusherClient.unbind('friend:new', newFriendHandler);
      pusherClient.unbind('friend:remove', removeFriendHandler);
    };
  }, [session?.user?.id]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return [];
  
    return users.filter((user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  return (
    <aside className="fixed inset-y-0 pb-20 lg:pb-0 lg:left-20 lg:w-80 overflow-y-auto border-r border-gray-200 bg-white w-full left-0">
      <div className="px-5">
        <div className="flex flex-col">
          <div className="text-2xl font-bold text-neutral-800 py-4">
            People
          </div>
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="tìm kiếm người dùng..."
              value={searchTerm}
              onChange={handleChange}
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm transition border-gray-300"
            />
          </div>
        </div>

      
        {searchTerm.trim() && (
          filteredUsers.length > 0 ? (
            filteredUsers.map((item) => (
              <UserBox
                key={item.id}
                data={item}
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