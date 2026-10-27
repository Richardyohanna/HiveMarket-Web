import { apiFetch } from '../lib/apiClient';

export type AdminLocation = {
  country?: string | null;
  state?: string | null;
  lga?: string | null;
  address?: string | null;
};

export type AdminUserSummary = AdminLocation & {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  registeredAt: string;
  hasShop: boolean;
  isAdmin: boolean;
  registrationSource: string;
  status?: string | null;
  lastActiveAt?: string | null;
  reportCount?: number | null;
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

export type AdminShopSummary = AdminLocation & {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  status: string;
  registeredAt: string;
  shopType?: string | null;
  open?: boolean | null;
  productCount?: number | null;
  serviceCount?: number | null;
  reportCount?: number | null;
};

export type AdminShopDetail = AdminLocation & {
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
  reportCount?: number | null;
  country?: string | null;
  state?: string | null;
  lga?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image?: string | null;
  banner?: string | null;
  slogan?: string | null;
  website?: string | null;
  university?: string | null;
  areaName?: string | null;
  categories?: string[] | null;
  operatingMode?: 'FIXED' | 'FLEXIBLE' | null;
  openTime?: string | null;
  closingTime?: string | null;
  serviceCount?: number;
  gpsCoordinates?: { latitude?: number | null; longitude?: number | null } | null;
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

export type AdminReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
export type AdminReportCategory =
  | 'FRAUD'
  | 'FAKE_PRODUCT'
  | 'PROHIBITED_GOODS'
  | 'HARASSMENT'
  | 'SPAM'
  | 'IMPERSONATION'
  | 'MISLEADING_SHOP'
  | 'SUSPICIOUS_ACTIVITY'
  | 'OTHER';

export type AdminReportSummary = {
  id: string;
  reporterName: string | null;
  reporterEmail: string | null;
  reportedEntityType: 'USER' | 'SHOP' | 'PRODUCT' | string;
  reportedUserName: string | null;
  reportedShopName: string | null;
  reportedProductName: string | null;
  category: string | null;
  description: string | null;
  evidence: string | null;
  submittedAt: string | null;
  status: AdminReportStatus | string;
  assignedAdminName: string | null;
  decision: string | null;
  actionTaken: string | null;
  resolvedAt: string | null;
};

export type AdminReportDetail = AdminReportSummary & {
  reporterId?: string | null;
  reportedUserId?: string | null;
  reportedShopId?: string | null;
  reportedProductId?: string | null;
  evidenceItems?: Array<{ label?: string; url?: string | null; type?: string | null }>;
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

export type AdminShopProduct = {
  id: string;
  pName: string;
  pDetail: string;
  pAmount: number;
  pCondition: string;
  pQuantity: number;
  category: string;
  imageUrls?: string[];
};

export type AdminShopService = {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  duration?: string | null;
  availability?: string | null;
};

export type AdminShopUpdatePayload = {
  name: string;
  phone: string;
  address: string;
  country: string;
  state: string;
  lga: string;
  latitude?: number | null;
  longitude?: number | null;
  isOpen: boolean;
  slogan?: string;
  website?: string;
  university?: string;
  areaName?: string;
  operatingMode?: 'FIXED' | 'FLEXIBLE';
  openTime?: string;
  closingTime?: string;
  image?: File | null;
  banner?: File | null;
};

export function getNigeriaLocations() {
  return apiFetch<Record<string, string[]>>('/api/locations/nigeria', { skipAuth: true });
}

export type CreateUserPayload = {
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
};

export function createUser(payload: CreateUserPayload) {
  return apiFetch<AdminUserSummary>('/api/admin/users', { method: 'POST', body: payload });
}

export function resetPhoneOwnerPassword(userId: string, temporaryPassword: string) {
  return apiFetch<void>(`/api/admin/users/${encodeURIComponent(userId)}/reset-password`, {
    method: 'POST',
    body: { temporaryPassword },
  });
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
  country: string;
  state: string;
  lga: string;
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
  form.append('country', payload.country);
  form.append('state', payload.state);
  form.append('lga', payload.lga);
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

export function updateAdminShop(id: string, payload: AdminShopUpdatePayload) {
  const form = new FormData();
  form.append('name', payload.name);
  form.append('phone', payload.phone);
  form.append('address', payload.address);
  form.append('country', payload.country);
  form.append('state', payload.state);
  form.append('lga', payload.lga);
  form.append('isOpen', String(payload.isOpen));
  if (payload.latitude != null) form.append('latitude', String(payload.latitude));
  if (payload.longitude != null) form.append('longitude', String(payload.longitude));
  if (payload.slogan != null) form.append('slogan', payload.slogan);
  if (payload.website != null) form.append('website', payload.website);
  if (payload.university != null) form.append('university', payload.university);
  if (payload.areaName != null) form.append('areaName', payload.areaName);
  if (payload.operatingMode) form.append('operatingMode', payload.operatingMode);
  if (payload.openTime) form.append('openTime', payload.openTime);
  if (payload.closingTime) form.append('closingTime', payload.closingTime);
  if (payload.image) form.append('image', payload.image);
  if (payload.banner) form.append('banner', payload.banner);

  return apiFetch(`/api/shop/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: form,
    isFormData: true,
  });
}

export function getAdminShopProducts(shopId: string) {
  return apiFetch<AdminShopProduct[]>(
    `/api/products/shop/all?shopId=${encodeURIComponent(shopId)}`,
  );
}

export function getAdminShopServices(shopId: string) {
  return apiFetch<AdminShopService[]>(`/api/shops/${encodeURIComponent(shopId)}/services`);
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

export function getAdminReports(params: {
  query?: string;
  status?: string;
  category?: string;
  entityType?: string;
  page?: number;
  size?: number;
}) {
  return apiFetch<AdminPage<AdminReportSummary>>(`/api/admin/console/reports?${consoleQuery(params)}`);
}

export function getAdminReportDetail(id: string) {
  return apiFetch<AdminReportDetail>(`/api/admin/console/reports/${encodeURIComponent(id)}`);
}

export function updateReportStatus(id: string, update: {
  status?: string;
  decision?: string;
  actionTaken?: string;
  reason?: string;
  adminId?: string;
}) {
  return apiFetch<AdminReportDetail>(`/api/admin/console/reports/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    body: update,
  });
}

export function issueWarning(payload: {
  userId?: string | null;
  shopId?: string | null;
  category: string;
  explanation: string;
  reportId?: string | null;
  remediation?: string | null;
}) {
  return apiFetch<{ id: string }>(`/api/admin/moderation/warnings`, {
    method: 'POST',
    body: payload,
  });
}

export function suspendUser(userId: string, reason: string, adminId?: string) {
  return apiFetch<void>(`/api/admin/moderation/users/${encodeURIComponent(userId)}/suspend`, {
    method: 'POST',
    body: { reason, adminId },
  });
}

export function banUser(userId: string, reason: string, adminId?: string) {
  return apiFetch<void>(`/api/admin/moderation/users/${encodeURIComponent(userId)}/ban`, {
    method: 'POST',
    body: { reason, adminId },
  });
}

export function restoreUser(userId: string, adminId?: string) {
  return apiFetch<void>(`/api/admin/moderation/users/${encodeURIComponent(userId)}/restore`, {
    method: 'POST',
    body: { adminId },
  });
}

export function sendAdminRequestReminder(id: string) {
  return apiFetch<void>(`/api/admin/console/requests/${encodeURIComponent(id)}/remind`, { method: 'POST' });
}

// Reuses the authenticated product endpoint; the backend allows the shop owner
// or an administrator to manage products associated with the shop.

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

export function updateAdminShopProduct(id: string, payload: CreateProductPayload) {
  return apiFetch<ProductResponse>(`/api/products?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteAdminShopProduct(id: string) {
  return apiFetch<void>(`/api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
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

export function updateAdminShopService(id: string, payload: CreateServicePayload) {
  return apiFetch<{ id: string; name: string }>(`/api/services/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteAdminShopService(id: string) {
  return apiFetch<void>(`/api/services/${encodeURIComponent(id)}`, { method: 'DELETE' });
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
