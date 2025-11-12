import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/app/libs/pusher";
import { conversationChannel } from "@/app/libs/pusherChannels";

// action: 'ringing' | 'accepted' | 'rejected' | 'canceled' | 'ended' | 'busy' | 'timeout'
export async function POST(req: NextRequest) {
  const { conversationId, action, fromUser, reason, socketId } = await req.json();
  await pusherServer.trigger(
    conversationChannel(conversationId),
    `call:${action}`,
    { fromUser, reason, at: Date.now() },
    socketId ? { socket_id: socketId } : undefined
  );
  return NextResponse.json({ ok: true });
}
