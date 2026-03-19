import prisma from "@/app/libs/prismadb";
import getAdminUser from "../actions/getAdminUser";
import { redirect } from "next/navigation";
import AdminDashboard from "./components/AdminDashboard";
import { isAdminEmail } from "@/app/libs/admin";

const AdminPage = async () => {
  const currentUser = await getAdminUser();

  if (!currentUser) {
    redirect("/conversations");
  }

  const [totalUsers, totalConversations, totalMessages, users] =
    await Promise.all([
      prisma.user.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

  const normalizedUsers = users.map((user) => ({
    ...user,
    role: isAdminEmail(user.email) ? "ADMIN" : (user.role ?? "USER"),
  }));

  const totalAdmins = normalizedUsers.filter((user) => user.role === "ADMIN").length;

  return (
    <AdminDashboard
      currentUserId={currentUser.id}
      stats={{
        totalUsers,
        totalAdmins,
        totalConversations,
        totalMessages,
      }}
      users={normalizedUsers}
    />
  );
};

export default AdminPage;
