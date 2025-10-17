
"use client";

import Button from "@/app/materials/button";
import Modal from "@/app/materials/Modal";
import { DialogTitle } from "@headlessui/react";
import { useCallback, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";

interface GeneralConfirmModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  body?: string;
}

const GeneralConfirmModal: React.FC<GeneralConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  body
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = useCallback(() => {
    setIsLoading(true);
    onConfirm();
  }, [onConfirm]);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="sm:flex sm:items-start">
        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
          <FiAlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <DialogTitle as="h3" className="text-base font-semibold leading-6 text-gray-900">
            {title || 'Xác nhận hành động'} 
          </DialogTitle>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              {body || 'Bạn có chắc chắn muốn thực hiện hành động này?'}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <Button disabled={isLoading} danger onClick={handleConfirm}>
          Xác nhận
        </Button>
        <Button disabled={isLoading} secondary onClick={onClose}>
          Hủy
        </Button>
      </div>
    </Modal>
  );
};
export default GeneralConfirmModal;