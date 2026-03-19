import prisma from "@/app/libs/prismadb";
import { isAdminEmail } from "@/app/libs/admin";
import getSession from "./getSession";
const getCurrentUser=async () =>{
    try{
     const session = await getSession();
     if (!session?.user?.email){
        return null;
     }
     const currentUser =await prisma.user.findUnique({
        where:{
            email:session.user.email as string
        }
     });
     if (!currentUser){
        return null;
     }
     if (isAdminEmail(currentUser.email)) {
        return {
            ...currentUser,
            role: "ADMIN" as const,
        };
     }
     return currentUser;
    } catch {
        return null;
    }
}
export default getCurrentUser;
