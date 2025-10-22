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
      currentPassword,
      birthDate // Destructure birthDate
    } = body;

    if (!currentUser?.id || !currentUser?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!currentUser.hashedPassword && password) {
         return new NextResponse('Cannot set password for OAuth account', { status: 400 });
    }

    // Initialize dataToUpdate with potentially more types
    const dataToUpdate: {
      name: string;
      image: string;
      hashedPassword?: string;
      birthDate?: Date | null; // Add birthDate type
    } = {
      name: name,
      image: image,
    };

    // --- PASSWORD CHANGE LOGIC (Unchanged) ---
    if (password && currentUser.hashedPassword) {
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
    // --- END PASSWORD CHANGE LOGIC ---

    // --- ADDED: BIRTH DATE UPDATE LOGIC ---
    if (birthDate !== undefined) { // Check if birthDate was provided (even if empty string)
        if (birthDate === '' || birthDate === null) {
            dataToUpdate.birthDate = null; // Set to null if user clears the date
        } else {
            try {
              
                dataToUpdate.birthDate = new Date(birthDate);
            } catch (dateError) {
                console.error("Invalid date format received:", birthDate);
                
            }
        }
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