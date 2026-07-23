import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

export type CallType = 'audio' | 'video';

export interface IncomingCall {
  callId: string;
  callerId: string;
  callType: CallType;
}

export function useChatSocket(handlers?: {
  onNewMessage?: (message: unknown) => void;
  onMessageDeleted?: (data: { messageId: string; senderId: string; receiverId: string }) => void;
  onUserTyping?: (data: { userId: string }) => void;
  onIncomingCall?: (call: IncomingCall) => void;
  onCallAccepted?: (data: { callId: string; accepterId: string }) => void;
  onCallRejected?: (data: { callId: string }) => void;
  onCallEnded?: (data: { callId: string }) => void;
  onCallOffer?: (data: { callId: string; sdp: RTCSessionDescriptionInit; from: string }) => void;
  onCallAnswer?: (data: { callId: string; sdp: RTCSessionDescriptionInit; from: string }) => void;
  onIceCandidate?: (data: { callId: string; candidate: RTCIceCandidateInit; from: string }) => void;
}) {
  const socketRef = useRef<Socket | null>(null);
  const userId = useAuthStore((s) => s.user?.id);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!userId) return;

    const socket = io(`${SOCKET_URL}/chat`, {
      query: { userId },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('newMessage', (msg) => handlersRef.current?.onNewMessage?.(msg));
    socket.on('messageDeleted', (data) => handlersRef.current?.onMessageDeleted?.(data));
    socket.on('userTyping', (data) => handlersRef.current?.onUserTyping?.(data));
    socket.on('call:incoming', (data) => handlersRef.current?.onIncomingCall?.(data));
    socket.on('call:accepted', (data) => handlersRef.current?.onCallAccepted?.(data));
    socket.on('call:rejected', (data) => handlersRef.current?.onCallRejected?.(data));
    socket.on('call:ended', (data) => handlersRef.current?.onCallEnded?.(data));
    socket.on('call:offer', (data) => handlersRef.current?.onCallOffer?.(data));
    socket.on('call:answer', (data) => handlersRef.current?.onCallAnswer?.(data));
    socket.on('call:ice-candidate', (data) => handlersRef.current?.onIceCandidate?.(data));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  const emit = useCallback(
    (event: string, data: unknown, callback?: (response: unknown) => void) => {
      if (!socketRef.current) return;
      if (callback) {
        socketRef.current.emit(event, data, callback);
      } else {
        socketRef.current.emit(event, data);
      }
    },
    [],
  );

  return { socket: socketRef, emit };
}
