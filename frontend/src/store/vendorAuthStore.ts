import { create } from "zustand";
import vendorApi from "../lib/vendorApi";

interface VendorUser {
  id: string;
  email: string;
  businessName: string;
  role?: string;
}

interface VendorAuthState {
  user: VendorUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;

  register: (
    businessName: string,
    category: string,
    email: string,
    password: string,
    phone: string
  ) => Promise<void>;

  logout: () => void;

  setUser: (user: VendorUser) => void;
}

// Read localStorage BEFORE creating the store
let vendorUser: VendorUser | null = null;

try {
  const stored = localStorage.getItem("vendorUser");

  if (
    stored &&
    stored !== "undefined" &&
    stored !== "null"
  ) {
    vendorUser = JSON.parse(stored);
  }
} catch {
  vendorUser = null;
}

export const useVendorAuthStore = create<VendorAuthState>((set) => ({
  user: vendorUser,

  isAuthenticated: !!localStorage.getItem("vendorAccessToken"),

  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });

    try {
      const { data } = await vendorApi.post("/vendor-auth/login", {
        email,
        password,
      });

      localStorage.setItem(
        "vendorAccessToken",
        data.accessToken
      );

      localStorage.setItem(
        "vendorRefreshToken",
        data.refreshToken
      );

      localStorage.setItem(
        "vendorUser",
        JSON.stringify(data.user)
      );

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (
    businessName,
    category,
    email,
    password,
    phone
  ) => {
    set({ isLoading: true });

    try {
      const { data } = await vendorApi.post("/vendor-auth/register", {
        businessName,
        category,
        email,
        password,
        phone,
      });

      localStorage.setItem(
        "vendorAccessToken",
        data.accessToken
      );

      localStorage.setItem(
        "vendorUser",
        JSON.stringify(data.user)
      );

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("vendorAccessToken");
    localStorage.removeItem("vendorRefreshToken");
    localStorage.removeItem("vendorUser");

    set({
      user: null,
      isAuthenticated: false,
    });
  },

  setUser: (user) => set({ user }),
}));