import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { pusherServer } from "@/app/libs/pusher";
import { authOptions } from "@/app/libs/authOptions";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const data = await request.text();
  const [socketId, channelName] = data
    .split("&")
    .map((str) => str.split("=")[1]);

  const authData = {
    user_id: session.user.email,
  };

  const authResponse = pusherServer.authorizeChannel(
    socketId,
    channelName,
    authData
  );

  return NextResponse.json(authResponse);
}
