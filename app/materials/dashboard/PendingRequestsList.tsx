

"use client";

import { User, FriendRequest } from "@prisma/client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { pusherClient } from "@/app/libs/pusher";
import axios from "axios";
import Avatar from "@/app/materials/Avatar";
import { Check, X } from 'lucide-react';

type FriendRequestWithSender = FriendRequest & { sender: User };

interface PendingRequestsListProps {
  requests: FriendRequestWithSender[];
}

const PendingRequestsList: React.FC<PendingRequestsListProps> = ({ requests: initialRequests = [] }) => {
  const { data: session } = useSession();
  const [requests, setRequests] = useState(initialRequests);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    const channelName = session.user.id;
    pusherClient.subscribe(channelName);

    const newRequestHandler = (newRequest: FriendRequestWithSender) => {
      setRequests((prev) => {
      
        if (prev.find(req => req.id === newRequest.id)) {
          return prev;
        }
        return [newRequest, ...prev];
      });
    };

    pusherClient.bind('friend:request_received', newRequestHandler);

    return () => {
      pusherClient.unsubscribe(channelName);
      pusherClient.unbind('friend:request_received', newRequestHandler);
    };
  }, [session?.user?.id]);

  const handleResponse = (requestId: string, action: 'accept' | 'decline') => {
    setIsLoading(requestId);
    axios.post(`/api/friends/${action}`, { requestId })
      .then(() => {
        setRequests((current) => current.filter((req) => req.id !== requestId));
      })
      .catch((error) => console.error(error))
      .finally(() => setIsLoading(null));
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Lời mời kết bạn ({requests.length})</h2>
      {requests.length === 0 ? (
        <p className="text-sm text-gray-500">Không có lời mời nào đang chờ.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
              <div className="flex items-center">
                <Avatar user={req.sender} />
                <p className="ml-3 font-medium text-gray-800">{req.sender.name}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => handleResponse(req.id, 'accept')} disabled={!!isLoading} className="p-2 rounded-full bg-green-100 hover:bg-green-200 disabled:opacity-50">
                  <Check className="h-5 w-5 text-green-600" />
                </button>
                <button onClick={() => handleResponse(req.id, 'decline')} disabled={!!isLoading} className="p-2 rounded-full bg-red-100 hover:bg-red-200 disabled:opacity-50">
                  <X className="h-5 w-5 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingRequestsList;