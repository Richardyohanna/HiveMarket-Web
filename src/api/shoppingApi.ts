import { getAdminShopProducts, type AdminShopProduct } from './adminApi';
import { apiFetch } from '../lib/apiClient';

export type PublicShop = Record<string, unknown> & {
  id?: string;
  name?: string;
};

export type ShopLocation = {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type ShopProfile = PublicShop & {
  id: string;
  name: string;
  ownerName?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  location?: ShopLocation | null;
  isOpen?: boolean | null;
  openTime?: string | null;
  closingTime?: string | null;
  followers?: number | null;
  productCount?: number | null;
  serviceCount?: number | null;
  imageUrl?: string | null;
  banner?: string | null;
  slogan?: string | null;
  shopType?: string | null;
  categories?: string[] | null;
  university?: string | null;
  areaName?: string | null;
  country?: string | null;
  state?: string | null;
  lga?: string | null;
  distanceMeters?: number | null;
  distanceKm?: number | null;
  walkTimeMinutes?: number | null;
  isFollowing?: boolean | null;
  isShopSaved?: boolean | null;
  operatingMode?: string | null;
  isVarified?: boolean | null;
};

export type SavedShop = {
  id: string;
  name: string;
  banner?: string | null;
  areaName?: string | null;
  shopType?: string | null;
  operatingMode?: string | null;
  isOpen?: boolean | null;
  openTime?: string | null;
  closingTime?: string | null;
  location?: ShopLocation | null;
  country?: string | null;
  state?: string | null;
  lga?: string | null;
};

export type ShopReview = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  rating: number;
  comment: string;
  createdAt: string;
  replies: Array<{
    id: string;
    authorId: string;
    authorName: string;
    isOwner: boolean;
    text: string;
    createdAt: string;
  }>;
};

export type ShopRating = {
  AverageRating: number;
  totalRating: number;
  userRating: number;
};

export type ShopServiceItem = {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  discountAmount?: number | null;
  discountedPrice?: number | null;
  hasActiveDiscount?: boolean | null;
  duration?: string | null;
  availability?: string | null;
  image?: string | null;
};

export type UserConversation = {
  conversationId: string;
  buyerId: string;
  buyerType: 'USER' | 'SHOP';
  sellerId: string;
  sellerType: 'USER' | 'SHOP';
  profile_picture: string | null;
  lastMessage: string;
  lastMessageTime: string;
  otherUserName: string;
  otherUserId: string;
  otherUserType: 'USER' | 'SHOP';
  unreadCount: number;
};

export type UserChatMessage = {
  conversationId: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageTime: string;
  isReceived: boolean;
  isRead: boolean;
  fileUrl: string | null;
};

export type UserShoppingRequest = {
  id: string;
  customerId: string;
  customerName: string;
  shopId: string;
  shopName: string;
  status: string;
  declineReason: string | null;
  items: Array<{ productId: string; productName: string; quantity: number; price: number }>;
  createdAt: string;
  updatedAt: string;
};

export type UserNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  group: string;
  metadata?: Record<string, unknown> | null;
};

export type DiscoveryResponse = {
  products: Array<{
    id: string;
    pName: string;
    pDetail: string;
    pAmount: number;
    pQuantity: number;
    category: string;
    imageUrls?: string[] | null;
    shopId: string | null;
    sellerId: string;
    sellerName: string;
  }>;
  relatedShops: Array<PublicShop & {
    id: string;
    name: string;
    imageUrl?: string | null;
    location?: ShopLocation | null;
    isOpen?: boolean | null;
    shopType?: string | null;
    categories?: string[] | null;
    areaName?: string | null;
    country?: string | null;
    state?: string | null;
    lga?: string | null;
    distanceMeters?: number | null;
    openTime?: string | null;
    closingTime?: string | null;
    followers?: number | null;
    isFollowing?: boolean | null;
    isShopSaved?: boolean | null;
  }>;
  hasMoreShops: boolean;
};

export function getPublicShop(shopId: string) {
  return apiFetch<PublicShop>(`/api/public/share/Shop/${encodeURIComponent(shopId)}`, {
    skipAuth: true,
  });
}

export function getBuyerShops(userId: string, coordinates?: { latitude: number; longitude: number }) {
  const params = new URLSearchParams({ userId, limit: '100' });
  if (coordinates) {
    params.set('latitude', String(coordinates.latitude));
    params.set('longitude', String(coordinates.longitude));
    params.set('radiusMeters', '50000');
    params.set('minRadiusMeters', '0');
  }
  return apiFetch<ShopProfile[]>(`/api/shop/all?${params}`);
}

export function getShopProfile(shopId: string, userId: string, coordinates?: { latitude: number; longitude: number }) {
  const params = new URLSearchParams({ userId });
  if (coordinates) {
    params.set('latitude', String(coordinates.latitude));
    params.set('longitude', String(coordinates.longitude));
  }
  return apiFetch<ShopProfile>(`/api/shop/${encodeURIComponent(shopId)}?${params}`);
}

export function getSavedShops(userId: string) {
  return apiFetch<SavedShop[]>(`/api/saved.shop/all?userId=${encodeURIComponent(userId)}`);
}

export function saveShop(userId: string, shopId: string) {
  return apiFetch<unknown>('/api/saved.shop/save', {
    method: 'POST',
    body: { userId, shopId },
  });
}

export function removeSavedShop(userId: string, shopId: string) {
  return apiFetch<unknown>('/api/saved.shop', {
    method: 'DELETE',
    body: { userId, shopId },
  });
}

export function toggleShopFollow(userId: string, shopId: string) {
  return apiFetch<unknown>('/api/follower/follow', {
    method: 'POST',
    body: { userId, shopId },
  });
}

export function getShopRating(shopId: string, userId?: string) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  const suffix = params.size ? `?${params}` : '';
  return apiFetch<ShopRating>(`/api/shop-reviews/${encodeURIComponent(shopId)}/rating${suffix}`);
}

export function getShopReviews(shopId: string) {
  return apiFetch<ShopReview[]>(`/api/shop-reviews/${encodeURIComponent(shopId)}`);
}

export function submitShopReview(userId: string, shopId: string, rating: number, comment: string) {
  return apiFetch<ShopReview>('/api/shop-reviews', {
    method: 'POST',
    body: { userId, shopId, rating, comment },
  });
}

export function reportShop(userId: string, shopId: string, reason: string, details: string) {
  return apiFetch<unknown>('/api/shop-reports', {
    method: 'POST',
    body: { reporterId: userId, shopId, reason, details },
  });
}

export function getShopCatalog(shopId: string): Promise<AdminShopProduct[]> {
  return getAdminShopProducts(shopId);
}

export function getShopServices(shopId: string) {
  return apiFetch<ShopServiceItem[]>(`/api/shops/${encodeURIComponent(shopId)}/services`);
}

export function searchDiscovery(
  query: string,
  limit = 20,
  userId?: string,
  coordinates?: { latitude: number; longitude: number },
) {
  const params = new URLSearchParams({ q: query, limit: String(limit), offset: '0' });
  if (userId) params.set('userId', userId);
  if (coordinates) {
    params.set('latitude', String(coordinates.latitude));
    params.set('longitude', String(coordinates.longitude));
    params.set('radiusMeters', '50000');
    params.set('minRadiusMeters', '0');
  }
  return apiFetch<DiscoveryResponse>(`/api/discovery/search?${params}`);
}

export function getUserShoppingRequests() {
  return apiFetch<UserShoppingRequest[]>('/api/shopping-lists');
}

export function createUserShoppingRequest(shopId: string, items: Array<{ productId: string; quantity: number }>) {
  return apiFetch<UserShoppingRequest>('/api/shopping-lists', {
    method: 'POST',
    body: { shopId, items },
  });
}

export function getUserConversations(userId: string) {
  const params = new URLSearchParams({ participantType: 'USER' });
  return apiFetch<UserConversation[]>(
    `/api/chat/conversations/${encodeURIComponent(userId)}?${params}`,
  );
}

export function getUserConversationMessages(conversation: UserConversation, userId: string) {
  const isBuyer = conversation.buyerType === 'USER' && conversation.buyerId === userId;
  const otherId = isBuyer ? conversation.sellerId : conversation.buyerId;
  const otherType = isBuyer ? conversation.sellerType : conversation.buyerType;
  return apiFetch<UserChatMessage[]>('/api/chat/messages', {
    method: 'POST',
    body: {
      buyerId: conversation.buyerId,
      buyerType: conversation.buyerType,
      sellerId: conversation.sellerId,
      sellerType: conversation.sellerType,
      senderId: userId,
      senderType: 'USER',
      receiverId: otherId,
      receiverType: otherType,
    },
  });
}

export function startUserConversation(userId: string, shopId: string) {
  return apiFetch<UserConversation>('/api/chat/conversation', {
    method: 'POST',
    body: {
      buyerId: userId,
      buyerType: 'USER',
      sellerId: shopId,
      sellerType: 'SHOP',
      currentParticipantId: userId,
      currentParticipantType: 'USER',
      recipientId: shopId,
      recipientType: 'SHOP',
    },
  });
}

export function markUserConversationRead(conversationId: string, userId: string) {
  const params = new URLSearchParams({ participantId: userId, participantType: 'USER' });
  return apiFetch<void>(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}/read?${params}`,
    { method: 'PUT' },
  );
}

export function getUserNotifications(userId: string) {
  return apiFetch<UserNotification[]>(
    `/api/notification/user?userId=${encodeURIComponent(userId)}`,
  );
}

export function markUserNotificationRead(notificationId: string, userId: string) {
  const params = new URLSearchParams({ id: notificationId, shopIdOrUserId: userId });
  return apiFetch<unknown>(`/api/notification/read?${params}`, { method: 'PUT' });
}
