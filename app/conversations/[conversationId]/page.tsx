import getConversationById from "@/app/actions/getConversationById";
import getMessages from "@/app/actions/getMessenges";
import EmptyState from "@/app/materials/EmptyState";
import Header from "./components/Header";
import Body from "./components/Body";
import Form from "./components/Form";

interface Iparams {
  conversationId: string;
}


const ConversationPage = async ({ params }: { params: Promise<Iparams> }) => {
  
  const resolvedParams = await params;

  const conversation = await getConversationById(resolvedParams.conversationId);
  const messages = await getMessages(resolvedParams.conversationId);

  if (!conversation) {
    return (
      <div className="lg:pl-80 h-full">
        <div className="h-full flex flex-col">
          <EmptyState friends={[]} requests={[]} />
        </div>
      </div>
    );
  }

  return (
    <div className="lg:pl-80 h-full">
      <div className="h-full flex flex-col">
        <Header conversation={conversation} name={null} />
        <Body initialMessages={messages} />
        <Form />
      </div>
    </div>
  );
};

export default ConversationPage;
