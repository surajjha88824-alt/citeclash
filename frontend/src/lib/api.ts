import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT access token automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("citeclash_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 and 402 responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired
    } else if (error.response?.status === 402) {
      // 402 Payment Required: trigger sleek Upgrade Modal
      const message = error.response.data?.error?.message || "Plan limit reached. Please upgrade to continue.";
      window.dispatchEvent(new CustomEvent("citeclash_plan_limit_exceeded", { detail: { message } }));
    }
    return Promise.reject(error);
  }
);
