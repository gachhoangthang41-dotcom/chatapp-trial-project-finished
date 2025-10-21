"use client";

import { User } from "@prisma/client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Modal from "../Modal";
import Input from "../input";
import Image from "next/image";
import { CldUploadButton, CloudinaryUploadWidgetResults } from "next-cloudinary";
import Button from "../button";

interface SettingsModalProps {
  isOpen?: boolean;
  onClose: () => void;
  currentUser: User;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FieldValues>({
    defaultValues: {
      name: currentUser?.name,
      image: currentUser?.image,
      currentPassword: '', 
      password: '',
      confirmPassword: '',
    },
  });

  const image = watch("image");
  const newPasswordValue = watch('password'); 

  const handleUpload = (result: CloudinaryUploadWidgetResults) => {
    if (result.info && typeof result.info === 'object') {
      setValue("image", result.info.secure_url, { shouldValidate: true });
    }
  };

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setIsLoading(true);

    
    const isChangingPassword = !!data.password;

  
    if (isChangingPassword) {
    
      if (!data.currentPassword) {
        toast.error("Vui lòng nhập mật khẩu hiện tại để thay đổi.");
        setIsLoading(false);
        return;
      }
     
      if (data.password !== data.confirmPassword) {
        toast.error("Mật khẩu mới không trùng khớp!");
        setIsLoading(false);
        return;
      }
    }
    


    
    const dataToSend: FieldValues = {
      name: data.name,
      image: data.image,
    };
    if (isChangingPassword) {
      dataToSend.currentPassword = data.currentPassword;
      dataToSend.password = data.password; 
    }

    axios
      .post("/api/settings", dataToSend)
      .then(() => {
        router.refresh();
        onClose();
        toast.success("Profile updated!");
        reset({ 
          name: data.name,
          image: data.image,
          currentPassword: '',
          password: '',
          confirmPassword: '',
        });
      })
      .catch((error) => { 
        if (error?.response?.status === 401) {
            toast.error("Mật khẩu hiện tại không đúng!");
        } else {
            toast.error("Đã có lỗi xảy ra!");
        }
        console.error("SETTINGS_UPDATE_ERROR_CLIENT", error);
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-12">
          <div className="border-b border-gray-900/10 pb-12">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Profile
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Chỉnh thông tin. Nhập mật khẩu hiện tại để đổi mật khẩu mới.
            </p>

            <div className="mt-10 flex flex-col gap-y-8">
              
              <Input
                disabled={isLoading} label="Name" id="name"
                errors={errors} required register={register}
              />

          
              <div>
                <label className="block text-sm font-medium leading-6 text-gray-900">Photo</label>
                <div className="mt-2 flex items-center gap-x-3">
                  <Image width={48} height={48} className="rounded-full object-cover" src={image || currentUser?.image || "/images/icon.jpg"} alt="Avatar" unoptimized />
                  <CldUploadButton options={{ maxFiles: 1 }} onSuccess={handleUpload} uploadPreset="diomolio">
                    <div className="flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Thay ảnh</div>
                  </CldUploadButton>
                </div>
              </div>

             
              <Input
                disabled={isLoading}
                label="Mật khẩu hiện tại (cần thiết nếu đổi mật khẩu)"
                id="currentPassword"
                type="password"
                errors={errors}
                register={register}
                required={!!newPasswordValue} 
              />

             
              <Input
                disabled={isLoading}
                label="Mật khẩu mới (để trống nếu không đổi)"
                id="password"
                type="password"
                errors={errors}
                register={register}
                required={false}
              />

            
              <Input
                disabled={isLoading}
                label="Xác nhận mật khẩu mới"
                id="confirmPassword"
                type="password"
                errors={errors}
                register={register}
                required={!!newPasswordValue} 
              />
          

            </div>
          </div>

          
          <div className="mt-6 flex items-center justify-end gap-x-6">
            <Button disabled={isLoading} secondary onClick={onClose}>Hủy</Button>
            <Button disabled={isLoading} type="submit">Lưu</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default SettingsModal;