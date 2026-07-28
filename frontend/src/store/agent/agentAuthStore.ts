import { create } from 'zustand';
import agentApi from '../../lib/agentApi';
import type { AgentUser } from '../../types/agent';

interface AgentAuthState {
  user: AgentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    employeeCode?: string;
  }) => Promise<void>;
  logout: () => void;
  setUser: (user: AgentUser) => void;
  updateProfile: (payload: { firstName?: string; lastName?: string; phone?: string; profileImageUrl?: string | null }) => Promise<AgentUser>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deactivateAccount: () => Promise<void>;
}

let agentUser: AgentUser | null = null;
try {
  const stored = localStorage.getItem('agentUser');
  if (stored && stored !== 'undefined' && stored !== 'null') {
    agentUser = JSON.parse(stored);
  }
} catch {
  agentUser = null;
}

export const useAgentAuthStore = create<AgentAuthState>((set) => ({
  user: agentUser,
  isAuthenticated: !!localStorage.getItem('agentAccessToken'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await agentApi.post('/agent/login', { email, password });
      localStorage.setItem('agentAccessToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('agentRefreshToken', data.refreshToken);
      }
      localStorage.setItem('agentUser', JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (payload) => {
    set({ isLoading: true });
    try {
      const { data } = await agentApi.post('/agent/register', payload);
      localStorage.setItem('agentAccessToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('agentRefreshToken', data.refreshToken);
      }
      localStorage.setItem('agentUser', JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('agentAccessToken');
    localStorage.removeItem('agentRefreshToken');
    localStorage.removeItem('agentUser');
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => {
    localStorage.setItem('agentUser', JSON.stringify(user));
    set({ user });
  },

  updateProfile: async (payload) => {
    const { data } = await agentApi.patch('/agent/me', payload);
    localStorage.setItem('agentUser', JSON.stringify(data));
    set({ user: data });
    return data;
  },

  changePassword: async (currentPassword, newPassword) => {
    await agentApi.post('/agent/change-password', { currentPassword, newPassword });
  },

  deactivateAccount: async () => {
    await agentApi.post('/agent/deactivate');
    localStorage.removeItem('agentAccessToken');
    localStorage.removeItem('agentRefreshToken');
    localStorage.removeItem('agentUser');
    set({ user: null, isAuthenticated: false });
  },
}));
