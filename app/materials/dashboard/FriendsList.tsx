

"use client";

import { User } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useMemo, useEffect } from "react";
import axios from "axios";
import Avatar from "@/app/materials/Avatar";
import { Search, X, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { useSession } from "next-auth/react";
import { pusherClient } from "@/app/libs/pusher";
import GeneralConfirmModal from "@/app/conversations/[conversationId]/components/GeneralConFirmModal";

interface FriendsListProps {
  friends: User[];
}

const FriendsList: React.FC<FriendsListProps> = ({ friends: initialFriends = [] }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [friends, setFriends] = useState(initialFriends);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);

  
  useEffect(() => {
    if (!session?.user?.id) return;

    const channelName = session.user.id;
    pusherClient.subscribe(channelName);

    const newFriendHandler = (newFriend: User) => {
      setFriends((prev) => {
        if (prev.find(friend => friend.id === newFriend.id)) return prev;
        return [...prev, newFriend];
      });
    };

    const removeFriendHandler = (removedFriend: { id: string }) => {
      setFriends((prev) => prev.filter(friend => friend.id !== removedFriend.id));
    };

    pusherClient.bind('friend:new', newFriendHandler);
    pusherClient.bind('friend:remove', removeFriendHandler);

    return () => {
      pusherClient.unsubscribe(channelName);
      pusherClient.unbind('friend:new', newFriendHandler);
      pusherClient.unbind('friend:remove', removeFriendHandler);
    };
  }, [session?.user?.id]);


  const startConversation = useCallback((friendId: string) => {
    setIsLoading(true);
    axios.post('/api/conversations', { userId: friendId })
      .then((data) => router.push(`/conversations/${data.data.id}`))
      .finally(() => setIsLoading(false));
  }, [router]);

  
  const handleRemoveFriend = useCallback(() => {
    if (!selectedFriend) return;
    setIsLoading(true);
    axios.post('/api/friends/remove', { friendId: selectedFriend.id })
      .then(() => {
        toast.success('Đã xóa bạn bè!');
        setFriends((prev) => prev.filter(friend => friend.id !== selectedFriend.id));
        setIsConfirmOpen(false);
      })
      .catch(() => toast.error('Đã xảy ra lỗi!'))
      .finally(() => setIsLoading(false));
  }, [selectedFriend]);


  const filteredFriends = useMemo(() => {
    if (!searchTerm.trim()) return friends;
    return friends.filter((friend) =>
      friend.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [friends, searchTerm]);

  return (
    <>
     
      <GeneralConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleRemoveFriend}
        title="Xác nhận xóa bạn bè"
        body={`Bạn có muốn xóa ${selectedFriend?.name} khỏi danh sách bạn bè của bạn không?`}
      />

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Bạn bè ({friends.length})</h2>
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm bạn bè..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {isLoading && <div className="flex justify-center"><Loader2 className="animate-spin" /></div>}
        
        {!isLoading && (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {filteredFriends.length > 0 ? (
              filteredFriends.map((friend) => (
                <div key={friend.id} className="group flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center cursor-pointer flex-grow" onClick={() => startConversation(friend.id)}>
                    <Avatar user={friend} />
                    <p className="ml-3 font-medium text-gray-800">{friend.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFriend(friend);
                      setIsConfirmOpen(true);
                    }}
                    className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    aria-label={`Remove ${friend.name}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 px-2">
                {searchTerm ? 'Không tìm thấy bạn bè nào.' : 'Hiện tại bạn chưa có bạn bè nào.'}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default FriendsList;