"use client";

import { User } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import axios from "axios";
import Avatar from "@/app/materials/Avatar";

interface FriendsListProps {
  friends: User[];
}


const FriendsList: React.FC<FriendsListProps> = ({ friends = [] }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const startConversation = useCallback((friendId: string) => {
    setIsLoading(true);
    axios.post('/api/conversations', { userId: friendId })
      .then((data) => {
        router.push(`/conversations/${data.data.id}`);
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Bạn bè ({friends.length})</h2>
      {friends.length === 0 ? (
        <p className="text-sm text-gray-500">Bạn chưa có người bạn nào.</p>
      ) : (
        <div className="space-y-3">
          {friends.map((friend) => (
            <div
              key={friend.id}
              onClick={() => startConversation(friend.id)}
              className="flex items-center p-2 -mx-2 bg-white hover:bg-gray-100 rounded-lg cursor-pointer transition"
            >
              <Avatar user={friend} />
              <p className="ml-3 font-medium text-gray-800">{friend.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsList;