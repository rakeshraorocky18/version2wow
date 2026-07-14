import agentApi from '../../lib/agentApi';
import type {
  AgentCustomer,
  AgentCustomerStatus,
  AgentDashboardStats,
  AgentDocument,
  AgentDocumentType,
  AgentNote,
  ActivityLog,
  CreateCustomerPayload,
  Paginated,
  WorksheetTask,
  WorksheetTaskStatus,
} from '../../types/agent';

export const agentService = {
  getDashboard: async (): Promise<AgentDashboardStats> => {
    const { data } = await agentApi.get('/agent/dashboard');
    return data;
  },

  getCustomers: async (params: {
    search?: string;
    status?: AgentCustomerStatus | '';
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }): Promise<Paginated<AgentCustomer>> => {
    const { data } = await agentApi.get('/agent/customers', { params });
    return data;
  },

  getCustomer: async (id: string): Promise<AgentCustomer> => {
    const { data } = await agentApi.get(`/agent/customers/${id}`);
    return data;
  },

  createCustomer: async (payload: CreateCustomerPayload): Promise<AgentCustomer> => {
    const { data } = await agentApi.post('/agent/customers', payload);
    return data;
  },

  updateCustomer: async (
    id: string,
    payload: Partial<CreateCustomerPayload>,
  ): Promise<AgentCustomer> => {
    const { data } = await agentApi.patch(`/agent/customers/${id}`, payload);
    return data;
  },

  getNotes: async (customerId: string): Promise<AgentNote[]> => {
    const { data } = await agentApi.get(`/agent/customers/${customerId}/notes`);
    return data;
  },

  addNote: async (customerId: string, content: string): Promise<AgentNote> => {
    const { data } = await agentApi.post(`/agent/customers/${customerId}/notes`, {
      content,
    });
    return data;
  },

  updateNote: async (noteId: string, content: string): Promise<AgentNote> => {
    const { data } = await agentApi.patch(`/agent/notes/${noteId}`, { content });
    return data;
  },

  deleteNote: async (noteId: string): Promise<void> => {
    await agentApi.delete(`/agent/notes/${noteId}`);
  },

  getDocuments: async (customerId: string): Promise<AgentDocument[]> => {
    const { data } = await agentApi.get(`/agent/customers/${customerId}/documents`);
    return data;
  },

  uploadDocument: async (
    customerId: string,
    type: AgentDocumentType,
    file: File,
  ): Promise<AgentDocument> => {
    const form = new FormData();
    form.append('type', type);
    form.append('file', file);
    const { data } = await agentApi.post(
      `/agent/customers/${customerId}/documents`,
      form,
    );
    return data;
  },

  getWorksheet: async (params?: {
    status?: WorksheetTaskStatus | '';
    dueDate?: string;
    page?: number;
    limit?: number;
  }): Promise<Paginated<WorksheetTask>> => {
    const { data } = await agentApi.get('/agent/worksheet', { params });
    return data;
  },

  createWorksheet: async (payload: Partial<WorksheetTask>): Promise<WorksheetTask> => {
    const { data } = await agentApi.post('/agent/worksheet', payload);
    return data;
  },

  updateWorksheet: async (
    id: string,
    payload: Partial<WorksheetTask>,
  ): Promise<WorksheetTask> => {
    const { data } = await agentApi.patch(`/agent/worksheet/${id}`, payload);
    return data;
  },

  deleteWorksheet: async (id: string): Promise<void> => {
    await agentApi.delete(`/agent/worksheet/${id}`);
  },

  getActivity: async (params?: {
    page?: number;
    limit?: number;
    customerId?: string;
  }): Promise<Paginated<ActivityLog>> => {
    const { data } = await agentApi.get('/agent/activity', { params });
    return data;
  },
};
