import SideBar from "@/app/materials/sidebar/Sidebar"
import ConversationList from "./components/ConversationList"
import { get } from "http"
import getConversations from "@/app/actions/getConversation"
import getUsers from "../actions/getUsers"
export default async function Conversations({
    children,
}:{
    children:React.ReactNode
}) {
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