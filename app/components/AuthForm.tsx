'use client';
import { useCallback, useEffect, useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { BsFacebook, BsGoogle } from "react-icons/bs";
import Input from "../materials/input"; // Đảm bảo đường dẫn đúng
import Button from "../materials/button"; // Đảm bảo đường dẫn đúng
import AuthSocialButton from "./AuthSocialButton";
import axios from "axios";
import toast from "react-hot-toast";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Variant = 'LOGIN' | 'REGISTER';

const AuthForm = () => {
  const session = useSession();
  const router = useRouter();
  const [variant, setvariant] = useState<Variant>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session?.status == 'authenticated') {
      router.push('/users');
    }
  }, [session?.status, router]);

  const toggleVariant = useCallback(() => {
    setvariant(variant === 'LOGIN' ? 'REGISTER' : 'LOGIN');
  }, [variant]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FieldValues>({
    // BƯỚC 1: Thêm giá trị mặc định cho birthDate
    defaultValues: {
      name: '',
      email: '',
      password: '',
      birthDate: '', // Thêm dòng này
    }
  });

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setIsLoading(true);

    if (variant === 'REGISTER') {
      axios.post('/api/register', data)
        // Sau khi đăng ký thành công, tự động đăng nhập
        .then(() => signIn('credentials', data))
        // Hoặc nếu bạn muốn chuyển về form Login sau khi đăng ký:
        // .then(() => {
        //   toast.success('Tạo tài khoản thành công!');
        //   setvariant('LOGIN');
        // })
        .catch(() => toast.error('Có vấn đề! Email có thể đã tồn tại.')) // Thông báo lỗi cụ thể hơn
        .finally(() => setIsLoading(false));
    }

    if (variant === 'LOGIN') {
      signIn('credentials', {
        ...data,
        redirect: false
      })
      .then((callback) => {
        if (callback?.error) {
          toast.error('Tài khoản hoặc mật khẩu không đúng'); // Sửa thông báo lỗi
        }
        if (callback?.ok && !callback?.error) {
          toast.success('Đăng nhập thành công');
          router.push('/users');
        }
      })
      .finally(() => setIsLoading(false));
    }
  };

  const socialAction = (provider: string) => {
    setIsLoading(true);
    // Nên chuyển hướng đến /users sau khi đăng nhập thành công
    signIn(provider, { redirect: true, callbackUrl: "/users" })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {variant === "REGISTER" && (
            // Sử dụng Fragment <>...</> nếu có nhiều hơn một Input
            <>
              <Input
                id="name"
                label="Họ Tên Đầy Đủ"
                required
                register={register}
                errors={errors}
                disabled={isLoading}
              />
              {/* BƯỚC 2: Thêm Input cho Ngày sinh */}
              <Input
                id="birthDate"
                label="Ngày sinh"
                type="date" // Sử dụng type="date"
                required
                register={register}
                errors={errors}
                disabled={isLoading}
              />
            </>
          )}
          <Input
            id="email"
            label="Tài Khoản Gmail"
            type="email"
            required
            register={register}
            errors={errors}
            disabled={isLoading}
          />
          <Input
            id="password"
            label="Mật Khẩu"
            type="password"
            required
            register={register}
            errors={errors}
            disabled={isLoading}
          />
          <div>
            <Button
              type="submit"
              fullWidth
              disabled={isLoading}
            >
              {variant === 'LOGIN' ? 'Đăng nhập' : 'Đăng kí'}
            </Button>
          </div>
        </form>

       
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
            <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-gray-500">Or continue with</span></div>
          </div>
          <div className="mt-6 flex justify-center gap-2"> 
            <AuthSocialButton icon={BsFacebook} onClick={() => socialAction("facebook")} label="facebook"/>
            <AuthSocialButton icon={BsGoogle} onClick={() => socialAction("google")} label="google"/>
          </div>
        </div>
        <div className="flex gap-2 justify-center text-sm mt-6 px-2 text-gray-500">
          <div>{variant === 'LOGIN' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}</div>
          <div onClick={toggleVariant} className="underline cursor-pointer">{variant == 'LOGIN' ? 'Tạo tài khoản' : 'Đăng nhập'}</div>
        </div>

      </div>
    </div>
  );
};

export default AuthForm;