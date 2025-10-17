
import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { pusherServer } from '@/app/libs/pusher'; 

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const { requestId } = await request.json();

    if (!currentUser?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId, receiverId: currentUser.id, status: 'PENDING' },
      include: { sender: true } 
    });

    if (!friendRequest) {
      return new NextResponse('Invalid Request', { status: 400 });
    }

    
    const [updatedUser, updatedFriend] = await prisma.$transaction([
      
      prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' }
      }),
      
      prisma.user.update({
        where: { id: currentUser.id },
        data: {
          friendIds: { push: friendRequest.senderId },
          friendOfIds: { push: friendRequest.senderId }
        }
      }),
      
      prisma.user.update({
        where: { id: friendRequest.senderId },
        data: {
          friendIds: { push: currentUser.id },
          friendOfIds: { push: currentUser.id }
        }
      })
    ]);
    
   
    await pusherServer.trigger(friendRequest.senderId, 'friend:new', currentUser);
   
    await pusherServer.trigger(currentUser.id, 'friend:new', friendRequest.sender);

    return NextResponse.json({ message: 'Friend request accepted.' });

  } catch (error) {
    console.error("ACCEPT_FRIEND_ERROR", error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}