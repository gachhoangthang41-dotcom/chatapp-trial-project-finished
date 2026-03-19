import getUsers from "../actions/getUsers";
import SideBar from "../materials/sidebar/Sidebar";
import Userlist from "./components/UserList";
import getSession from "../actions/getSession";
import { redirect } from "next/navigation";

export default async function UserLayout({
    children
}:{
    children:React.ReactNode;
}){
    const session = await getSession();

    if (!session?.user?.email) {
        redirect("/?callbackUrl=%2Fusers");
    }

    const users=await getUsers();
    return (
        <SideBar>
        <div className="h-full">
            <Userlist items={users}/>
            {children}
        </div>
        </SideBar>
    )
}; 
