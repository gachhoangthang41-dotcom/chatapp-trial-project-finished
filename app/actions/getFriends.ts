import prisma from "@/app/libs/prismadb";
import getCurrentUser from "./getCurrentUser";

const getFriends = async () => {
  const currentUser = await getCurrentUser();

  // Nếu không có người dùng hiện tại, trả về một mảng rỗng
  if (!currentUser?.id) {
    return [];
  }

  try {
    // Tìm người dùng hiện tại và include (bao gồm) toàn bộ danh sách bạn bè của họ
    const userWithFriends = await prisma.user.findUnique({
      where: {
        id: currentUser.id,
      },
      include: {
        friends: true, // "friends" là tên của relation bạn đã định nghĩa trong schema
      },
    });

    // Nếu không tìm thấy người dùng (trường hợp hiếm), hoặc họ không có bạn, trả về mảng rỗng
    if (!userWithFriends) {
      return [];
    }

    return userWithFriends.friends;
  } catch (error: any) {
    // Ghi lại lỗi và trả về mảng rỗng để tránh làm sập ứng dụng
    console.error("GET_FRIENDS_ERROR", error);
    return [];
  }
};

export default getFriends;