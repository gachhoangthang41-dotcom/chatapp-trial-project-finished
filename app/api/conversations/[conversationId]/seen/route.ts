import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
interface Iparams {
    conversationId: string;
  }
  export async function POST(
    request: Request,
    { params }: { params: Iparams }
  ){
    try{
const currentUser=await getCurrentUser();
const {
conversationId
}=params;
if(!currentUser?.id || !currentUser?.email){
    return new NextResponse('UNAUTHORIZED',{status:401});
}
const conversation=await prisma.conversation.findUnique({
    where:{
        id:conversationId
    },
    include:{
        messages:{
            include:{
                seen:true
            }
        },
        users:true
    }
});
if(!conversation){
    return new NextResponse('Cuộc trò chuyện không tồn tại',{status:400});
}
const lastMessage=conversation.messages[conversation.messages.length -1];
if(!lastMessage){
    return NextResponse.json(conversation);
}
const updatedMessage=await prisma.message.update({
    where:{
        id:lastMessage.id
    },
    data:{
        seen:{
            connect:{
                id:currentUser.id
            }
        }
    },
    include:{
        sender:true,
        seen:true
    }
});
return NextResponse.json(updatedMessage);
    }catch(error:any){
      console.log(error,'ERROR_MESAGE_SEEN');
      return new Response('Internal Error', {status:500});
    }
  }