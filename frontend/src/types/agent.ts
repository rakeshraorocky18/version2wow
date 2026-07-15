export type AgentCustomerStatus = 'draft' | 'pending' | 'active' | 'inactive';

export type WorksheetTaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type WorksheetPriority = 'low' | 'medium' | 'high';

export type AgentDocumentType =
  | 'aadhaar'
  | 'pan'
  | 'passport'
  | 'horoscope'
  | 'education_certificate'
  | 'income_proof'
  | 'customer_photo'
  | 'profile_photo'
  | 'other';

export interface AgentUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string;
  employeeCode: string;
  name: string;
}

export interface AgentCustomer {
  id: string;
  customerCode: string;
  firstName: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  religion?: string;
  caste?: string;
  motherTongue?: string;
  occupation?: string;
  education?: string;
  personalDetails?: Record<string, unknown>;
  familyDetails?: Record<string, unknown>;
  educationDetails?: Record<string, unknown>;
  religionDetails?: Record<string, unknown>;
  partnerPreferences?: Record<string, unknown>;
  status: AgentCustomerStatus;
  profileCompletion: number;
  assignedAgentId: string;
  createdByAgentId: string;
  createdAt: string;
  updatedAt: string;
  documents?: AgentDocument[];
  /** Primary profile image URL from uploaded profile photo */
  profileImageUrl?: string | null;
}

export interface AgentNote {
  id: string;
  customerId: string;
  agentId: string;
  content: string;
  agentName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentDocument {
  id: string;
  customerId: string;
  agentId: string;
  type: AgentDocumentType;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  createdAt: string;
}

export interface WorksheetTask {
  id: string;
  agentId: string;
  customerId?: string;
  customerName?: string | null;
  title: string;
  description?: string;
  priority: WorksheetPriority;
  dueDate?: string;
  status: WorksheetTaskStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  agentId: string;
  customerId?: string;
  action: string;
  description: string;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AgentDashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  profileCompletionPercentage: number;
  pendingProfiles: number;
  todaysTasks: number;
  overdueTasks: number;
  recentlyAddedCustomers: AgentCustomer[];
  todayPendingTasks: WorksheetTask[];
  recentActivities: ActivityLog[];
}

export interface CreateCustomerPayload {
  firstName: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  religion?: string;
  caste?: string;
  motherTongue?: string;
  occupation?: string;
  education?: string;
  personalDetails?: Record<string, unknown>;
  familyDetails?: Record<string, unknown>;
  educationDetails?: Record<string, unknown>;
  religionDetails?: Record<string, unknown>;
  partnerPreferences?: Record<string, unknown>;
  status?: AgentCustomerStatus;
}
