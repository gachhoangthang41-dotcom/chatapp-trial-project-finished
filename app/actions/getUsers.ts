import prisma from "@/app/libs/prismadb";
import getSession from "./getSession";

const getUsers = async () => {
  const session = await getSession();

  if (!session?.user?.email) {
    return [];
  }

  try {
    // 1. Lấy thông tin chi tiết của người dùng hiện tại, bao gồm bạn bè và lời mời đã gửi
    const currentUser = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        friends: { select: { id: true } }, // Chỉ cần ID của bạn bè
        sentFriendRequests: {
          where: { status: 'PENDING' },
          select: { receiverId: true }, // Chỉ cần ID người nhận lời mời
        },
      },
    });

    if (!currentUser) {
      return [];
    }

    // 2. Lấy tất cả người dùng khác
    const otherUsers = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      where: {
        NOT: {
          email: session.user.email,
        },
      },
    });

    // Tạo Set để tra cứu ID hiệu quả hơn
    const friendIds = new Set(currentUser.friends.map(friend => friend.id));
    const sentRequestReceiverIds = new Set(currentUser.sentFriendRequests.map(req => req.receiverId));

    // 3. Map qua danh sách người dùng và thêm 'friendStatus'
    const usersWithStatus = otherUsers.map(user => {
      if (friendIds.has(user.id)) {
        return { ...user, friendStatus: 'FRIEND' as const };
      }
      if (sentRequestReceiverIds.has(user.id)) {
        return { ...user, friendStatus: 'PENDING_SENT' as const };
      }
      return { ...user, friendStatus: 'NOT_FRIEND' as const };
    });

    return usersWithStatus;

  } catch (error: any) {
    console.error("GET_USERS_ERROR", error);
    return [];
  }
};

export default getUsers;