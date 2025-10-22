import bcrypt from "bcrypt";
import prisma from "@/app/libs/prismadb";
import { NextResponse } from "next/server";

export async function POST(
    request: Request
) {
    try {
        const body = await request.json();
        const {
            email,
            name,
            password,
            birthDate 
        } = body;

        
        if (!email || !name || !password || !birthDate) {
            return new NextResponse("Missing info", { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        
        const user = await prisma.user.create({
            data: {
                email,
                name,
                hashedPassword,
              
                birthDate: new Date(birthDate)
            }
        });

        return NextResponse.json(user);

    } catch (error) { 
        console.error("REGISTER_ERROR:", error);

       
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
           
             if (typeof error === 'object' && 'meta' in error && typeof error.meta === 'object' && error.meta !== null && 'target' in error.meta && Array.isArray(error.meta.target) && error.meta.target.includes('email')) {
                 return new NextResponse('Email already exists', { status: 409 }); 
             }
        }

        // Lỗi chung khác
        return new NextResponse("Internal Error", { status: 500 });
    }
}