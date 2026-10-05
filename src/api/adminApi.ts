import { apiFetch } from '../lib/apiClient';

export type AdminUserSummary = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  registeredAt: string;
  hasShop: boolean;
  isAdmin: boolean;
};

export type AdminUserDetail = Omit<AdminUserSummary, 'registeredAt'> & {
  role: string | null;
  enabled: boolean;
  online: boolean;
  registeredAt: string | null;
  lastLoginAt: string | null;
  deletionStatus: string | null;
  shopName: string | null;
  shopId: string | null;
};

export type AdminShopSummary = {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  status: string;
  registeredAt: string;
};

export type AdminShopDetail = {
  id: string;
  name: string;
  ownerName: string | null;
  ownerEmail: string | null;
  phone: string | null;
  shopType: string | null;
  address: string | null;
  open: boolean;
  verified: boolean;
  productCount: number;
  registeredAt: string | null;
  deletionStatus: string | null;
};

export type AdminPage<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type AdminDashboardMetrics = {
  totalUsers: number;
  activeUsers: number;
  onlineUsers: number;
  usersToday: number;
  usersThisWeek: number;
  usersThisMonth: number;
  totalShops: number;
  openShops: number;
  shopsToday: number;
  shopsThisWeek: number;
  shopsThisMonth: number;
  totalProducts: number;
  activeProducts: number;
  totalRequests: number;
  pendingRequests: number;
  openSupportRequests: number;
  suggestions: number;
  pendingReports: number;
  pendingDeletionRequests: number;
  scheduledDeletionRequests: number;
};

export type AdminAnalyticsPoint = {
  date: string;
  users: number;
  shops: number;
  requests: number;
  supportRequests: number;
  feedback: number;
};

export type AdminRequest = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  shopId: string;
  shopName: string;
  shopOwnerName: string;
  shopOwnerEmail: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  customerConfirmed: boolean;
  shopConfirmed: boolean;
  lastAdminReminderAt: string | null;
};

export type AdminSupportRequest = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  topic: string;
  subject: string;
  message: string;
  status: string;
  priority: number;
  response: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type AdminFeedback = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  category: string;
  message: string | null;
  createdAt: string;
};

export type AdminAuditEntry = {
  id: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: string | null;
  createdAt: string;
};

export type ShopResponse = {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  website: string | null;
  location: { address: string; latitude: number; longitude: number };
  imageUrl: string | null;
  banner: string | null;
  slogan: string | null;
  shopType: string;
  categories: string[];
  university: string | null;
  areaName: string | null;
  operatingMode: 'FIXED' | 'FLEXIBLE' | null;
  [key: string]: unknown;
};

export type CreateUserPayload = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

export function createUser(payload: CreateUserPayload) {
  return apiFetch<AdminUserSummary>('/api/admin/users', { method: 'POST', body: payload });
}

export function searchUsers(query: string) {
  return apiFetch<AdminUserSummary[]>(`/api/admin/users?query=${encodeURIComponent(query)}`);
}

export type CreateShopPayload = {
  userId: string;
  name: string;
  phone: string;
  slogan?: string;
  shopType: string;
  categories: string[];
  university?: string;
  areaName?: string;
  website?: string;
  customShopType?: string;
  openingTime?: string; // formatted "h:mm a"
  closingTime?: string;
  operatingMode?: 'FIXED' | 'FLEXIBLE';
  address: string;
  latitude: number;
  longitude: number;
  image?: File | null;
  banner?: File | null;
};

export function createShop(payload: CreateShopPayload) {
  const form = new FormData();
  form.append('userId', payload.userId);
  form.append('name', payload.name);
  form.append('phone', payload.phone);
  form.append('shopType', payload.shopType);
  form.append('address', payload.address);
  form.append('latitude', String(payload.latitude));
  form.append('longitude', String(payload.longitude));
  if (payload.slogan) form.append('slogan', payload.slogan);
  if (payload.university) form.append('university', payload.university);
  if (payload.areaName) form.append('areaName', payload.areaName);
  if (payload.website) form.append('website', payload.website);
  if (payload.customShopType) form.append('customShopType', payload.customShopType);
  if (payload.openingTime) form.append('openingTime', payload.openingTime);
  if (payload.closingTime) form.append('closingTime', payload.closingTime);
  if (payload.operatingMode) form.append('operatingMode', payload.operatingMode);
  payload.categories.forEach((category) => form.append('categories', category));
  if (payload.image) form.append('image', payload.image);
  if (payload.banner) form.append('banner', payload.banner);

  return apiFetch<ShopResponse>('/api/admin/shops', { method: 'POST', body: form, isFormData: true });
}

export function searchShops(query: string) {
  return apiFetch<AdminShopSummary[]>(`/api/admin/shops?query=${encodeURIComponent(query)}`);
}

function consoleQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  return search.toString();
}

export function getAdminDashboard() {
  return apiFetch<AdminDashboardMetrics>('/api/admin/console/dashboard');
}

export function getAdminAnalytics(days = 30) {
  return apiFetch<AdminAnalyticsPoint[]>(`/api/admin/console/analytics?days=${days}`);
}

export function getAdminUsers(params: {
  query?: string; enabled?: boolean; shopOwner?: boolean; page?: number; size?: number;
}) {
  return apiFetch<AdminPage<AdminUserSummary>>(`/api/admin/console/users?${consoleQuery(params)}`);
}

export function getAdminUserDetail(id: string) {
  return apiFetch<AdminUserDetail>(`/api/admin/console/users/${encodeURIComponent(id)}`);
}

export function getAdminShops(params: { query?: string; page?: number; size?: number }) {
  return apiFetch<AdminPage<AdminShopSummary>>(`/api/admin/console/shops?${consoleQuery(params)}`);
}

export function getAdminShopDetail(id: string) {
  return apiFetch<AdminShopDetail>(`/api/admin/console/shops/${encodeURIComponent(id)}`);
}

export function getAdminRequests(params: { query?: string; status?: string; page?: number; size?: number }) {
  return apiFetch<AdminPage<AdminRequest>>(`/api/admin/console/requests?${consoleQuery(params)}`);
}

export function getAdminSupport(params: { status?: string; page?: number; size?: number }) {
  return apiFetch<AdminPage<AdminSupportRequest>>(`/api/admin/console/support?${consoleQuery(params)}`);
}

export function updateAdminSupport(id: string, update: { status?: string; response?: string; priority?: number }) {
  return apiFetch(`/api/admin/console/support/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: update,
  });
}

export function getAdminFeedback(params: { category?: string; page?: number; size?: number }) {
  return apiFetch<AdminPage<AdminFeedback>>(`/api/admin/console/feedback?${consoleQuery(params)}`);
}

export function getAdminAudit(params: { page?: number; size?: number }) {
  return apiFetch<AdminPage<AdminAuditEntry>>(`/api/admin/console/audit?${consoleQuery(params)}`);
}

export function sendAdminRequestReminder(id: string) {
  return apiFetch<void>(`/api/admin/console/requests/${encodeURIComponent(id)}/remind`, { method: 'POST' });
}

// --- Product registration (reuses the existing authenticated product endpoint;
// when shopId is supplied, the backend attaches the product to that shop
// regardless of which account created it, which is exactly what the admin
// console needs - no dedicated admin product endpoint exists or is required). ---

export type CreateProductPayload = {
  pName: string;
  pDetail: string;
  pAmount: number;
  pDiscount?: number;
  pCondition: 'NEW' | 'USED';
  pQuantity: number;
  category: string;
  shopId: string;
};

export type ProductResponse = {
  id: string;
  pName: string;
  [key: string]: unknown;
};

export function createProduct(payload: CreateProductPayload) {
  return apiFetch<ProductResponse>('/api/products', { method: 'POST', body: payload });
}

// Reuses the existing authenticated shop-service endpoint.
export type CreateServicePayload = {
  name: string;
  description: string;
  price: number;
  duration?: string;
  availability?: string;
};

export function createShopService(shopId: string, payload: CreateServicePayload) {
  return apiFetch<{ id: string; name: string }>(`/api/shops/${encodeURIComponent(shopId)}/services`, {
    method: 'POST',
    body: payload,
  });
}

export function uploadProductImages(productId: string, images: File[]) {
  const form = new FormData();
  images.forEach((image) => form.append('images', image));
  return apiFetch(`/api/products/${encodeURIComponent(productId)}/images`, {
    method: 'POST',
    body: form,
    isFormData: true,
  });
}
