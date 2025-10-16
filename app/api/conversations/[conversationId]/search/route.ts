// File: app/api/conversations/[conversationId]/search/route.ts

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
    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q'); // 'q' là query parameter cho search term

    if (!currentUser?.id || !currentUser?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    if (!params.conversationId || !query) {
        return new NextResponse('Invalid data', { status: 400 });
    }

    const messages = await prisma.message.findMany({
        where: {
            conversationId: params.conversationId,
            // Tìm kiếm trong nội dung tin nhắn, không phân biệt hoa thường
            body: {
                contains: query,
                mode: 'insensitive'
            }
        },
        include: {
            sender: true // Lấy cả thông tin người gửi
        },
        orderBy: {
            createdAt: 'desc' // Sắp xếp kết quả mới nhất lên đầu
        },
        take: 20 // Giới hạn 20 kết quả để tránh quá tải
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.log("SEARCH_MESSAGES_ERROR", error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}