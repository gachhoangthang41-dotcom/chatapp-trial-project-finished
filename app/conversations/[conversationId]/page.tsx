import getConversationById from "@/app/actions/getConversationById";
import getMessages from "@/app/actions/getMessenges";
import EmptyState from "@/app/materials/EmptyState";
import Header from "./components/Header";
import Body from "./components/Body";
import Form from "./components/Form";

interface Iparams {
  conversationId: string;
}

const conversationId = async ({ params }: { params: Iparams }) => {
  const conversationId = await getConversationById(params.conversationId);
  const conversation = conversationId;
  const messages = await getMessages(params.conversationId);

  if (!conversationId) {
    return (
      <div className="lg:pl-80 h-full">
        <div className="h-full flex flex-col">
          <EmptyState />
        </div>
      </div>
    );
  }

  return (
    <div className="lg:pl-80 h-full">
      <div className="h-full flex flex-col">
        <Header conversation={conversation} />
        <Body initialMessages={messages} />
        <Form />
      </div>
    </div>
  );
};

export default conversationId;

