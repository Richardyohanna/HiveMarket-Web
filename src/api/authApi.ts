import { apiFetch } from '../lib/apiClient';

export type MeResponse = {
  userId: string;
  email?: string;
  phone?: string;
  fullName: string;
  isAdmin: boolean;
  mustChangePassword: boolean;
};

type TokenPair = { token: string; refreshToken: string; mustChangePassword?: boolean };

export function login(identifier: string, password: string) {
  const identity = identifier.trim();
  return apiFetch<TokenPair>('/api/auth/login', {
    method: 'POST',
    body: identity.includes('@') ? { email: identity, password } : { phone: identity, password },
    skipAuth: true,
  });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiFetch<TokenPair>('/api/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
}

export function register(payload: { fullName: string; email: string; phone: string; password: string }) {
  return apiFetch<{ success: boolean; requiresEmailVerification: boolean; message: string }>(
    '/api/auth/register',
    { method: 'POST', body: payload, skipAuth: true },
  );
}

export function verifyEmail(email: string, verificationCode: string) {
  return apiFetch<TokenPair & { userId: string; email: string }>('/api/auth/register/verify-email', {
    method: 'POST',
    body: { email, verificationCode },
    skipAuth: true,
  });
}

export function resendVerificationCode(email: string) {
  return apiFetch<{ success: boolean; message: string }>('/api/auth/register/resend-code', {
    method: 'POST',
    body: { email },
    skipAuth: true,
  });
}

export function forgotPassword(email: string) {
  return apiFetch<{ message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
    skipAuth: true,
  });
}

export function resetPassword(email: string, otp: string, newPassword: string) {
  return apiFetch<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: { email, otp, newPassword },
    skipAuth: true,
  });
}

export function fetchMe() {
  return apiFetch<MeResponse>('/api/auth/me');
}
