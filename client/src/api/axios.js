import axios from "axios";

// AUTOMATIC SWITCHING & PATH NORMALIZATION:
// 1. If deployed to Vercel, it uses VITE_API_URL.
// 2. If running locally, it defaults to http://localhost:5000/api.
// Ensures /api prefix is present so endpoints like /auth/login route correctly.
let rawUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
rawUrl = rawUrl.replace(/\/+$/, ""); // remove trailing slash
const BASE_URL = rawUrl.endsWith("/api") ? rawUrl : `${rawUrl}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: capture 403 Forbidden and broadcast to UI banner
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      const message = error.response.data?.message || "Forbidden: Access denied";
      window.dispatchEvent(new CustomEvent("orbit:forbidden", { detail: message }));
    }
    return Promise.reject(error);
  }
);

export default api;
