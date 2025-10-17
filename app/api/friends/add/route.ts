
import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { pusherServer } from '@/app/libs/pusher'; 

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();
    const { userId: receiverId } = body;

    if (!currentUser?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (!receiverId) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    
    const isAlreadyFriends = currentUser.friendIds?.includes(receiverId);
    if (isAlreadyFriends) {
      return new NextResponse('You are already friends', { status: 409 });
    }
    const existingRequest = await prisma.friendRequest.findFirst({ where: { OR: [ { senderId: currentUser.id, receiverId: receiverId }, { senderId: receiverId, receiverId: currentUser.id }, ] } });
    if (existingRequest) {
      return new NextResponse('Friend request already sent or received', { status: 409 });
    }

    
    const newRequest = await prisma.friendRequest.create({
      data: {
        senderId: currentUser.id,
        receiverId: receiverId,
      },
      include: {
        sender: true,
      }
    });

   
    await pusherServer.trigger(
      receiverId, 
      'friend:request_received',
      newRequest 
    );

    return NextResponse.json(newRequest);

  } catch (error) {
    console.error("ADD_FRIEND_ERROR", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}