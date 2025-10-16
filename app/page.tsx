import Image from "next/image";
import AuthForm from "./components/AuthForm";

const AuthPage = () => {
  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* ===== CỘT BÊN TRÁI - FORM ĐĂNG NHẬP ===== */}
      <div className="lg:w-1/2 flex flex-col justify-center items-center bg-white px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full sm:max-w-md">
          <div className="mb-8">
            <h2 
              className="
                text-center 
                text-3xl 
                font-bold 
                tracking-tight 
                text-gray-900
              "
            >
              Chào mừng trở lại
            </h2>
            <p className="text-center text-sm text-gray-600 mt-2">
              Đăng nhập vào tài khoản của bạn
            </p>
          </div>
          <AuthForm />
        </div>
      </div>

      {/* ===== CỘT BÊN PHẢI - LOGO VÀ THÔNG ĐIỆP ===== */}
      <div 
        className="
          hidden 
          lg:flex 
          lg:w-1/2 
          flex-col 
          items-center 
          justify-center 
          bg-blue-600  {/* Đã đổi màu nền thành blue-600 để khớp với logo Messenger */}
          p-12 
          text-center
        "
      >
        <Image
          height="200"
          width="200"
          className="mx-auto w-auto"
          src="/images/logo.png" 
          alt="Messenger Clone Logo"
        />
        <h1 className="mt-8 text-4xl font-bold text-white tracking-tight">
          Kết nối với mọi người
        </h1>
        <p className="mt-4 text-lg text-blue-100"> 
          Kết nối với bạn bè và thế giới xung quanh bạn.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;