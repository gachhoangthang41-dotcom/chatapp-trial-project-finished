"use client";

import useOtherUser from "@/app/hooks/useOtherUser";
import { Conversation, User, Message } from "@prisma/client";
import { format } from "date-fns"; // Đảm bảo đã import format
import { Fragment, useMemo, useState, useEffect, useCallback } from "react"; // Thêm useCallback
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import { IoClose, IoTrash } from "react-icons/io5";
import Avatar from "@/app/materials/Avatar";
import ConfirmModal from "./ConfirmModal"; // Đảm bảo đường dẫn đúng
import AvatarGroup from "@/app/materials/AvatarGroup";
import useActiveList from "@/app/hooks/useActiveList";
import axios from "axios";
import { Search, Loader2 } from "lucide-react";
import SearchResultItem from "../SearchResultItem"; // Đảm bảo đường dẫn đúng
import useConversation from "@/app/hooks/useConversation"; // Import useConversation
import { toast } from "react-hot-toast"; // Import toast
import { useRouter } from "next/navigation"; // Import router

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: Conversation & {
    users: User[];
  };
}

const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose, data }) => {
  const router = useRouter(); // Khởi tạo router
  const { conversationId } = useConversation(); // Lấy conversationId
  const otherUser = useOtherUser(data);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Thêm isLoading cho việc xóa
  const { members } = useActiveList();

  // Sửa lỗi TypeScript: Kiểm tra email an toàn
  const isActive = useMemo(() => {
    if (!otherUser?.email) return false;
    return members.indexOf(otherUser.email) !== -1;
  }, [members, otherUser?.email]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Message & { sender: User })[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false); // Đổi tên isLoading của search

  // Thêm useCallback cho logic xóa conversation
  const onDeleteConversation = useCallback(() => {
    setIsLoading(true);
    axios.delete(`/api/conversations/${conversationId}`)
      .then(() => {
        onClose(); // Đóng drawer
        setConfirmOpen(false); // Đóng modal
        router.push('/conversations');
        router.refresh();
      })
      .catch(() => toast.error('Something went wrong!'))
      .finally(() => setIsLoading(false));
  }, [conversationId, router, onClose]);

  const joinedDate = useMemo(() => {
    // Thêm kiểm tra otherUser tồn tại
    if (!otherUser?.createdAt) return '';
    return format(new Date(otherUser.createdAt), 'PP');
  }, [otherUser?.createdAt]);

  const title = useMemo(() => {
    return data.name || otherUser?.name;
  }, [data.name, otherUser?.name]);

  const statusText = useMemo(() => {
    if (data.isGroup) {
      return `${data.users.length} members`;
    }
    return isActive ? 'Active' : 'Offline';
  }, [data, isActive]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        setIsSearchLoading(true); // Sử dụng state riêng cho search
        axios.get(`/api/conversations/${data.id}/search?q=${searchQuery}`)
          .then((response) => setSearchResults(response.data))
          .catch((error) => console.error("Search error:", error))
          .finally(() => setIsSearchLoading(false)); // Sử dụng state riêng
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchQuery, data.id]);

  return (
    <>
      {/* Truyền hàm xóa vào ConfirmModal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onDeleteConversation} // Truyền hàm xóa vào đây
      />
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          {/* ... Phần nền mờ ... */}
          <TransitionChild as={Fragment} enter="ease-out duration-500" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-500" leaveFrom="opacity-100" leaveTo="opacity-0">
             <div className="fixed inset-0 bg-black bg-opacity-40" />
          </TransitionChild>
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <TransitionChild as={Fragment} enter="transform transition ease-in-out duration-500" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-500" leaveTo="translate-x-full">
                  <DialogPanel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                      {/* ... Nút đóng ... */}
                       <div className="px-4 sm:px-6">
                           <div className="flex items-start justify-end">
                              <div className="ml-3 flex h-7 items-center">
                                  <button onClick={onClose} type="button" className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
                                      <span className="sr-only">Close panel</span>
                                      <IoClose size={24} />
                                  </button>
                              </div>
                           </div>
                       </div>
                      <div className="relative mt-6 flex-1 px-4 sm:px-6">
                        {/* ... Phần Avatar, Title, Status, Delete Button ... */}
                        <div className="flex flex-col items-center">
                            <div className="mb-2">
                               {data.isGroup ? <AvatarGroup users={data.users}/> : <Avatar user={otherUser}/>}
                            </div>
                            <div>{title}</div>
                            <div className="text-sm text-gray-500">{statusText}</div>
                            <div className="flex gap-10 my-8">
                                <div onClick={() => setConfirmOpen(true)} className="flex flex-col gap-3 items-center cursor-pointer hover:opacity-75">
                                    <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center"><IoTrash size={20}/></div>
                                    <div className="text-sm font-light text-neutral-600">Delete</div>
                                </div>
                            </div>
                        </div>

                        {/* --- Phần Tìm kiếm và Thông tin chi tiết --- */}
                        <div className="w-full border-t border-gray-200 pt-5">
                          {/* Search Bar */}
                          <dl className="space-y-8 px-4 sm:space-y-6 sm:px-6">
                            <div>
                              <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:flex-shrink-0">Tìm trong cuộc trò chuyện</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Nhập để tìm kiếm..." className="w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"/>
                              </dd>
                            </div>
                          </dl>
                          {/* Search Results */}
                          <div className="mt-4 space-y-2 px-4 sm:px-6 max-h-40 overflow-y-auto"> {/* Thêm max-h và overflow */}
                            {isSearchLoading && <div className="flex justify-center items-center py-4"><Loader2 className="h-6 w-6 animate-spin text-sky-500" /></div>}
                            {!isSearchLoading && searchResults.map((message) => <SearchResultItem key={message.id} message={message} />)}
                            {!isSearchLoading && searchQuery && searchResults.length === 0 && <p className="text-center text-sm text-gray-500 py-4">Không tìm thấy kết quả nào.</p>}
                          </div>
                        </div>

                        {/* User/Group Info */}
                        <div className="w-full pb-5 pt-5 sm:px-0 sm:pt-0 mt-4 border-t border-gray-200">
                          <dl className="space-y-8 px-4 sm:space-y-6 sm:px-6">
                            {data.isGroup && (
                              <div>
                                <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:flex-shrink-0">Emails</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">{data.users.map((user)=>user.email).join(', ')}</dd>
                              </div>
                            )}
                            {!data.isGroup && (
                              <div>
                                <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:flex-shrink-0">Email</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">{otherUser?.email}</dd>
                              </div>
                            )}
                            {/* ✅ THÊM NGÀY SINH VÀO ĐÂY */}
                            {!data.isGroup && otherUser?.birthDate && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:flex-shrink-0">
                                        Ngày sinh
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                                        {format(new Date(otherUser.birthDate), 'dd/MM/yyyy')}
                                    </dd>
                                </div>
                            )}
                            {!data.isGroup && (
                              <>
                                <hr/>
                                <div>
                                  <dt className="text-sm font-medium text-gray-500 sm:w-40 sm:flex-shrink-0">Joined</dt>
                                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                                    <time dateTime={joinedDate}>{joinedDate}</time>
                                  </dd>
                                </div>
                              </>
                            )}
                          </dl>
                        </div>
                      </div>
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
export default ProfileDrawer;