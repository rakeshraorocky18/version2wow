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
import type {
  AgentMatchProfile,
  AgentMatchSearchPayload,
  AgentMatchSearchResult,
  AgentRecommendationsResult,
} from '../../types/agentMatching';

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
    // Never send empty query strings — `status=` causes ValidationPipe 400.
    const queryParams: Record<string, string | number> = {};
    if (params.search) queryParams.search = params.search;
    if (params.status) queryParams.status = params.status;
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
    if (params.page != null) queryParams.page = params.page;
    if (params.limit != null) queryParams.limit = params.limit;

    const { data } = await agentApi.get('/agent/customers', {
      params: queryParams,
    });
    return data;
  },

  getCustomer: async (id: string): Promise<AgentCustomer> => {
    const { data } = await agentApi.get(`/agent/customers/${id}`);
    return data;
  },

  createCustomer: async (payload: CreateCustomerPayload): Promise<AgentCustomer> => {
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(
        ([, value]) => value !== '' && value !== undefined && value !== null,
      ),
    );
    const { data } = await agentApi.post('/agent/customers', cleanPayload);
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
    const queryParams: Record<string, string | number> = {};

    if (params?.status) queryParams.status = params.status;
    if (params?.dueDate) queryParams.dueDate = params.dueDate;
    if (params?.page != null) queryParams.page = params.page;
    if (params?.limit != null) queryParams.limit = params.limit;

    const { data } = await agentApi.get('/agent/worksheet', {
      params: queryParams,
    });

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

  searchCustomerMatches: async (
    customerId: string,
    payload: AgentMatchSearchPayload,
  ): Promise<AgentMatchSearchResult> => {
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => {
        if (value === '' || value === undefined || value === null) return false;
        if (value === false) return false;
        return true;
      }),
    );
    const { data } = await agentApi.post(
      `/agent/customers/${customerId}/matching/search`,
      cleanPayload,
    );
    return data;
  },

  getCustomerRecommendations: async (
    customerId: string,
  ): Promise<AgentRecommendationsResult> => {
    const { data } = await agentApi.get(
      `/agent/customers/${customerId}/matching/recommendations`,
    );
    return data;
  },

  getMatchProfile: async (customerId: string, matchedProfileId: string) => {
    const { data } = await agentApi.get(
      `/agent/customers/${customerId}/matching/profiles/${matchedProfileId}`,
    );
    return data as {
      viewerCustomerId: string;
      viewerCustomerName: string;
      profile: AgentMatchProfile & {
        personalDetails?: Record<string, unknown>;
        familyDetails?: Record<string, unknown>;
        educationDetails?: Record<string, unknown>;
        religionDetails?: Record<string, unknown>;
        partnerPreferences?: Record<string, unknown>;
        email?: string;
        address?: string;
        motherTongue?: string;
        dateOfBirth?: string | null;
      };
      documents: Array<{
        id: string;
        type: string;
        fileName: string;
        fileUrl: string;
        createdAt: string;
      }>;
    };
  },
};
