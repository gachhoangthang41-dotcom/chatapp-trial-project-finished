// File: app/api/friends/decline/route.ts

import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();
    const { requestId } = body; 

    if (!currentUser?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!requestId) {
      return new NextResponse('Request ID missing', { status: 400 });
    }

    
    const requestToDelete = await prisma.friendRequest.findUnique({
      where: {
        id: requestId,
        receiverId: currentUser.id, 
      },
    });

    if (!requestToDelete) {
      return new NextResponse('Invalid request', { status: 404 });
    }

    
    await prisma.friendRequest.delete({
      where: {
        id: requestId,
      },
    });

    return NextResponse.json({ message: 'Friend request declined' });

  } catch (error) {
    console.error('DECLINE_FRIEND_REQUEST_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}