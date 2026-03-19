"use client";

import axios from "axios";
import Avatar from "@/app/materials/Avatar";
import { FullMessageType } from "@/app/types";
import clsx from "clsx";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import ImageModal from "./ImageModal";

interface MessageBoxProps {
  isLast?: boolean;
  data: FullMessageType;
}

const MessageBox: React.FC<MessageBoxProps> = ({
  isLast,
  data,
}) => {
  const session = useSession();
  const [imageModelOpen, setImageModalOpen] = useState(false);
  const [isRecalling, setIsRecalling] = useState(false);
  const isOwn = session?.data?.user?.email === data?.sender?.email;

  const seenList = (data.seen || [])
    .filter((user) => user.email !== data?.sender?.email)
    .map((user) => user.name)
    .join(", ");

  const recalledLabel = isOwn
    ? "Bạn đã thu hồi một tin nhắn"
    : "Tin nhắn đã được thu hồi";

  const container = clsx(
    "flex gap-3 p-4",
    isOwn && "justify-end"
  );

  const avatar = clsx(isOwn && "order-2");

  const body = clsx("flex flex-col gap-2", isOwn && "items-end");

  const message = clsx(
    "text-sm w-fit overflow-hidden",
    data.isRecalled
      ? "rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 italic text-gray-500"
      : isOwn
        ? "bg-sky-500 text-white"
        : "bg-gray-100",
    !data.isRecalled && (data.image ? "rounded-md p-0" : "rounded-full py-2 px-3")
  );

  const handleRecall = async () => {
    if (!isOwn || data.isRecalled || isRecalling) {
      return;
    }

    const isConfirmed = window.confirm("Thu hồi tin nhắn này?");

    if (!isConfirmed) {
      return;
    }

    try {
      setIsRecalling(true);
      await axios.patch(`/api/messages/${data.id}`);
    } catch (error) {
      console.error("RECALL_MESSAGE_ERROR", error);
      window.alert("Không thể thu hồi tin nhắn lúc này.");
    } finally {
      setIsRecalling(false);
    }
  };

  return (
    <div className={container}>
      <div className={avatar}>
        <Avatar user={data.sender} />
      </div>
      <div className={body}>
        <div className="flex items-center gap-1">
          <div className="text-sm text-gray-500">{data.sender.name}</div>
          <div className="text-xs text-gray-400">
            {format(new Date(data.createdAt), "p")}
          </div>
        </div>
        <div className={message}>
          <ImageModal
            src={data.image}
            isOpen={imageModelOpen}
            onClose={() => setImageModalOpen(false)}
          />
          {data.isRecalled ? (
            <div>{recalledLabel}</div>
          ) : data.image ? (
            <Image
              onClick={() => setImageModalOpen(true)}
              alt="Image"
              height={288}
              width={288}
              src={data.image}
              className="object-cover cursor-pointer hover:scale-110 transition translate"
            />
          ) : (
            <div>{data.body}</div>
          )}
        </div>
        {isOwn && !data.isRecalled && (
          <button
            type="button"
            onClick={handleRecall}
            disabled={isRecalling}
            className="text-xs text-gray-400 transition hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRecalling ? "Đang thu hồi..." : "Thu hồi"}
          </button>
        )}
        {isLast && isOwn && seenList.length > 0 && (
          <div className="text-xs font-light text-gray-400">
            {`Seen by ${seenList}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBox;
