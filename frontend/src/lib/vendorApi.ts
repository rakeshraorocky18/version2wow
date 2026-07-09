import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const vendorApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

vendorApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("vendorAccessToken");

  console.log("Vendor Token:", token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default vendorApi;