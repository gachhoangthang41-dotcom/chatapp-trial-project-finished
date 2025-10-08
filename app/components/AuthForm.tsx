'use client';
import { useCallback, useEffect, useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { BsFacebook,BsGoogle } from "react-icons/bs";
import Input from "../materials/input";
import Button from "../materials/button";
import AuthSocialButton from "./AuthSocialButton";
import axios from "axios";
import toast from "react-hot-toast";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Variant = 'LOGIN' | 'REGISTER';

const AuthForm = () => {
  const session=useSession();
  const router =useRouter ();
  const [variant, setvariant] = useState<Variant>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
useEffect(()=>{
 if (session?.status=='authenticated'){
   router.push('/users');
 }
},[session?.status,router]);
  const toggleVariant = useCallback(() => {
    setvariant(variant === 'LOGIN' ? 'REGISTER' : 'LOGIN');
  }, [variant]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FieldValues>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    }
  });

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setIsLoading(true);

    if (variant === 'REGISTER') {
      axios.post('/api/register',data)
      .then(()=>signIn('credentials',data))
      .catch(()=>toast.error('Có vấn đề!'))
      .finally(()=>setIsLoading(false))
    }
    if (variant === 'LOGIN') {
      signIn('credentials',{
        ...data,
        redirect:false
      })
      .then((callback)=>{
        if(callback?.error){
          toast.error('tài khoản và mật khẩu không tồn tại');
        }
        if(callback?.ok && !callback?.error){
          toast.success('Đăng nhập thành công');
          router.push('/users');
        }
      })
     .finally(()=>setIsLoading(false));
    }
  };

 
  const socialAction = (provider: string) => {
    setIsLoading(true);
    signIn(provider, { redirect: true, callbackUrl: "/" })
      .finally(() => setIsLoading(false));
  };

  return (
    <div
      className="
        mt-8
        sm:mx-auto
        sm:w-full
        sm:max-w-md
      "
    >
      <div
        className="
          bg-white
          px-4
          py-8
          shadow
          sm:rounded-lg
          sm:px-10
        "
      >
        <form
          className="space-y-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          {variant === "REGISTER" && (
            <Input
              id="name"
              label="Họ Tên Đầy Đủ "
              required
              register={register}
              errors={errors}
              disabled={isLoading}
            />
          )}
          <Input
            id="email"
            label="Tài Khoản Gmail "
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
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <AuthSocialButton
              icon={BsFacebook}
              onClick={() => socialAction("facebook")}
              label="facebook"
            />
            <AuthSocialButton
              icon={BsGoogle}
              onClick={() => socialAction("google")}
              label="google"
            />
          </div>
        </div>

        <div className="
        flex
        gap-2
        justify-center
        text-sm
        mt-6
        px-2
        text-gray-500
        ">
          <div>
            {variant === 'LOGIN' ? 'Đăng kí tài khoản mới' : 'Đã có sẵn tài khoản'}
            </div>
            <div
            onClick={toggleVariant}
            className="underline cursor-pointer"
            >
              {variant =='LOGIN'?'Tạo Một tài khoản':'Đăng nhập'}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;