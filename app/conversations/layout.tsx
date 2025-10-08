import SideBar from "@/app/materials/sidebar/Sidebar"
import ConversationList from "./components/ConversationList"
import { get } from "http"
import getConversations from "@/app/actions/getConversation"
export default async function Conversations({
    children,
}:{
    children:React.ReactNode
}) {
    const conversations=await getConversations();
   return (
    <SideBar>
        <div className="h-full">
        <ConversationList 
        initialItems={conversations}
        />
        {children}
        </div>
    </SideBar> 
   )
};