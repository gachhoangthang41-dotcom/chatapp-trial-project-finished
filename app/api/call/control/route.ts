import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/app/libs/pusher";
import { conversationChannel, userChannel } from "@/app/libs/pusherChannels";
import prisma from "@/app/libs/prismadb";

// action: 'ringing' | 'accepted' | 'rejected' | 'canceled' | 'ended' | 'busy' | 'timeout' | 'ready'
export async function POST(req: NextRequest) {
  const { conversationId, action, fromUser, reason, socketId, initiatorId } = await req.json();

  // phát vào kênh hội thoại (giữ nguyên)
  await pusherServer.trigger(
    conversationChannel(conversationId),
    `call:${action}`,
    { fromUser, reason, at: Date.now(), initiatorId },
    socketId ? { socket_id: socketId } : undefined
  );

  // phát vào kênh người dùng để hiện popup ở mọi trang
  if (['ringing', 'canceled', 'timeout'].includes(action)) {
    try {
      const convo = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { users: true },
      });

      if (convo) {
        await Promise.all(
          convo.users.map(u =>
            pusherServer.trigger(
              userChannel(u.id),
              `call:${action}`,
              { conversationId, fromUser, reason, at: Date.now(), initiatorId },
              socketId ? { socket_id: socketId } : undefined
            )
          )
        );
      }
    } catch (e) {
      // nuốt lỗi để không làm hỏng flow chính
      console.error('notify userChannel error', e);
    }
  }

  return NextResponse.json({ ok: true });
}
