import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Không chặn build vì lỗi ESLint (vẫn chạy lint local được)
    ignoreDuringBuilds: true,
  },
    typescript: {
    // Giữ nguyên kiểm tra TypeScript (an toàn). Nếu bạn cần vượt qua mọi lỗi TS (không khuyến nghị) thì đặt true.
    ignoreBuildErrors: false,
  },
  images: {
    domains: [
      "lh3.googleusercontent.com",   
      "platform-lookaside.fbsbx.com",
      "res.cloudinary.com",    
    ],
  },
};

export default nextConfig;