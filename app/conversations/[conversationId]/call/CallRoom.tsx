'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { pusherClient } from '@/app/libs/pusher';
import { conversationChannel } from '@/app/libs/pusherChannels';
import { useVoiceCall } from '@/app/hooks/useVoiceCall';

// helper: đọc param an toàn
function getParam(params: Record<string, string | string[] | undefined> | null, key: string) {
  const v = params?.[key];
  if (Array.isArray(v)) return v[0];
  return v;
}
function format(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function CallRoom() {
  const router = useRouter();
  const params = useParams();
  const conversationId = getParam(params as Record<string, string | string[] | undefined>, 'conversationId');

  const search = useSearchParams();
  const roleParam = search?.get('role');
  const role: 'caller' | 'callee' = roleParam === 'caller' ? 'caller' : 'callee';

  const rtc = useVoiceCall(conversationId ?? '');

  // dùng để tránh điều hướng nhiều lần
  const [exiting, setExiting] = useState(false);

  // caller đã start offer chưa
  const startedRef = useRef(false);

  const exitToChat = () => {
    if (!conversationId || exiting) return;
    setExiting(true);
    router.replace(`/conversations/${conversationId}`);
  };

  useEffect(() => {
    if (!conversationId) return;

    const chName = conversationChannel(conversationId);
    const ch = pusherClient.subscribe(chName);

    // Cả hai đầu đều nhận ICE
    const onIce = (payload: { data: RTCIceCandidateInit }) => rtc.handleRemoteIce(payload.data);
    ch.bind('webrtc:ice', onIce);

    if (role === 'caller') {
      // Caller: chỉ tạo offer 1 lần khi nhận ready
      const onReady = async () => {
        if (startedRef.current) {
          console.log('[CallRoom] caller already started, ignore extra ready');
          return;
        }
        startedRef.current = true;
        await rtc.startAsCaller();
      };
      ch.bind('call:ready', onReady);

      const onAnswer = (payload: { data: RTCSessionDescriptionInit }) =>
        rtc.handleRemoteAnswer(payload.data);
      ch.bind('webrtc:answer', onAnswer);
    } else {
      // Callee: vào phòng, mở mic, gửi ready; chỉ nghe offer
      (async () => {
        await rtc.startAsCallee();
        const socketId = pusherClient.connection?.socket_id;
        await fetch('/api/call/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, action: 'ready', socketId }),
        });
      })();

      const onOffer = (payload: { data: RTCSessionDescriptionInit }) =>
        rtc.handleRemoteOffer(payload.data);
      ch.bind('webrtc:offer', onOffer);
    }

    const onEnded = () => {
      rtc.hangup();
      startedRef.current = false;
      exitToChat();
    };
    ch.bind('call:ended', onEnded);

    const beforeUnload = () => {
      const socketId = pusherClient.connection?.socket_id;
      fetch('/api/call/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, action: 'ended', socketId }),
      });
      rtc.hangup();
      startedRef.current = false;
    };
    window.addEventListener('beforeunload', beforeUnload);

    return () => {
      ch.unbind('webrtc:ice', onIce);
      ch.unbind('call:ended', onEnded);
      ch.unbind_all();
      pusherClient.unsubscribe(chName);
      window.removeEventListener('beforeunload', beforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, role]);

  useEffect(() => {
    if (rtc.state === 'ended') {
      startedRef.current = false;
      exitToChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rtc.state]);

  const statusText = useMemo(() => {
    switch (rtc.state) {
      case 'connecting':
        return 'Đang kết nối…';
      case 'connected':
        return `Thời gian: ${format(rtc.elapsed)}`;
      case 'ended':
        return 'Đã kết thúc';
      default:
        return 'Đang gọi…';
    }
  }, [rtc.state, rtc.elapsed]);

  if (!conversationId) return <div className="p-4">Đang tải cuộc gọi…</div>;

  const supportsOutputSelect =
    typeof document !== 'undefined' &&
    typeof (document.createElement('audio') as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }).setSinkId === 'function';


  return (
    <div className="fixed inset-0 bg-gradient-to-b from-sky-600 to-indigo-700 text-white flex flex-col">
      <audio ref={rtc.remoteAudioRef} autoPlay playsInline />

      <div className="px-4 py-3 flex items-center justify-between">
        <div className="font-semibold">Cuộc gọi thoại</div>
        <button onClick={exitToChat} className="text-white/80 hover:text-white">
          Đóng
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center text-3xl select-none">
          📞
        </div>
        <div className="mt-4 text-lg">{statusText}</div>
        {rtc.error && <div className="mt-2 text-red-200 text-sm">Lỗi: {rtc.error}</div>}
        {rtc.needsPlay && (
          <button
            onClick={rtc.resumeRemoteAudio}
            className="mt-3 px-3 py-1 rounded bg-white/20 hover:bg-white/30"
          >
            Bật âm thanh
          </button>
        )}
      </div>

      <div className="p-4 bg-black/20">
        <div className="flex flex-wrap gap-3 items-center justify-center">
          <button onClick={rtc.toggleMute} className="px-4 py-2 rounded bg-white/10 hover:bg-white/20">
            {rtc.muted ? 'Bật mic' : 'Tắt mic'}
          </button>

          <button
            onClick={async () => {
              const socketId = pusherClient.connection?.socket_id;
              await fetch('/api/call/control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId, action: 'ended', socketId }),
              });
              rtc.hangup();
              startedRef.current = false;
              sessionStorage.removeItem(`callRole-${conversationId}`);
              exitToChat();
            }}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700"
          >
            Kết thúc
          </button>

          <div className="flex items-center gap-2">
            <label className="text-sm text-white/80">Micro</label>
            <select
              className="bg-transparent border border-white/30 rounded px-2 py-1"
              onChange={(e) => rtc.switchMicrophone(e.target.value)}
              onFocus={rtc.refreshDevices}
              defaultValue=""
            >
              <option value="" disabled>
                Chọn
              </option>
              {rtc.mics.map((d) => (
                <option key={d.deviceId} value={d.deviceId} className="text-black">
                  {d.label || `Mic ${d.deviceId.slice(-4)}`}
                </option>
              ))}
            </select>

            {supportsOutputSelect && (
              <>
                <label className="text-sm text-white/80">Loa</label>
                <select
                  className="bg-transparent border border-white/30 rounded px-2 py-1"
                  onChange={(e) => rtc.setOutputDevice(e.target.value)}
                  onFocus={rtc.refreshDevices}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Chọn
                  </option>
                  {rtc.outputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId} className="text-black">
                      {d.label || `Loa ${d.deviceId.slice(-4)}`}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
