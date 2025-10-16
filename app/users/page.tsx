import getFriends from "@/app/actions/getFriends";
import getFriendRequests from "@/app/actions/getFriendRequests";
import EmptyState from "../materials/EmptyState"; 


const UsersPage = async () => {
  
  const friends = await getFriends();
  const requests = await getFriendRequests();

  return (
    
    <div className="hidden lg:block lg:pl-80 h-full">
     
      <EmptyState friends={friends} requests={requests} />
    </div>
  );
};

export default UsersPage;