import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

import prisma from '@/app/libs/prismadb';
import getCurrentUser from '@/app/actions/getCurrentUser';

export async function POST(
  request: Request,
) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();
    const {
      name,
      image,
      password, // New password
      currentPassword // ADDED: Current password from client
    } = body;

    if (!currentUser?.id || !currentUser?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if the user authenticated via OAuth (no password exists)
    // You cannot set/change a password for OAuth users this way
    if (!currentUser.hashedPassword && password) {
         return new NextResponse('Cannot set password for OAuth account', { status: 400 });
    }

    const dataToUpdate: { name: string; image: string; hashedPassword?: string } = {
      name: name,
      image: image,
    };

    // --- PASSWORD CHANGE LOGIC ---
    if (password && currentUser.hashedPassword) { // Only if new password provided AND user has a password set
        
        // ADDED: Verify the current password
        const isCorrectPassword = await bcrypt.compare(
            currentPassword,
            currentUser.hashedPassword
        );

        if (!isCorrectPassword) {
            return new NextResponse('Incorrect current password', { status: 401 }); 
        }
        
       
        const newHashedPassword = await bcrypt.hash(password, 12);
        dataToUpdate.hashedPassword = newHashedPassword;
    }
   


    const updatedUser = await prisma.user.update({
      where: {
        id: currentUser.id
      },
      data: dataToUpdate
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("ERROR_SETTINGS", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}