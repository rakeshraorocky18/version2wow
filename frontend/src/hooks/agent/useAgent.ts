import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentService } from '../../services/agent/agentService';
import type {
  AgentCustomerStatus,
  CreateCustomerPayload,
  WorksheetTask,
  WorksheetTaskStatus,
  AgentDocumentType,
} from '../../types/agent';

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
