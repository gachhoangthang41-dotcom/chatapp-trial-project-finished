'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { pusherClient } from '@/app/libs/pusher';

export type CallState =
  | 'idle'
  | 'calling'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'ended'
  | 'error';

export function useVoiceCall(conversationId: string) {
  // ===== Refs & state =====
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const [state, setState] = useState<CallState>('idle');
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsPlay, setNeedsPlay] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // đã xử lý answer chưa
  const hasRemoteAnswerRef = useRef(false);

  // >>> HÀNG ĐỢI ICE KHI CHƯA setRemoteDescription <<<
  const pendingRemoteCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // ===== ICE servers (STUN + OPTIONAL TURN) =====
  const iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];
  if (process.env.NEXT_PUBLIC_TURN_URL) {
    iceServers.push({
      urls: process.env.NEXT_PUBLIC_TURN_URL!,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    });
  }

  // ===== Helpers =====
  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };
  const stopLocalTracks = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
  };

  // ===== RTCPeerConnection =====
  const ensurePeer = useCallback(() => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (e) => {
      // ĐỪNG gửi candidate rỗng (end-of-candidates)
      if (!e.candidate) return;
      const socketId = pusherClient.connection?.socket_id;
      fetch('/api/call/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          type: 'ice',
          data: e.candidate.toJSON(),
          socketId,
        }),
      });
    };

    pc.ontrack = (e) => {
      if (!remoteStreamRef.current) remoteStreamRef.current = new MediaStream();
      const stream = e.streams?.[0] ?? remoteStreamRef.current;
      remoteStreamRef.current = stream;
      const el = remoteAudioRef.current;
      if (el) {
        el.srcObject = stream;
        el.play().catch(() => setNeedsPlay(true));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[Conn]', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setState('connected');
        startTimer();
        sessionStorage.setItem(`callState-${conversationId}`, 'connected');
      }
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        setState('ended');
        stopTimer();
        sessionStorage.removeItem(`callState-${conversationId}`);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[ICE]', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        try {
          pc.restartIce();
        } catch {}
      }
    };
    pc.onicegatheringstatechange = () => {
      console.log('[ICE gathering]', pc.iceGatheringState);
    };
    pc.onsignalingstatechange = () => {
      console.log('[Signaling]', pc.signalingState);
    };

    pcRef.current = pc;
    return pc;
  }, [conversationId]);

  // ===== Thiết bị =====
  const refreshDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setMics(devices.filter((d) => d.kind === 'audioinput'));
      setOutputs(devices.filter((d) => d.kind === 'audiooutput'));
    } catch {}
  }, []);

  const acquireMic = useCallback(
    async (deviceId?: string) => {
      setError(null);
      stopLocalTracks();

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          deviceId: deviceId ? { exact: deviceId } : undefined,
        } as MediaTrackConstraints,
        video: false,
      };

      const pc = ensurePeer();

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        const track = stream.getAudioTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === 'audio');
        if (sender) sender.replaceTrack(track);
        else pc.addTrack(track, stream);
        await refreshDevices();
        return stream;
      } catch (e: any) {
        setError(e?.message || 'Không thể truy cập micro.');
        setState('error');
        throw e;
      }
    },
    [ensurePeer, refreshDevices]
  );

  // ===== HÀNG ĐỢI ICE + FLUSH =====
  const flushPendingCandidates = useCallback(async () => {
    const pc = ensurePeer();
    if (!pc.remoteDescription) return;
    const list = pendingRemoteCandidatesRef.current.splice(0);
    for (const c of list) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {
        console.warn('flush addIceCandidate fail', e);
      }
    }
  }, [ensurePeer]);

  // ===== Caller / Callee =====
  const startAsCaller = useCallback(async () => {
    setElapsed(0);
    setState('connecting');
    sessionStorage.setItem(`callState-${conversationId}`, 'connecting');

    await acquireMic();
    const pc = ensurePeer();

    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);

    const socketId = pusherClient.connection?.socket_id;
    await fetch('/api/call/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        type: 'offer',
        data: offer,
        socketId,
      }),
    });
  }, [acquireMic, conversationId, ensurePeer]);

  const startAsCallee = useCallback(async () => {
    setElapsed(0);
    setState('connecting');
    sessionStorage.setItem(`callState-${conversationId}`, 'connecting');
    await acquireMic();
    ensurePeer();
  }, [acquireMic, ensurePeer, conversationId]);

  // ===== Signaling handlers =====
  const handleRemoteOffer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      const pc = ensurePeer();
      console.log('[Offer] setRemoteDescription');
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushPendingCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const socketId = pusherClient.connection?.socket_id;
      await fetch('/api/call/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          type: 'answer',
          data: answer,
          socketId,
        }),
      });
    },
    [conversationId, ensurePeer, flushPendingCandidates]
  );

  // *** VÁ Ở ĐÂY ***
  // Chỉ set answer nếu CHƯA có remoteDescription
  const handleRemoteAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      const pc = ensurePeer();

      // Nếu đã xử lý answer rồi thì bỏ
      if (hasRemoteAnswerRef.current) {
        console.warn('[Answer] already handled → ignore');
        return;
      }

      // Nếu đã có remoteDescription (thường là answer luôn) thì không set lại
      if (pc.remoteDescription) {
        console.warn(
          '[Answer] remoteDescription already set (',
          pc.remoteDescription.type,
          ') → ignore'
        );
        hasRemoteAnswerRef.current = true;
        return;
      }

      try {
        console.log('[Answer] setRemoteDescription');
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        hasRemoteAnswerRef.current = true;
        await flushPendingCandidates();
      } catch (e) {
        console.error('[Answer] setRemoteDescription failed:', e);
      }
    },
    [ensurePeer, flushPendingCandidates]
  );

  const handleRemoteIce = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      const pc = ensurePeer();

      // Một số trình duyệt phát "candidate rỗng" để báo kết thúc → bỏ qua
      if (!candidate || (candidate as any).candidate === '') return;

      if (!pc.remoteDescription) {
        pendingRemoteCandidatesRef.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Failed to add ICE candidate', e);
      }
    },
    [ensurePeer]
  );

  // ===== Controls =====
  const toggleMute = () => {
    const s = localStreamRef.current;
    if (!s) return;
    s.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMuted((prev) => !prev);
  };

  const switchMicrophone = async (deviceId: string) => {
    await acquireMic(deviceId);
  };

  const setOutputDevice = async (deviceId: string) => {
    const el = remoteAudioRef.current as any;
    if (el && typeof el.setSinkId === 'function') {
      await el.setSinkId(deviceId).catch(() => {});
    }
  };

  const resumeRemoteAudio = async () => {
    try {
      await remoteAudioRef.current?.play();
      setNeedsPlay(false);
    } catch {
      setNeedsPlay(true);
    }
  };

  const hangup = () => {
    pcRef.current?.getSenders().forEach((s) => s.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;

    stopLocalTracks();
    pendingRemoteCandidatesRef.current = [];
    stopTimer();

    setState('ended');
    sessionStorage.removeItem(`callState-${conversationId}`);
    hasRemoteAnswerRef.current = false;
  };

  useEffect(() => () => stopTimer(), []);

  // ===== Public API =====
  return {
    state,
    error,
    elapsed,
    muted,
    needsPlay,
    remoteAudioRef,
    mics,
    outputs,
    refreshDevices,
    switchMicrophone,
    setOutputDevice,
    startAsCaller,
    startAsCallee,
    handleRemoteOffer,
    handleRemoteAnswer,
    handleRemoteIce,
    toggleMute,
    resumeRemoteAudio,
    hangup,
  };
}
