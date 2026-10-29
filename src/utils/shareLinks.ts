export type ShareableResourceType = 'product' | 'Shop' | 'profile';

const SHARE_BASE_URL = 'https://hivemarket.ng';

export function getShareUrl(type: ShareableResourceType, id: string) {
  return `${SHARE_BASE_URL}/${type}/${encodeURIComponent(id)}`;
}

export function getProductShareUrl(productId: string) {
  return getShareUrl('product', productId);
}

export function getShopShareUrl(shopId: string) {
  return getShareUrl('Shop', shopId);
}
