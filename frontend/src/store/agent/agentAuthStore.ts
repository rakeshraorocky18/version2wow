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

  setUser: (user) => set({ user }),
}));
