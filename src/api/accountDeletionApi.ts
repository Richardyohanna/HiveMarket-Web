import { apiFetch } from '../lib/apiClient';

export type DeletionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | string;

export type DeletionStatusResponse = {
  success: boolean;
  hasPendingRequest: boolean;
  status: DeletionStatus | null;
  reason: string | null;
  reasonDetails: string | null;
  requestedAt: string | null;
  confirmedAt: string | null;
  scheduledDeletionDate: string | null;
  daysRemaining: number | null;
  canCancel: boolean;
};

export type DeletionActionResponse = {
  success: boolean;
  message: string;
  status: DeletionStatus | null;
  scheduledDeletionDate: string | null;
};

// --- Account (user) deletion ---

export function requestAccountDeletion(reason: string, reasonDetails?: string) {
  return apiFetch<DeletionActionResponse>('/api/account-deletion/request', {
    method: 'POST',
    body: { reason, reasonDetails: reasonDetails || null },
  });
}

export function getAccountDeletionStatus() {
  return apiFetch<DeletionStatusResponse>('/api/account-deletion/status');
}

export function cancelAccountDeletion() {
  return apiFetch<DeletionActionResponse>('/api/account-deletion/cancel', { method: 'POST' });
}

// Public endpoint - hit from the emailed confirmation link, no auth required.
export function confirmAccountDeletion(token: string) {
  return apiFetch<DeletionActionResponse>('/api/account-deletion/confirm', {
    method: 'POST',
    body: { token },
    skipAuth: true,
  });
}

// --- Shop deletion ---

export function requestShopDeletion(shopId: string, reason: string, reasonDetails?: string) {
  return apiFetch<DeletionActionResponse>('/api/shop-deletion/request', {
    method: 'POST',
    body: { shopId, reason, reasonDetails: reasonDetails || null },
  });
}

export type OwnedShopSummary = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export function getMyShops() {
  return apiFetch<OwnedShopSummary[]>('/api/shop/mine');
}

export function getShopDeletionStatus(shopId: string) {
  return apiFetch<DeletionStatusResponse>(`/api/shop-deletion/status/${encodeURIComponent(shopId)}`);
}

export function cancelShopDeletion(shopId: string) {
  return apiFetch<DeletionActionResponse>(`/api/shop-deletion/cancel/${encodeURIComponent(shopId)}`, {
    method: 'POST',
  });
}

export function confirmShopDeletion(token: string) {
  return apiFetch<DeletionActionResponse>('/api/shop-deletion/confirm', {
    method: 'POST',
    body: { token },
    skipAuth: true,
  });
}
