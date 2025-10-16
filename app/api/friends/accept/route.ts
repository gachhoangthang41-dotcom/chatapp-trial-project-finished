// app/api/friends/accept/route.ts
import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const { requestId } = await request.json(); 

    if (!currentUser?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId }
    });

    if (!friendRequest || friendRequest.receiverId !== currentUser.id) {
        return new NextResponse('Invalid Request', { status: 400 });
    }

   
    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' }
    });

   
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        friends: { connect: { id: friendRequest.senderId } }
      }
    });

    await prisma.user.update({
      where: { id: friendRequest.senderId },
      data: {
        friends: { connect: { id: currentUser.id } }
      }
    });

    return NextResponse.json({ message: 'Friend request accepted.' });

  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}