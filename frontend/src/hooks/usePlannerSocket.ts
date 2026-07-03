import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

export function usePlannerSocket(planId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['planner-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['planner-timeline', planId] });
    queryClient.invalidateQueries({ queryKey: ['planner-plans'] });
  };

  useEffect(() => {
    if (!userId) return;

    const socket = io(`${SOCKET_URL}/planner`, {
      query: { userId },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('taskUpdate', invalidateAll);
    socket.on('rsvpUpdate', invalidateAll);
    socket.on('budgetUpdate', invalidateAll);
    socket.on('activityUpdate', invalidateAll);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, planId]);

  return { socket: socketRef };
}
