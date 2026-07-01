import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import type { MatchFilters } from '../types/matchmaking';

function filtersToParams(filters: MatchFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === '' || value === false || value === null || value === undefined) return;
    params.set(key, String(value));
  });
  return params;
}

export function useMatchSuggestions(filters: MatchFilters) {
  return useQuery({
    queryKey: ['matches-suggestions', filters],
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const params = filtersToParams(filters);
      const { data } = await api.get(`/matches/suggestions?${params.toString()}`);
      return data;
    },
  });
}

export function useMatchSearch(filters: MatchFilters, enabled: boolean) {
  return useQuery({
    queryKey: ['matches-search', filters],
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const params = filtersToParams(filters);
      const { data } = await api.get(`/matches/search?${params.toString()}`);
      return data;
    },
  });
}

export function useShortlist() {
  return useQuery({
    queryKey: ['matches-shortlist'],
    queryFn: async () => {
      const { data } = await api.get('/matches/shortlist');
      return data;
    },
  });
}

export function useReceivedInterests() {
  return useQuery({
    queryKey: ['matches-received'],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await api.get('/matches/received');
      return data as import('../types/matchmaking').MatchInterest[];
    },
  });
}

export function useSentInterests() {
  return useQuery({
    queryKey: ['matches-sent'],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await api.get('/matches/sent');
      return data as import('../types/matchmaking').MatchInterest[];
    },
  });
}

export function useAcceptedInterests() {
  return useQuery({
    queryKey: ['matches-accepted'],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await api.get('/matches/accepted');
      return data as import('../types/matchmaking').MatchInterest[];
    },
  });
}

export function useMatchActions() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['matches-suggestions'] });
    queryClient.invalidateQueries({ queryKey: ['matches-search'] });
    queryClient.invalidateQueries({ queryKey: ['matches-shortlist'] });
    queryClient.invalidateQueries({ queryKey: ['matches-received'] });
    queryClient.invalidateQueries({ queryKey: ['matches-sent'] });
    queryClient.invalidateQueries({ queryKey: ['matches-accepted'] });
  };

  const sendInterest = useMutation({
    mutationFn: async (receiverId: string) => {
      const { data } = await api.post('/matches/interest', { receiverId });
      return data;
    },
    onSuccess: invalidate,
  });

  const toggleShortlist = useMutation({
    mutationFn: async ({ profileId, shortlisted }: { profileId: string; shortlisted: boolean }) => {
      if (shortlisted) {
        await api.delete(`/matches/shortlist/${profileId}`);
      } else {
        await api.post('/matches/shortlist', { profileId });
      }
    },
    onSuccess: invalidate,
  });

  const acceptInterest = useMutation({
    mutationFn: async (matchId: string) => api.put(`/matches/${matchId}/accept`),
    onSuccess: invalidate,
  });

  const rejectInterest = useMutation({
    mutationFn: async (matchId: string) => api.put(`/matches/${matchId}/reject`),
    onSuccess: invalidate,
  });

  return { sendInterest, toggleShortlist, acceptInterest, rejectInterest };
}

export function useProfileCompatibility(profileId?: string) {
  const role = useAuthStore((s) => s.user?.role);
  const isMatrimonialUser = role === 'bride' || role === 'groom';

  return useQuery({
    queryKey: ['match-compatibility', profileId],
    enabled: !!profileId && isMatrimonialUser,
    retry: false,
    queryFn: async () => {
      try {
        const { data } = await api.get(`/matches/compatibility/${profileId}`);
        return data;
      } catch {
        return null;
      }
    },
  });
}
