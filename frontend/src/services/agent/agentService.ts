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

export type AgentRelationshipStatus =
  | 'none'
  | 'recommended'
  | 'pending_sent'
  | 'pending_received'
  | 'accepted'
  | 'declined'
  | 'withdrawn'
  | 'blocked'
  | 'ignored';

export type AgentCustomerWorkspaceProfile = AgentMatchProfile & {
  relationshipId?: string | null;
  relationshipStatus?: AgentRelationshipStatus;
  favourite?: boolean;
  shortlisted?: boolean;
  blocked?: boolean;
  ignored?: boolean;
  accepted?: boolean;
  notesCount?: number;
};

export type AgentCustomerWorkspace = {
  customer: AgentCustomer & {
    profileImageUrl?: string | null;
    matchCompletionThreshold?: number;
    matchmakingUnlocked?: boolean;
  };
  stats: {
    matchCount: number;
    pendingRequests: number;
    acceptedMatches: number;
  };
};

export type AgentCustomerHistoryCard = {
  relationship: {
    id: string;
    status: AgentRelationshipStatus;
    favourite: boolean;
    shortlisted: boolean;
    blocked: boolean;
    ignored: boolean;
    notes?: Array<{ id: string; content: string; createdAt: string }>;
    updatedAt: string;
  };
  profile: AgentCustomer & {
    name: string;
    profileImageUrl?: string | null;
  };
};

export type AgentCustomerHistory = {
  friends: AgentCustomerHistoryCard[];
  requestsReceived: AgentCustomerHistoryCard[];
  requestsSent: AgentCustomerHistoryCard[];
  shortlisted: AgentCustomerHistoryCard[];
  blocked: AgentCustomerHistoryCard[];
  declined: AgentCustomerHistoryCard[];
};

export type AgentCustomerNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  status: string;
  data?: Record<string, unknown> | null;
  createdAt: string;
};

export type AgentCustomerChatContact = {
  userId: string;
  name: string;
  subtitle: string;
  onlineStatus: boolean;
  unreadCount: number;
};

export type AgentCustomerChatMessage = {
  id?: string;
  _id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  type?: string;
  mediaUrl?: string;
  isRead?: boolean;
  createdAt?: string;
};

export type AgentCustomerChat = {
  contacts: AgentCustomerChatContact[];
  activeProfileId?: string;
  messages: {
    messages: AgentCustomerChatMessage[];
    total: number;
  };
};

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
        relationshipId?: string | null;
        relationshipStatus?: AgentRelationshipStatus | 'none';
        favourite?: boolean;
        shortlisted?: boolean;
        blocked?: boolean;
        ignored?: boolean;
        accepted?: boolean;
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

  getCustomerWorkspace: async (
    customerId: string,
  ): Promise<AgentCustomerWorkspace> => {
    const { data } = await agentApi.get(`/agent/customers/${customerId}/workspace`);
    return data;
  },

  getCustomerMatches: async (
    customerId: string,
    params: AgentMatchSearchPayload,
  ): Promise<AgentMatchSearchResult & { data: AgentCustomerWorkspaceProfile[] }> => {
    const { data } = await agentApi.get(`/agent/customers/${customerId}/matches`, {
      params,
    });
    return data;
  },

  getCustomerHistory: async (
    customerId: string,
  ): Promise<AgentCustomerHistory> => {
    const { data } = await agentApi.get(`/agent/customers/${customerId}/history`);
    return data;
  },

  getCustomerNotifications: async (
    customerId: string,
    params?: { page?: number; limit?: number },
  ): Promise<Paginated<AgentCustomerNotification>> => {
    const { data } = await agentApi.get(`/agent/customers/${customerId}/notifications`, {
      params,
    });
    return data;
  },

  markCustomerNotificationsRead: async (
    customerId: string,
    notificationId?: string,
  ): Promise<{ success: boolean }> => {
    const { data } = await agentApi.post(`/agent/customers/${customerId}/notifications/read`, {
      notificationId,
    });
    return data;
  },

  getCustomerChat: async (
    customerId: string,
    params?: { profileId?: string; page?: number; limit?: number },
  ): Promise<AgentCustomerChat> => {
    const { data } = await agentApi.get(`/agent/customers/${customerId}/chat`, {
      params,
    });
    return data;
  },

  sendCustomerChatMessage: async (
    customerId: string,
    payload: { receiverId: string; content: string; type?: string; mediaUrl?: string },
  ): Promise<AgentCustomerChatMessage> => {
    const { data } = await agentApi.post(`/agent/customers/${customerId}/chat/messages`, payload);
    return data;
  },

  customerProfileAction: async (
    customerId: string,
    action:
      | 'send-interest'
      | 'accept-interest'
      | 'decline-interest'
      | 'withdraw-interest'
      | 'favourite'
      | 'shortlist'
      | 'block'
      | 'unblock'
      | 'ignore',
    profileId: string,
  ) => {
    const { data } = await agentApi.post(`/agent/customers/${customerId}/${action}`, {
      profileId,
    });
    return data;
  },

  addCustomerProfileNote: async (
    customerId: string,
    profileId: string,
    content: string,
  ) => {
    const { data } = await agentApi.post(`/agent/customers/${customerId}/notes`, {
      profileId,
      content,
    });
    return data;
  },

  getPublicProfile: async (profileId: string) => {
    const { data } = await agentApi.get(`/public/profile/${profileId}`);
    return data;
  },

};
