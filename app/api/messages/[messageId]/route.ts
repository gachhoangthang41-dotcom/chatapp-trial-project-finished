import getCurrentUser from "@/app/actions/getCurrentUser";
import { pusherServer } from "@/app/libs/pusher";
import prisma from "@/app/libs/prismadb";
import { NextResponse } from "next/server";

interface IParams {
  messageId: string;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<IParams> }
) {
  try {
    const { messageId } = await context.params;
    const currentUser = await getCurrentUser();

    if (!currentUser?.id || !currentUser?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const existingMessage = await prisma.message.findUnique({
      where: {
        id: messageId,
      },
      include: {
        sender: true,
        seen: true,
        conversation: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!existingMessage) {
      return new NextResponse("Message not found", { status: 404 });
    }

    if (existingMessage.senderId !== currentUser.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const recalledMessage = existingMessage.isRecalled
      ? existingMessage
      : await prisma.message.update({
          where: {
            id: messageId,
          },
          data: {
            body: null,
            image: null,
            isRecalled: true,
            recalledAt: new Date(),
          },
          include: {
            sender: true,
            seen: true,
          },
        });

    const latestMessage = await prisma.message.findFirst({
      where: {
        conversationId: existingMessage.conversationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sender: true,
        seen: true,
      },
    });

    await pusherServer.trigger(
      existingMessage.conversationId,
      "message:update",
      recalledMessage
    );

    if (latestMessage) {
      await Promise.all(
        existingMessage.conversation.users.map((user) =>
          pusherServer.trigger(user.email!, "conversation:update", {
            id: existingMessage.conversationId,
            messages: [latestMessage],
          })
        )
      );
    }

    return NextResponse.json(recalledMessage);
  } catch (error) {
    console.error("RECALL_MESSAGE_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
