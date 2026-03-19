import SideBar from "@/app/materials/sidebar/Sidebar"
import ConversationList from "./components/ConversationList"

import getConversations from "@/app/actions/getConversation"
import getUsers from "../actions/getUsers"
import getSession from "../actions/getSession"
import { redirect } from "next/navigation"
export default async function Conversations({
    children,
}:{
    children:React.ReactNode
}) {
    const session = await getSession();

    if (!session?.user?.email) {
        redirect("/?callbackUrl=%2Fconversations");
    }

    const conversations=await getConversations();
    const users =await getUsers();
   return (
    <SideBar>
        <div className="h-full">
        <ConversationList 
        users={users}
        initialItems={conversations}
        />
        {children}
        </div>
    </SideBar> 
   )
};
