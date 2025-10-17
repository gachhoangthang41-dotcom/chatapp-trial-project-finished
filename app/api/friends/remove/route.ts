import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';
import { pusherServer } from '@/app/libs/pusher'; 

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();
    const { friendId } = body;

    if (!currentUser?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!friendId) {
      return new NextResponse('Friend ID missing', { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: currentUser.id }, select: { friendIds: true, friendOfIds: true } });
    const friend = await prisma.user.findUnique({ where: { id: friendId }, select: { friendIds: true, friendOfIds: true } });

    if (!user || !friend) {
      return new NextResponse('User not found', { status: 404 });
    }

    const updatedUserFriendIds = (user.friendIds ?? []).filter((id) => id !== friendId);
    const updatedUserFriendOfIds = (user.friendOfIds ?? []).filter((id) => id !== friendId);
    const updatedFriendFriendIds = (friend.friendIds ?? []).filter((id) => id !== currentUser.id);
    const updatedFriendFriendOfIds = (friend.friendOfIds ?? []).filter((id) => id !== currentUser.id);

    await prisma.$transaction([
   
      prisma.user.update({
        where: { id: currentUser.id },
        data: {
          friendIds: { set: updatedUserFriendIds },
          friendOfIds: { set: updatedUserFriendOfIds }
        },
      }),
      
     
      prisma.user.update({
        where: { id: friendId },
        data: {
          friendIds: { set: updatedFriendFriendIds },
          friendOfIds: { set: updatedFriendFriendOfIds }
        },
      }),

      
      prisma.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: currentUser.id, receiverId: friendId },
            { senderId: friendId, receiverId: currentUser.id },
          ],
        },
      }),
    ]);

    
    await pusherServer.trigger(friendId, 'friend:remove', { id: currentUser.id });

    await pusherServer.trigger(currentUser.id, 'friend:remove', { id: friendId });

    return NextResponse.json({ message: 'Friend removed successfully' });

  } catch (error) {
    console.error('REMOVE_FRIEND_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}