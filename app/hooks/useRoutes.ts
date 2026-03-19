import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { HiChat } from "react-icons/hi";
import {
  HiArrowLeftOnRectangle,
  HiShieldCheck,
  HiUsers,
} from "react-icons/hi2";
import { IconType } from "react-icons";
import { signOut } from "next-auth/react";
import useConversation from "./useConversation";

interface RouteItem {
  label: string;
  href: string;
  icon: IconType;
  active?: boolean;
  onClick?: () => void;
}

const useRoutes = (isAdmin = false) => {
  const pathname = usePathname();
  const { conversationId } = useConversation();

  const routes = useMemo(() => {
    const items: RouteItem[] = [
      {
        label: "Chat",
        href: "./conversations",
        icon: HiChat,
        active: pathname === "/conversations" || !!conversationId,
      },
      {
        label: "Users",
        href: "/users",
        icon: HiUsers,
        active: pathname === "/users",
      },
    ];

    if (isAdmin) {
      items.push({
        label: "Admin",
        href: "/admin",
        icon: HiShieldCheck,
        active: pathname === "/admin",
      });
    }

    items.push({
      label: "Logout",
      href: "#",
      onClick: () => signOut(),
      icon: HiArrowLeftOnRectangle,
      active: false,
    });

    return items;
  }, [pathname, conversationId, isAdmin]);

  return routes;
};

export default useRoutes;
