import { redirect } from "next/navigation";
import getCurrentUser from "../actions/getCurrentUser";
import SideBar from "../materials/sidebar/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.email) {
    redirect("/?callbackUrl=%2Fadmin");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/conversations");
  }

  return <SideBar>{children}</SideBar>;
}
