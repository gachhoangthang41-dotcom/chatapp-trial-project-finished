"use client";

import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";

interface AuthContextProps {
  children: React.ReactNode;
  session?: Session | null;
}

export default function AuthContext({ children, session }: AuthContextProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}