"use client";
import Avatar from "@/app/materials/Avatar";
import LoadingModal from "@/app/materials/LoadingModal";
import { User } from "@prisma/client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";


export type FriendStatus = "NOT_FRIEND" | "PENDING_SENT" | "FRIEND";

interface UserBoxProps {
  data: User;

  initialStatus: FriendStatus;
}

const UserBox: React.FC<UserBoxProps> = ({ data, initialStatus }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentStatus, setCurrentStatus] = useState(initialStatus);

  
  useEffect(() => {
    setCurrentStatus(initialStatus);
  }, [initialStatus]);


  
  const handleStartConversation = useCallback(() => {
    setIsLoading(true);
    axios
      .post("/api/conversations", { userId: data.id })
      .then((res) => {
        router.push(`/conversations/${res.data.id}`);
      })
      .finally(() => setIsLoading(false));
  }, [data, router]);


  const handleAddFriend = useCallback(() => {
    setIsLoading(true);
    axios
      .post("/api/friends/add", { userId: data.id })
      .then(() => {
       
        setCurrentStatus("PENDING_SENT");
      })
      .catch((error) => {
        
        console.error("Failed to send friend request", error);
      })
      .finally(() => setIsLoading(false));
  }, [data.id]);

  return (
    <>
      {isLoading && <LoadingModal />}
      <div
        className="
          w-full
          relative
          flex
          items-center
          space-x-3
          bg-white
          p-3
          hover:bg-neutral-100
          rounded-lg
          transition
        "
      >
        <Avatar user={data} />
        <div 
          onClick={handleStartConversation} 
          className="min-w-0 flex-1 cursor-pointer"
        >
          <div className="focus:outline-none">
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium text-gray-900">{data.name}</p>
            </div>
          </div>
        </div>
        
       
        <div className="flex-shrink-0">
          {currentStatus === "NOT_FRIEND" && (
            <button
              onClick={handleAddFriend}
              disabled={isLoading}
              className="px-3 py-1 text-xs font-semibold text-white bg-sky-500 rounded-full hover:bg-sky-600 disabled:opacity-70 transition"
            >
              Kết bạn
            </button>
          )}

          {currentStatus === "PENDING_SENT" && (
            <button
              disabled
              className="px-3 py-1 text-xs font-semibold text-gray-600 bg-gray-200 rounded-full cursor-not-allowed"
            >
              Đã gửi
            </button>
          )}

          {currentStatus === "FRIEND" && (
            <button
              onClick={handleStartConversation}
              disabled={isLoading}
              className="px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-full hover:bg-green-600 disabled:opacity-70 transition"
            >
              Nhắn tin
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default UserBox;