import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import type { MatchFilters, MatchInterest } from '../types/matchmaking';
import type { PremiumStatus } from '../lib/matchmakingPremium';

const MATCH_STALE_MS = 60_000;

export function filtersToParams(filters: MatchFilters, page?: number, limit?: number) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === '' || value === false || value === null || value === undefined) return;
    params.set(key, String(value));
  });
  if (page != null && page > 0) params.set('page', String(page));
  if (limit != null && limit > 0) params.set('limit', String(limit));
  return params;
}

export interface MatchListResponse {
  profiles: import('../types/matchmaking').MatchProfile[];
  total: number;
  page?: number;
  limit?: number;
}

export function useMatchSuggestions(
  filters: MatchFilters,
  options?: { enabled?: boolean; page?: number; limit?: number },
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 12;
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ['matches-suggestions', filters, page, limit],
    enabled,
    staleTime: MATCH_STALE_MS,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = filtersToParams(filters, page, limit);
      const { data } = await api.get(`/matches/suggestions?${params.toString()}`);
      return data as MatchListResponse;
    },
  });
}

export function useMatchSearch(
  filters: MatchFilters,
  options?: { enabled?: boolean; page?: number; limit?: number },
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 12;
  const enabled = options?.enabled ?? false;

  return useQuery({
    queryKey: ['matches-search', filters, page, limit],
    enabled,
    staleTime: MATCH_STALE_MS,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = filtersToParams(filters, page, limit);
      const { data } = await api.get(`/matches/search?${params.toString()}`);
      return data as MatchListResponse;
    },
  });
}

export function useShortlist(enabled = true) {
  return useQuery({
    queryKey: ['matches-shortlist'],
    enabled,
    staleTime: MATCH_STALE_MS,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get('/matches/shortlist');
      return data as MatchListResponse;
    },
  });
}

export function useReceivedInterests(enabled = true) {
  return useQuery({
    queryKey: ['matches-received'],
    enabled,
    staleTime: MATCH_STALE_MS,
    refetchInterval: enabled ? 30_000 : false,
    queryFn: async () => {
      const { data } = await api.get('/matches/received');
      return data as MatchInterest[];
    },
  });
}

export function useSentInterests(enabled = true) {
  return useQuery({
    queryKey: ['matches-sent'],
    enabled,
    staleTime: MATCH_STALE_MS,
    refetchInterval: enabled ? 30_000 : false,
    queryFn: async () => {
      const { data } = await api.get('/matches/sent');
      return data as MatchInterest[];
    },
  });
}

export function useAcceptedInterests(enabled = true) {
  return useQuery({
    queryKey: ['matches-accepted'],
    enabled,
    staleTime: MATCH_STALE_MS,
    refetchInterval: enabled ? 30_000 : false,
    queryFn: async () => {
      const { data } = await api.get('/matches/accepted');
      return data as MatchInterest[];
    },
  });
}

export function useMyMatchProfile() {
  return useQuery({
    queryKey: ['my-match-profile'],
    staleTime: MATCH_STALE_MS,
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data;
    },
    retry: false,
  });
}

export function useMatchActions() {
  const queryClient = useQueryClient();

  const invalidateMatchLists = () => {
    queryClient.invalidateQueries({ queryKey: ['matches-suggestions'] });
    queryClient.invalidateQueries({ queryKey: ['matches-search'] });
    queryClient.invalidateQueries({ queryKey: ['matches-shortlist'] });
    queryClient.invalidateQueries({ queryKey: ['matches-received'] });
    queryClient.invalidateQueries({ queryKey: ['matches-sent'] });
    queryClient.invalidateQueries({ queryKey: ['matches-accepted'] });
    queryClient.invalidateQueries({ queryKey: ['match-profile'] });
    queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
  };

  const sendInterest = useMutation({
    mutationFn: async (receiverId: string) => {
      const { data } = await api.post('/matches/interest', { receiverId });
      return data;
    },
    onSuccess: invalidateMatchLists,
  });

  const toggleShortlist = useMutation({
    mutationFn: async ({ profileId, shortlisted }: { profileId: string; shortlisted: boolean }) => {
      if (shortlisted) {
        await api.delete(`/matches/shortlist/${profileId}`);
      } else {
        await api.post('/matches/shortlist', { profileId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches-shortlist'] });
      queryClient.invalidateQueries({ queryKey: ['matches-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['matches-search'] });
    },
  });

  const acceptInterest = useMutation({
    mutationFn: async (matchId: string) => api.put(`/matches/${matchId}/accept`),
    onMutate: async (matchId) => {
      await queryClient.cancelQueries({ queryKey: ['matches-received'] });
      await queryClient.cancelQueries({ queryKey: ['matches-accepted'] });
      const previousReceived = queryClient.getQueryData<MatchInterest[]>(['matches-received']);
      const previousAccepted = queryClient.getQueryData<MatchInterest[]>(['matches-accepted']);
      const acceptedMatch = previousReceived?.find((m) => m.id === matchId);
      queryClient.setQueryData<MatchInterest[]>(['matches-received'], (old) =>
        old?.filter((m) => m.id !== matchId) ?? [],
      );
      if (acceptedMatch) {
        queryClient.setQueryData<MatchInterest[]>(['matches-accepted'], (old) => [
          { ...acceptedMatch, status: 'accepted' },
          ...(old ?? []),
        ]);
      }
      return { previousReceived, previousAccepted };
    },
    onError: (_err, _matchId, context) => {
      if (context?.previousReceived) {
        queryClient.setQueryData(['matches-received'], context.previousReceived);
      }
      if (context?.previousAccepted) {
        queryClient.setQueryData(['matches-accepted'], context.previousAccepted);
      }
    },
    onSettled: invalidateMatchLists,
  });

  const rejectInterest = useMutation({
    mutationFn: async (matchId: string) => api.put(`/matches/${matchId}/reject`),
    onMutate: async (matchId) => {
      await queryClient.cancelQueries({ queryKey: ['matches-received'] });
      const previous = queryClient.getQueryData<MatchInterest[]>(['matches-received']);
      queryClient.setQueryData<MatchInterest[]>(['matches-received'], (old) =>
        old?.filter((m) => m.id !== matchId) ?? [],
      );
      return { previous };
    },
    onError: (_err, _matchId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['matches-received'], context.previous);
      }
    },
    onSettled: invalidateMatchLists,
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
    staleTime: MATCH_STALE_MS,
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

export function usePremiumStatus() {
  return useQuery({
    queryKey: ['premium-status'],
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await api.get('/matches/premium/status');
      return data as PremiumStatus;
    },
  });
}

export function usePremiumPlans() {
  return useQuery({
    queryKey: ['premium-plans'],
    staleTime: 300_000,
    queryFn: async () => {
      const { data } = await api.get('/matches/premium/plans');
      return data as {
        plans: import('../lib/matchmakingPremium').SubscriptionPlan[];
        boostDurationHours: number;
        paymentIntegrationEnabled: boolean;
      };
    },
  });
}

export function usePremiumActions() {
  const queryClient = useQueryClient();

  const invalidatePremium = () => {
    queryClient.invalidateQueries({ queryKey: ['premium-status'] });
    queryClient.invalidateQueries({ queryKey: ['matches-suggestions'] });
    queryClient.invalidateQueries({ queryKey: ['matches-search'] });
    queryClient.invalidateQueries({ queryKey: ['my-match-profile'] });
  };

  const subscribeToPlan = useMutation({
    mutationFn: async (planId: string) => {
      const { data } = await api.post('/matches/premium/subscribe', { planId });
      return data;
    },
    onSuccess: invalidatePremium,
  });

  const activateBoost = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/matches/boost/activate');
      return data as { isBoosted: boolean; boostExpiresAt: string; durationHours: number };
    },
    onSuccess: invalidatePremium,
  });

  return { subscribeToPlan, activateBoost };
}
