
'use client';

import { Message, User } from '@prisma/client';
import Avatar from '@/app/materials/Avatar';
import { format } from 'date-fns';

interface SearchResultItemProps {
  message: Message & {
    sender: User;
  };
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ message }) => {
  return (
    <div className="p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
      <div className="flex items-start gap-3">
        <Avatar user={message.sender} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">
              {message.sender.name}
            </p>
            <p className="text-xs text-gray-500">
              {format(new Date(message.createdAt), 'p, dd/MM/yy')}
            </p>
          </div>
          <p className="text-sm text-gray-700 mt-1 break-words">
            {message.body}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SearchResultItem;