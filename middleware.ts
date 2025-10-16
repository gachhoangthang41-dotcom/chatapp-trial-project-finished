import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    
  },
  {
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