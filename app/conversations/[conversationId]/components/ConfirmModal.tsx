'use client';

import Button from "@/app/materials/button"; // Adjust path if needed
import Modal from "@/app/materials/Modal"; // Adjust path if needed
import { DialogTitle } from "@headlessui/react";
import { useCallback, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";

// STEP 1: Update the props interface to be more generic
interface ConfirmModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onConfirm: () => void; // Add this prop to receive the action
  title?: string;         // Optional title
  body?: string;          // Optional body text
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm, // Receive the onConfirm function
  title,
  body
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // STEP 2: Remove specific deletion logic (useRouter, useConversation, axios)
  // Create a generic handler that calls the passed-in onConfirm
  const handleConfirm = useCallback(() => {
    setIsLoading(true);
    // Execute the function passed from the parent component
    onConfirm();
    // The parent component's onConfirm function should handle setIsLoading(false) in its .finally() block
  }, [onConfirm]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="sm:flex sm:items-start">
        <div
          className="
            mx-auto
            flex
            h-12
            w-12
            flex-shrink-0
            items-center
            justify-center
            rounded-full
            bg-red-100
            sm:mx-0 
            sm:h-10
            sm:w-10
          " // Corrected sm:nx-0 to sm:mx-0
        >
          <FiAlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div
          className="
            mt-3
            text-center
            sm:ml-4
            sm:mt-0
            sm:text-left
          "
        >
          {/* STEP 3: Use the passed-in title and body props */}
          <DialogTitle
            as="h3"
            className="
              text-base
              font-semibold
              leading-6
              text-gray-900
            "
          >
            {/* Use the provided title or a default */}
            {title || 'Delete conversation'}
          </DialogTitle>
          <div className="mt-2"> {/* Changed from p-2 for better structure */}
            <p className="text-sm text-gray-500">
              {/* Use the provided body or a default */}
              {body || 'Bạn có chắc chắn muốn xóa đoạn hội thoại này không vì nó sẽ không thể hoàn lại'}
            </p>
          </div>
        </div>
      </div>
      <div
        className="
          mt-5
          sm:mt-4
          sm:flex
          sm:flex-row-reverse
        "
      >
        
        <Button
          disabled={isLoading}
          danger
          onClick={handleConfirm} 
        >
          Xóa
        </Button>
        <Button
          disabled={isLoading}
          secondary
          onClick={onClose}
        >
          Hủy
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;