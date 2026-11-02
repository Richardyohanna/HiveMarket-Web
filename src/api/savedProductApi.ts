import { apiFetch } from '../lib/apiClient';

export type SavedProduct = {
  productId: string;
  pName: string;
  pDetail: string;
  pAmount: number;
  category: string;
  imageUrls: string[];
  shopId?: string | null;
};

export type SavedProductPage = {
  content: SavedProduct[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export function getSavedProducts(page = 0, size = 30) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return apiFetch<SavedProductPage>(`/api/saved.products/all?${params}`);
}

export function setProductSaved(productId: string, saved: boolean) {
  return apiFetch<void>(saved ? '/api/saved.products/save' : '/api/saved.products', {
    method: saved ? 'POST' : 'DELETE',
    body: { productId },
  });
}
