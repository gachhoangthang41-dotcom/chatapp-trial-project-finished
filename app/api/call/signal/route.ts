import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/app/libs/pusher";
import { conversationChannel } from "@/app/libs/pusherChannels";

export async function POST(req: NextRequest) {
  const { conversationId, type, data, socketId } = await req.json();
  // type: 'offer' | 'answer' | 'ice'
  await pusherServer.trigger(
    conversationChannel(conversationId),
    `webrtc:${type}`,
    { data },
    socketId ? { socket_id: socketId } : undefined 
  );
  return NextResponse.json({ ok: true });
}
