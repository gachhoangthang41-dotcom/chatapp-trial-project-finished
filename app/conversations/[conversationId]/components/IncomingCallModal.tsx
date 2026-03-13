'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { pusherClient } from '@/app/libs/pusher';
import { conversationChannel } from '@/app/libs/pusherChannels';
import { Ringer } from '@/app/utils/ringer';

function getParam(params: Record<string, string | string[] | undefined> | null, key: string) {
  const v = params?.[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

export default function IncomingCallModal() {
  const params = useParams();
  const conversationId = getParam(params as Record<string, string | string[] | undefined>, 'conversationId');

  const [open, setOpen] = useState(false);
  const [fromUser, setFromUser] = useState<string>('Người gọi');
  const [needsAudio, setNeedsAudio] = useState(false);

  useEffect(() => {
    if (!conversationId) return;
    const ch = pusherClient.subscribe(conversationChannel(conversationId));

    const onRinging = async ({ fromUser }: { fromUser?: string }) => {
      // đang bận -> báo busy
      const callState = sessionStorage.getItem(`callState-${conversationId}`);
      if (callState === 'connecting' || callState === 'connected') {
        const socketId = pusherClient.connection?.socket_id;
        await fetch('/api/call/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, action: 'busy', socketId }),
        });
        return;
      }
      setFromUser(fromUser || 'Người gọi');
      setOpen(true);
      try { await Ringer.playRingtone(); } catch { setNeedsAudio(true); }
      try { navigator.vibrate?.(300); } catch {}
      try {
        if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
          await Notification.requestPermission();
        }
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Cuộc gọi đến', { body: fromUser || 'Người gọi' });
        }
      } catch {}
      document.title = '📞 Cuộc gọi đến…';
    };

    const onCanceled = () => {
      setOpen(false);
      Ringer.stopRingtone();
      document.title = document.title.replace('📞 ', '');
    };

    ch.bind('call:ringing', onRinging);
    ch.bind('call:canceled', onCanceled);
    ch.bind('call:timeout', onCanceled);

    return () => {
      ch.unbind('call:ringing', onRinging);
      ch.unbind('call:canceled', onCanceled);
      ch.unbind('call:timeout', onCanceled);
    };
  }, [conversationId]);

  if (!conversationId || !open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
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
                body: JSON.stringify({ conversationId, action: 'rejected', socketId }),
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
            onClick={async () => {
              sessionStorage.setItem(`callRole-${conversationId}`, 'callee');
              const socketId = pusherClient.connection?.socket_id;
              await fetch('/api/call/control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId, action: 'accepted', socketId }),
              });
              Ringer.stopRingtone();
              document.title = document.title.replace('📞 ', '');
              // chuyển sang phòng call với vai trò callee
              location.assign(`/conversations/${conversationId}/call`);
            }}
          >
            Nghe máy
          </button>
        </div>
      </div>
    </div>
  );
}
