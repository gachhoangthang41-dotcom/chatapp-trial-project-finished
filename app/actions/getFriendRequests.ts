import prisma from "@/app/libs/prismadb";
import getCurrentUser from "./getCurrentUser";

const getFriendRequests = async () => {
  const currentUser = await getCurrentUser();

  // Nếu không có người dùng hiện tại, trả về một mảng rỗng
  if (!currentUser?.id) {
    return [];
  }

  try {
    // Tìm tất cả các lời mời kết bạn (FriendRequest)
    // nơi mà người nhận (receiverId) chính là người dùng hiện tại
    // và trạng thái (status) đang là PENDING (chờ xử lý)
    const requests = await prisma.friendRequest.findMany({
      where: {
        receiverId: currentUser.id,
        status: 'PENDING',
      },
      // Include (bao gồm) cả thông tin chi tiết của người gửi (sender)
      include: {
        sender: true,
      },
      orderBy: {
        createdAt: 'desc', // Sắp xếp để lời mời mới nhất hiện lên đầu
      },
    });

    return requests;
  } catch (error: any) {
    // Ghi lại lỗi và trả về mảng rỗng
    console.error("GET_FRIEND_REQUESTS_ERROR", error);
    return [];
  }
};

export default getFriendRequests;