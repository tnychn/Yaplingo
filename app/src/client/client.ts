import axios, { AxiosError } from "axios";

import store, { $token } from "../store";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const client = axios.create({
  baseURL: API_URL,
  responseType: "json",
});

// attach token to every request
client.interceptors.request.use((config) => {
  const token = store.get($token);
  if (token) config.headers.setAuthorization(`Bearer ${token}`);
  return config;
});

// log error responses globally
client.interceptors.response.use(undefined, (error) => {
  if (error instanceof AxiosError) {
    // Only clear token for auth-related 401s (login, register, validate)
    // Don't clear for in-session 401s (like check-in) to avoid kicking user out mid-session
    const authEndpoints = ["/auth/login", "/auth/register", "/auth/validate", "/auth/user"];
    const url = error.config?.url || "";
    if (error.status === 401 && authEndpoints.some((ep) => url.includes(ep))) {
      store.set($token, "");
    }
    if (__DEV__) console.warn(`[API] ${error.config?.method?.toUpperCase()} ${url} → ${error.status}`);
  }
  return Promise.reject(error);
});

export default client;

export const createWebSocket = (endpoint: string): WebSocket => {
  const token = store.get($token);
  const url = `${API_URL.replace(/^http/, "ws")}/${endpoint}`;
  // @ts-expect-error: React Native WebSocket supports custom headers
  return new WebSocket(url, undefined, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
