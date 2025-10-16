import getFriends from "@/app/actions/getFriends";
import getFriendRequests from "@/app/actions/getFriendRequests";
import EmptyState from "@/app/materials/EmptyState";
import clsx from "clsx";


const Home = async () => {
  
  const friends = await getFriends();
  const requests = await getFriendRequests();

  return (
 
    <div
      className={clsx(
        "hidden lg:block lg:pl-80 h-full"
      )}
    >
      
      <EmptyState friends={friends} requests={requests} />
    </div>
  );
};

export default Home;