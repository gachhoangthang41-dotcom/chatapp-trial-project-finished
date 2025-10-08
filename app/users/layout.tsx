import getUsers from "../actions/getUsers";
import SideBar from "../materials/sidebar/Sidebar";
import Userlist from "./components/UserList";

export default async function UserLayout({
    children
}:{
    children:React.ReactNode;
}){
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