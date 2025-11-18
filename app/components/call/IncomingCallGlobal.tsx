'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { pusherClient } from '@/app/libs/pusher';
import { userChannel } from '@/app/libs/pusherChannels';
import { Ringer } from '@/app/utils/ringer';

type IncomingPayload = {
  conversationId: string;
  fromUser?: string;
  initiatorId?: string;
  reason?: string;
};

export default function IncomingCallGlobal() {
  const { data: session } = useSession();
  const router = useRouter();

  // với PrismaAdapter, NextAuth thường có user.id trên session
  const userId = (session?.user as any)?.id as string | undefined;

  const [open, setOpen] = useState(false);
  const [fromUser, setFromUser] = useState('Người gọi');
  const [convId, setConvId] = useState<string | null>(null);
  const [needsAudio, setNeedsAudio] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const chName = userChannel(userId);
    const ch = pusherClient.subscribe(chName);

    const onRinging = async (p: IncomingPayload) => {
      // chính mình là người gọi thì bỏ qua
      if (p.initiatorId && p.initiatorId === userId) return;

      setFromUser(p.fromUser || 'Người gọi');
      setConvId(p.conversationId);
      setOpen(true);
      try { await Ringer.playRingtone(); } catch { setNeedsAudio(true); }
      try { navigator.vibrate?.(300); } catch {}
      document.title = '📞 Cuộc gọi đến…';
    };

    const closePopup = () => {
      setOpen(false);
      setConvId(null);
      Ringer.stopRingtone();
      document.title = document.title.replace('📞 ', '');
    };

    ch.bind('call:ringing', onRinging);
    ch.bind('call:canceled', closePopup);
    ch.bind('call:timeout', closePopup);

    return () => {
      ch.unbind('call:ringing', onRinging);
      ch.unbind('call:canceled', closePopup);
      ch.unbind('call:timeout', closePopup);
      pusherClient.unsubscribe(chName);
    };
  }, [userId]);

  if (!userId || !open || !convId) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
      <div className="bg-white rounded p-5 w-full max-w-sm">
        <div className="font-medium mb-2">{fromUser} đang gọi…</div>

        {needsAudio && (
          <button
            className="mb-3 px-3 py-1 rounded bg-gray-200"
            onClick={async () => { await Ringer.resume(); setNeedsAudio(false); }}
          >
            Bật âm thanh
          </button>
        )}

        <div className="flex gap-3 justify-end">
          <button
            className="px-3 py-2 rounded bg-gray-200"
            onClick={async () => {
              const socketId = pusherClient.connection?.socket_id;
              await fetch('/api/call/control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: convId, action: 'rejected', socketId }),
              });
              setOpen(false);
              Ringer.stopRingtone();
              document.title = document.title.replace('📞 ', '');
            }}
          >
            Từ chối
          </button>

          <button
            className="px-3 py-2 rounded bg-blue-600 text-white"
            onClick={() => {
              Ringer.stopRingtone();
              setOpen(false);
              document.title = document.title.replace('📞 ', '');
              // đi vào phòng gọi
              router.push(`/conversations/${convId}/call`);
            }}
          >
            Nghe máy
          </button>
        </div>
      </div>
    </div>
  );
}
