import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

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

    
    const existingRequest = await prisma.friendRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: currentUser.id,
          receiverId: receiverId,
        },
      },
    });

    if (existingRequest) {
     
      return new NextResponse('Friend request already sent', { status: 409 }); 
    }
    


    const newRequest = await prisma.friendRequest.create({
      data: {
        senderId: currentUser.id,
        receiverId: receiverId,
      },
    });

    return NextResponse.json(newRequest);

  } catch (error) {
    console.error("ADD_FRIEND_ERROR", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}