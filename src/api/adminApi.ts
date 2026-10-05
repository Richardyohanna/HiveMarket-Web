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

export type AdminShopSummary = {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  status: string;
  registeredAt: string;
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

export function uploadProductImages(productId: string, images: File[]) {
  const form = new FormData();
  images.forEach((image) => form.append('images', image));
  return apiFetch(`/api/products/${encodeURIComponent(productId)}/images`, {
    method: 'POST',
    body: form,
    isFormData: true,
  });
}
