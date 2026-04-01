import { API_BASE_URL } from '@/config/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  planId?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: AuthUser;
  };
  message?: string;
}

// ─── Key used everywhere for the JWT token ───────────────────────────────────
const TOKEN_KEY = 'auth_token';
const USER_KEY  = 'user';

// All localStorage keys written by the app (payment flow, temp data, etc.)
const ALL_AUTH_KEYS = [
  TOKEN_KEY,
  USER_KEY,
  'authToken',           // legacy key
  'temp_user_id',
  'temp_user_email',
  'temp_user_firstName',
  'temp_user_lastName',
  'temp_user_phone',
  'temp_user_password',
  'temp_user_data',
  'user_selected_plan_id',
  'user_selected_plan_price',
  'user_selected_plan_name',
  'recent_plan_id',
  'recent_plan_price',
  'recent_plan_name',
  'selectedPlanId',
  'selectedPlanIsFree',
];

/**
 * FIX 6.2.8 — Fully clear all auth-related keys so repeated login/logout
 * never hits stale data.
 */
export const clearAllAuthData = (): void => {
  ALL_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const getStoredToken = (): string | null =>
  localStorage.getItem(TOKEN_KEY) || localStorage.getItem('authToken');

export const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const storeAuthData = (token: string, user: AuthUser): void => {
  // Always write to the canonical keys
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    // FIX 6.2.8 — clear stale data BEFORE login so a second login is always fresh
    clearAllAuthData();

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, message: result.message || 'Login failed' };
    }

    storeAuthData(result.data.token, result.data.user);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Network error during login' };
  }
};

export const logout = (): void => {
  // FIX 6.2.8 — wipe every key so the next login starts from a clean state
  clearAllAuthData();
};

export const isAuthenticated = (): boolean => {
  const token = getStoredToken();
  if (!token) return false;

  // Basic JWT expiry check (no library needed)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      clearAllAuthData(); // expired → clean up
      return false;
    }
    return true;
  } catch {
    return !!token; // fallback: trust presence
  }
};