import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string, phone?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,

  login: async (email: string, password: string) => {
  set({ isLoading: true });

  try {
    const { data } = await api.post('/auth/login', {
      email,
      password,
    });

    // Debug logs
    console.log("Login API Response:", data);

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    console.log("Access Token:", localStorage.getItem("accessToken"));
    console.log("Refresh Token:", localStorage.getItem("refreshToken"));
    console.log("User:", localStorage.getItem("user"));

    set({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
    });

    console.log("isAuthenticated set to true");
  } catch (error) {
    console.error("Login Error:", error);
    set({ isLoading: false });
    throw error;
  }
},

  register: async (email: string, password: string, role: string, phone?: string) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/register', { email, password, role, phone });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user: User) => set({ user }),
}));
