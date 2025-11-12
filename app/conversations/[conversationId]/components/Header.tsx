"use client";

import useOtherUser from "@/app/hooks/useOtherUser";
import Avatar from "@/app/materials/Avatar";
import { Conversation, User } from "@prisma/client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { HiChevronLeft, HiEllipsisHorizontal, HiPhone, HiXMark } from "react-icons/hi2";
import ProfileDrawer from "./ProfileDrawer";
import AvatarGroup from "@/app/materials/AvatarGroup";
import useActiveList from "@/app/hooks/useActiveList";
import { useRouter } from "next/navigation";
import { pusherClient } from "@/app/libs/pusher";
import { conversationChannel } from "@/app/libs/pusherChannels";
import { Ringer } from "@/app/utils/ringer";

interface HeaderProps {
  name: string | null;
  conversation: Conversation & { users: User[] };
}

const Header: React.FC<HeaderProps> = ({ name, conversation }) => {
  const router = useRouter();
  const otherUser = useOtherUser(conversation);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { members } = useActiveList();
  const isActive = members.indexOf(otherUser?.email!) !== -1;

  const [dialing, setDialing] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const statusText = useMemo(() => {
    if (conversation.isGroup) return `${conversation.users.length} members`;
    return isActive ? "Active" : "Offline";
  }, [conversation, isActive]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      Ringer.stopRingback();
    };
  }, []);

  const startCall = async () => {
    if (conversation.isGroup) return;
    const conversationId = conversation.id;
    sessionStorage.setItem(`callRole-${conversationId}`, "caller");
    const socketId = pusherClient.connection?.socket_id;

    // Hiệu ứng đang gọi
    setDialing(true);
    Ringer.playRingback();

    // Gửi 'ringing'
    await fetch("/api/call/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        action: "ringing",
        fromUser: name || "Bạn",
        socketId,
      }),
    });

    const ch = pusherClient.subscribe(conversationChannel(conversationId));
    let settled = false;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      Ringer.stopRingback();
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      ch.unbind("call:accepted", onAccepted);
      ch.unbind("call:rejected", onRejected);
      ch.unbind("call:busy", onBusy);
      ch.unbind("call:timeout", onTimeout);
    };

    const onAccepted = () => {
      cleanup();
      location.assign(`/conversations/${conversationId}/call?role=caller`);
    };
    const onRejected = () => {
      cleanup();
      setDialing(false);
      sessionStorage.removeItem(`callRole-${conversationId}`);
      alert("Cuộc gọi bị từ chối");
    };
    const onBusy = () => {
      cleanup();
      setDialing(false);
      sessionStorage.removeItem(`callRole-${conversationId}`);
      alert("Người nhận đang bận");
    };
    const onTimeout = () => {
      cleanup();
      setDialing(false);
      sessionStorage.removeItem(`callRole-${conversationId}`);
      alert("Không có phản hồi");
    };

    ch.bind("call:accepted", onAccepted);
    ch.bind("call:rejected", onRejected);
    ch.bind("call:busy", onBusy);
    ch.bind("call:timeout", onTimeout);

    // timeout 30s
    timeoutRef.current = window.setTimeout(async () => {
      if (settled) return;
      const socketId2 = pusherClient.connection?.socket_id;
      await fetch("/api/call/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, action: "timeout", reason: "no-answer", socketId: socketId2 }),
      });
      onTimeout();
    }, 30_000);
  };

  const cancelDialing = async () => {
    const conversationId = conversation.id;
    const socketId = pusherClient.connection?.socket_id;
    await fetch("/api/call/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, action: "canceled", socketId }),
    });
    Ringer.stopRingback();
    setDialing(false);
  };

  return (
    <>
      <ProfileDrawer
        data={conversation}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Overlay đang gọi */}
      {dialing && !conversation.isGroup && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center">
          <div className="bg-white w-full max-w-sm rounded-lg p-5 text-center">
            <div className="font-semibold mb-1">{name || otherUser?.name}</div>
            <div className="text-gray-500 text-sm">Đang gọi…</div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={cancelDialing}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white"
                title="Hủy cuộc gọi"
              >
                <HiXMark size={18} /> Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white w-full flex border-b-[1px] sm:px-4 py-3 px-4 justify-between items-center shadow-sm">
        <div className="flex gap-3 items-center">
          <Link
            className="lg:hidden block text-sky-500 hover:text-sky-500 transition cursor-pointer"
            href="/conversations"
          >
            <HiChevronLeft size={32} />
          </Link>
          {conversation.isGroup ? (
            <AvatarGroup users={conversation.users}/>
          ) : (
            <Avatar user={otherUser} />
          )}
          <div className="flex flex-col">
            <div>{name || otherUser?.name}</div>
            <div className="text-sm font-light text-gray-500">
              {statusText}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!conversation.isGroup && (
            <button
              title="Gọi"
              onClick={startCall}
              className="p-2 rounded-full bg-sky-500 hover:bg-sky-600 text-white transition"
            >
              <HiPhone size={20} />
            </button>
          )}
          <HiEllipsisHorizontal
            size={32}
            onClick={() => setDrawerOpen(true)}
            className="text-sky-500 cursor-pointer hover:text-sky-600 transition"
          />
        </div>
      </div>
    </>
  );
};

export default Header;
