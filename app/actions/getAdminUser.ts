import getCurrentUser from "./getCurrentUser";

const getAdminUser = async () => {
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== "ADMIN") {
    return null;
  }

  return currentUser;
};

export default getAdminUser;
