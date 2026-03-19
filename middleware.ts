import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {
    
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      authorized: ({ token }) => !!token,
    },

    pages: {
      signIn: "/", 
    }
  }
);

export const config = {
  matcher: ["/users/:path*", "/conversations/:path*"],
};
