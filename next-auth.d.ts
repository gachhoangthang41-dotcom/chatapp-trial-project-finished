// File: types/next-auth.d.ts

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Mở rộng kiểu Session để bao gồm user ID
   */
  interface Session extends DefaultSession {
    user?: {
      id: string; // Thêm trường 'id' vào đây
    } & DefaultSession["user"]; // Giữ lại các trường mặc định (name, email, image)
  }
}