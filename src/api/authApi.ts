import { apiFetch } from '../lib/apiClient';

export type MeResponse = {
  userId: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
};

type TokenPair = { token: string; refreshToken: string };

export function login(email: string, password: string) {
  return apiFetch<TokenPair>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuth: true,
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
