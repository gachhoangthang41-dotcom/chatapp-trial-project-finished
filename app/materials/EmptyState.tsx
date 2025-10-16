// EmptyState.tsx (sửa lại file cũ)
"use client";

import { User, FriendRequest } from "@prisma/client";
import FriendsList from "@/app/materials/dashboard/FriendsList";
import PendingRequestsList from "@/app/materials/dashboard/PendingRequestsList";  

// Định nghĩa lại type để bao gồm sender
type FriendRequestWithSender = FriendRequest & {
  sender: User;
};

interface EmptyStateProps {
  friends: User[];
  requests: FriendRequestWithSender[];
}

const EmptyState: React.FC<EmptyStateProps> = ({ friends, requests }) => {
  return (
    <div
      className="
        px-4
        py-10
        sm:px-6
        lg:px-8
        h-full
        flex
        justify-center
        items-start
        bg-gray-100
        overflow-y-auto
      "
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h3 className="mt-2 text-2xl font-semibold text-gray-900">
            Chào mừng trở lại!
          </h3>
          <p className="text-gray-500 mt-1">Quản lý bạn bè và lời mời của bạn tại đây.</p>
        </div>
        
        {/* Component hiển thị lời mời */}
        <PendingRequestsList requests={requests} />
        
        {/* Component hiển thị danh sách bạn bè */}
        <FriendsList friends={friends} />
      </div>
    </div>
  );
};

export default EmptyState;