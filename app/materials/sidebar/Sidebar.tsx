import getCurrentUser from "@/app/actions/getCurrentUser";
import DesktopSidebar from "./DesktopSidebar";
import MobileFooter from "./MobileFooter";
import superjson from "superjson";
async function SideBar({children}:{
    children:React.ReactNode;
}){
    const currentUser=await getCurrentUser();
    const safeUser = superjson.parse(superjson.stringify(currentUser));
    return (
        <div className="h-full">
            <DesktopSidebar currentUser={currentUser!}/>
            <MobileFooter/>
            <main className="lg:pl-20 h-full">
               {children}
            </main>
            

        </div>
    )
}
    
export default SideBar;