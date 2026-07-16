import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentService } from '../../services/agent/agentService';
import type {
  AgentCustomerStatus,
  CreateCustomerPayload,
  WorksheetTask,
  WorksheetTaskStatus,
  AgentDocumentType,
} from '../../types/agent';
import type { AgentMatchSearchPayload } from '../../types/agentMatching';

export const agentKeys = {
  dashboard: ['agent', 'dashboard'] as const,
  customers: (params?: Record<string, unknown>) =>
    ['agent', 'customers', params] as const,
  customer: (id: string) => ['agent', 'customer', id] as const,
  notes: (customerId: string) => ['agent', 'notes', customerId] as const,
  documents: (customerId: string) => ['agent', 'documents', customerId] as const,
  worksheet: (params?: Record<string, unknown>) =>
    ['agent', 'worksheet', params] as const,
  activity: (params?: Record<string, unknown>) =>
    ['agent', 'activity', params] as const,
  matching: (customerId: string, payload?: AgentMatchSearchPayload) =>
    ['agent', 'matching', customerId, payload] as const,
  recommendations: (customerId: string) =>
    ['agent', 'recommendations', customerId] as const,
  matchProfile: (customerId: string, matchedProfileId: string) =>
    ['agent', 'matchProfile', customerId, matchedProfileId] as const,
  customerWorkspace: (customerId: string) =>
    ['agent', 'customerWorkspace', customerId] as const,
  customerWorkspaceMatches: (customerId: string, payload?: AgentMatchSearchPayload) =>
    ['agent', 'customerWorkspaceMatches', customerId, payload] as const,
  customerHistory: (customerId: string) =>
    ['agent', 'customerHistory', customerId] as const,
  customerNotifications: (customerId: string, params?: Record<string, unknown>) =>
    ['agent', 'customerNotifications', customerId, params] as const,
  customerChat: (customerId: string, params?: Record<string, unknown>) =>
    ['agent', 'customerChat', customerId, params] as const,
};

export function useAgentDashboard() {
  return useQuery({
    queryKey: agentKeys.dashboard,
    queryFn: agentService.getDashboard,
  });
}

export function useAgentCustomers(params: {
  search?: string;
  status?: AgentCustomerStatus | '';
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}) {
  // Normalize so empty status is not part of the request payload.
  const cleanParams = {
    search: params.search || undefined,
    status: params.status || undefined,
    sortBy: params.sortBy || undefined,
    sortOrder: params.sortOrder || undefined,
    page: params.page,
    limit: params.limit,
  };

  return useQuery({
    queryKey: agentKeys.customers(cleanParams),
    queryFn: () => agentService.getCustomers(cleanParams),
    placeholderData: (prev) => prev,
  });
}

export function useAgentCustomer(id: string) {
  return useQuery({
    queryKey: agentKeys.customer(id),
    queryFn: () => agentService.getCustomer(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) =>
      agentService.createCustomer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent', 'customers'] });
      qc.invalidateQueries({ queryKey: agentKeys.dashboard });
    },
  });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CreateCustomerPayload>) =>
      agentService.updateCustomer(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agentKeys.customer(id) });
      qc.invalidateQueries({ queryKey: ['agent', 'customers'] });
      qc.invalidateQueries({ queryKey: agentKeys.dashboard });
    },
  });
}

export function useAgentNotes(customerId: string) {
  return useQuery({
    queryKey: agentKeys.notes(customerId),
    queryFn: () => agentService.getNotes(customerId),
    enabled: !!customerId,
  });
}

export function useAgentDocuments(customerId: string) {
  return useQuery({
    queryKey: agentKeys.documents(customerId),
    queryFn: () => agentService.getDocuments(customerId),
    enabled: !!customerId,
  });
}

export function useUploadDocument(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, file }: { type: AgentDocumentType; file: File }) =>
      agentService.uploadDocument(customerId, type, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agentKeys.documents(customerId) });
      qc.invalidateQueries({ queryKey: agentKeys.customer(customerId) });
    },
  });
}

export function useAgentWorksheet(params?: {
  status?: WorksheetTaskStatus | '';
  dueDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: agentKeys.worksheet(params),
    queryFn: () => agentService.getWorksheet(params),
  });
}

export function useCreateWorksheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<WorksheetTask>) =>
      agentService.createWorksheet(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent', 'worksheet'] });
      qc.invalidateQueries({ queryKey: agentKeys.dashboard });
    },
  });
}

export function useUpdateWorksheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<WorksheetTask> }) =>
      agentService.updateWorksheet(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent', 'worksheet'] });
      qc.invalidateQueries({ queryKey: agentKeys.dashboard });
    },
  });
}

export function useDeleteWorksheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agentService.deleteWorksheet(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent', 'worksheet'] });
      qc.invalidateQueries({ queryKey: agentKeys.dashboard });
    },
  });
}

export function useAgentActivity(params?: {
  page?: number;
  limit?: number;
  customerId?: string;
}) {
  return useQuery({
    queryKey: agentKeys.activity(params),
    queryFn: () => agentService.getActivity(params),
  });
}

export function useAgentCustomerMatching(
  customerId: string,
  payload: AgentMatchSearchPayload,
  enabled = true,
) {
  return useQuery({
    queryKey: agentKeys.matching(customerId, payload),
    queryFn: () => agentService.searchCustomerMatches(customerId, payload),
    enabled: !!customerId && enabled,
    placeholderData: (prev) => prev,
  });
}

export function useAgentRecommendations(customerId: string, enabled = true) {
  return useQuery({
    queryKey: agentKeys.recommendations(customerId),
    queryFn: () => agentService.getCustomerRecommendations(customerId),
    enabled: !!customerId && enabled,
  });
}

export function useAgentMatchProfile(
  customerId: string,
  matchedProfileId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: agentKeys.matchProfile(customerId, matchedProfileId),
    queryFn: () => agentService.getMatchProfile(customerId, matchedProfileId),
    enabled: !!customerId && !!matchedProfileId && enabled,
  });
}

export function useAgentCustomerWorkspace(customerId: string) {
  return useQuery({
    queryKey: agentKeys.customerWorkspace(customerId),
    queryFn: () => agentService.getCustomerWorkspace(customerId),
    enabled: !!customerId,
  });
}

export function useAgentCustomerWorkspaceMatches(
  customerId: string,
  payload: AgentMatchSearchPayload,
  enabled = true,
) {
  return useQuery({
    queryKey: agentKeys.customerWorkspaceMatches(customerId, payload),
    queryFn: () => agentService.getCustomerMatches(customerId, payload),
    enabled: !!customerId && enabled,
    placeholderData: (prev) => prev,
  });
}

export function useAgentCustomerHistory(customerId: string, enabled = true) {
  return useQuery({
    queryKey: agentKeys.customerHistory(customerId),
    queryFn: () => agentService.getCustomerHistory(customerId),
    enabled: !!customerId && enabled,
  });
}

export function useAgentCustomerNotifications(
  customerId: string,
  params?: { page?: number; limit?: number },
  enabled = true,
) {
  return useQuery({
    queryKey: agentKeys.customerNotifications(customerId, params),
    queryFn: () => agentService.getCustomerNotifications(customerId, params),
    enabled: !!customerId && enabled,
    refetchInterval: enabled ? 30_000 : false,
  });
}

export function useAgentCustomerChat(
  customerId: string,
  params?: { profileId?: string; page?: number; limit?: number },
  enabled = true,
) {
  return useQuery({
    queryKey: agentKeys.customerChat(customerId, params),
    queryFn: () => agentService.getCustomerChat(customerId, params),
    enabled: !!customerId && enabled,
    refetchInterval: enabled ? 5_000 : false,
  });
}

export function useAgentCustomerAction(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      action,
      profileId,
      content,
    }: {
      action:
        | 'send-interest'
        | 'accept-interest'
        | 'decline-interest'
        | 'withdraw-interest'
        | 'favourite'
        | 'shortlist'
        | 'block'
        | 'unblock'
        | 'ignore'
        | 'notes'
        | 'mark-notifications-read';
      profileId?: string;
      content?: string;
    }) => {
      if (action === 'notes') {
        return agentService.addCustomerProfileNote(customerId, profileId || '', content || '');
      }
      if (action === 'mark-notifications-read') {
        return agentService.markCustomerNotificationsRead(customerId, profileId);
      }
      return agentService.customerProfileAction(customerId, action, profileId || '');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agentKeys.customerWorkspace(customerId) });
      qc.invalidateQueries({ queryKey: ['agent', 'customerWorkspaceMatches', customerId] });
      qc.invalidateQueries({ queryKey: agentKeys.recommendations(customerId) });
      qc.invalidateQueries({ queryKey: agentKeys.customerHistory(customerId) });
      qc.invalidateQueries({ queryKey: ['agent', 'customerNotifications', customerId] });
      qc.invalidateQueries({ queryKey: ['agent', 'customerChat', customerId] });
    },
  });
}

export function useSendAgentCustomerChatMessage(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { receiverId: string; content: string; type?: string; mediaUrl?: string }) =>
      agentService.sendCustomerChatMessage(customerId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent', 'customerChat', customerId] });
      qc.invalidateQueries({ queryKey: ['agent', 'customerNotifications', customerId] });
    },
  });
}
