import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ACCESS_KEY = 'faculty_ams_access';

let accessToken: string | null = localStorage.getItem(ACCESS_KEY);

export const tokenStore = {
  get: (): string | null => accessToken,
  set: (token: string | null): void => {
    accessToken = token;
    if (token) localStorage.setItem(ACCESS_KEY, token);
    else localStorage.removeItem(ACCESS_KEY);
  },
};

/** AuthContext registers a handler so a failed refresh can log the user out. */
let authFailureHandler: (() => void) | null = null;
export const setAuthFailureHandler = (fn: (() => void) | null): void => {
  authFailureHandler = fn;
};

export const api = axios.create({ baseURL: API_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Endpoints where a 401 is a legitimate outcome (not a stale-token situation).
const NON_REFRESHABLE = ['/auth/refresh', '/auth/login', '/auth/signup', '/auth/otp', '/auth/google'];

let refreshing: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const res = await axios.post<{ data: { accessToken: string } }>(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const token = res.data?.data?.accessToken ?? null;
    tokenStore.set(token);
    return token;
  } catch {
    tokenStore.set(null);
    return null;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    const isRefreshable = status === 401 && original && !original._retry && !NON_REFRESHABLE.some((u) => url.includes(u));

    if (isRefreshable) {
      original._retry = true;
      if (!refreshing) refreshing = refreshAccessToken();
      const token = await refreshing;
      refreshing = null;

      if (token) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      if (authFailureHandler) authFailureHandler();
    }

    return Promise.reject(error);
  }
);

/** Extracts a human-readable message from an axios error. */
export const getErrorMessage = (err: unknown, fallback = 'Something went wrong.'): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};
