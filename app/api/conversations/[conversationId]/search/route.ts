import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";

interface IParams {
  conversationId?: string;
}

export async function GET(
  request: Request,
  { params }: { params: IParams }
) {
  try {
   
    const { conversationId } = params;

    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q'); 

    if (!currentUser?.id || !currentUser?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    
    if (!conversationId || !query) {
        return new NextResponse('Invalid data', { status: 400 });
    }

    const messages = await prisma.message.findMany({
        where: {
            
            conversationId: conversationId,
            body: {
                startsWith: query,
                mode: 'insensitive'
            }
        },
        include: {
            sender: true 
        },
        orderBy: {
            createdAt: 'desc' 
        },
        take: 20 
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.log("SEARCH_MESSAGES_ERROR", error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}