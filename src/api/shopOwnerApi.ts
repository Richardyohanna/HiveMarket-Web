import { getMyShops, type OwnedShopSummary } from './accountDeletionApi';
import { apiFetch } from '../lib/apiClient';

export type { OwnedShopSummary };
export { getMyShops };

export type ShopOwnerProfile = OwnedShopSummary & {
  ownerName: string;
  email: string;
  phone: string;
  website: string | null;
  location: { address: string | null; latitude: number | null; longitude: number | null } | null;
  isOpen: boolean | null;
  openTime: string | null;
  closingTime: string | null;
  banner: string | null;
  slogan: string | null;
  shopType: string | null;
  categories: string[] | null;
  university: string | null;
  areaName: string | null;
  country: string | null;
  state: string | null;
  lga: string | null;
  operatingMode: 'FIXED' | 'FLEXIBLE' | null;
  followers: number | null;
  productCount: number | null;
  serviceCount: number | null;
};

export type ShopOwnerProfileUpdate = {
  name: string;
  phone: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isOpen: boolean;
  openTime?: string;
  closingTime?: string;
  slogan?: string;
  website?: string;
  university?: string;
  areaName?: string;
  country?: string;
  state?: string;
  lga?: string;
  operatingMode?: 'FIXED' | 'FLEXIBLE';
  image?: File;
  banner?: File;
};

export type ShopActivityStats = {
  totalVisits: number;
  visitsSeries: Array<{ label: string; value: number }>;
  recentVisitors: ShopVisitor[];
  requestsCount: number;
  transactionsCount: number;
  transactionsAmount: number;
};

export type ShopVisitor = {
  id: string;
  full_name: string;
  profile_picture?: string | null;
  university?: string | null;
  visited_at: string;
};

export type ShopRequestStatus =
  | 'PENDING'
  | 'PENDING_SHOP'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'DECLINED'
  | 'CANCELLED';

export type ShopRequest = {
  id: string;
  customerId: string;
  customerName: string;
  customerProfilePicture: string | null;
  shopId: string;
  shopName: string;
  status: ShopRequestStatus;
  declineReason: string | null;
  shopConfirmed: boolean;
  customerConfirmed: boolean;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    availability: 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE';
  }>;
  createdAt: string;
  updatedAt: string;
};

export type SellerTransaction = {
  id: string;
  reference: string;
  amount: number;
  status: string;
  createdAt: string;
};

export type ShopNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  group: 'TODAY' | 'YESTERDAY' | 'EARLIER';
  metadata?: {
    referenceId?: string;
    contextLabel?: string;
    senderName?: string;
    shoppingListId?: string;
    shopId?: string;
    customerId?: string;
    priority?: 'HIGH' | 'NORMAL';
  } | null;
};

export type ShopConversation = {
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

export type ShopMessage = {
  conversationId: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageTime: string;
  isReceived: boolean;
  isRead: boolean;
  fileUrl?: string | null;
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

export type PersonalProfile = {
  id: string;
  email: string | null;
  full_name: string;
  phone?: string | null;
  profile_picture: string | null;
  gender?: string | null;
  university: string | null;
  campus: string | null;
  countryOfResidence: string | null;
  stateOfResidence: string | null;
  lgaOfResidence: string | null;
  location: { address: string | null; latitude: number | null; longitude: number | null } | null;
};

export type PersonalProfileUpdate = {
  userId: string;
  email: string;
  full_name: string;
  university: string | null;
  campus: string | null;
  countryOfResidence: string | null;
  stateOfResidence: string | null;
  lgaOfResidence: string | null;
  location: { address: string | null; latitude: number | null; longitude: number | null } | null;
};

export function getShopOwnerProfile(shopId: string) {
  return apiFetch<ShopOwnerProfile>(`/api/shop/${encodeURIComponent(shopId)}`);
}

export function updateShopOwnerProfile(shopId: string, payload: ShopOwnerProfileUpdate) {
  const form = new FormData();
  form.append('name', payload.name);
  form.append('phone', payload.phone);
  form.append('isOpen', String(payload.isOpen));
  if (payload.address != null) form.append('address', payload.address);
  if (payload.latitude != null) form.append('latitude', String(payload.latitude));
  if (payload.longitude != null) form.append('longitude', String(payload.longitude));
  if (payload.openTime != null) form.append('openTime', payload.openTime);
  if (payload.closingTime != null) form.append('closingTime', payload.closingTime);
  if (payload.slogan != null) form.append('slogan', payload.slogan);
  if (payload.website != null) form.append('website', payload.website);
  if (payload.university != null) form.append('university', payload.university);
  if (payload.areaName != null) form.append('areaName', payload.areaName);
  if (payload.country != null) form.append('country', payload.country);
  if (payload.state != null) form.append('state', payload.state);
  if (payload.lga != null) form.append('lga', payload.lga);
  if (payload.operatingMode) form.append('operatingMode', payload.operatingMode);
  if (payload.image) form.append('image', payload.image);
  if (payload.banner) form.append('banner', payload.banner);

  return apiFetch<void>(`/api/shop/${encodeURIComponent(shopId)}`, {
    method: 'PUT',
    body: form,
    isFormData: true,
  });
}

export function updateShopOpenStatus(shopId: string, isOpen: boolean) {
  const query = new URLSearchParams({ shopId, isOpen: String(isOpen) });
  return apiFetch<{ shopId: string; isOpen: boolean }>(`/api/shop/open?${query}`, { method: 'PUT' });
}

export function getShopActivityStats(shopId: string, period: 'today' | 'week' | 'month') {
  const query = new URLSearchParams({ period });
  return apiFetch<ShopActivityStats>(`/api/shop/${encodeURIComponent(shopId)}/activity-stats?${query}`);
}

export function getShopVisitors(shopId: string, date: string) {
  const query = new URLSearchParams({ date });
  return apiFetch<ShopVisitor[]>(`/api/shop/${encodeURIComponent(shopId)}/visitors?${query}`);
}

export function getShopRequests(shopId: string) {
  return apiFetch<ShopRequest[]>(`/api/shopping-lists/shop/${encodeURIComponent(shopId)}`);
}

export function updateShopRequestStatus(
  requestId: string,
  status: 'ACCEPTED' | 'DECLINED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'COMPLETED',
  reason?: string,
) {
  const actions = {
    ACCEPTED: 'accept',
    DECLINED: 'decline',
    PREPARING: 'preparing',
    READY_FOR_PICKUP: 'ready',
    COMPLETED: 'complete',
  } as const;
  return apiFetch<ShopRequest>(`/api/shopping-lists/${encodeURIComponent(requestId)}/${actions[status]}`, {
    method: 'PATCH',
    ...(status === 'DECLINED' ? { body: { reason } } : {}),
  });
}

export function updateShopRequestItemAvailability(
  requestId: string,
  productId: string,
  availability: ShopRequest['items'][number]['availability'],
) {
  return apiFetch<ShopRequest>(
    `/api/shopping-lists/${encodeURIComponent(requestId)}/items/${encodeURIComponent(productId)}/availability`,
    { method: 'PATCH', body: { availability } },
  );
}

export function getSellerTransactions(userId: string) {
  return apiFetch<SellerTransaction[]>(`/api/payments/history/seller/${encodeURIComponent(userId)}`);
}

export function getShopNotifications(shopId: string) {
  return apiFetch<ShopNotification[]>(`/api/notification/shop?shopId=${encodeURIComponent(shopId)}`);
}

export function markShopNotificationRead(notificationId: string, shopId: string) {
  const query = new URLSearchParams({ id: notificationId, shopIdOrUserId: shopId });
  return apiFetch<string>(`/api/notification/read?${query}`, { method: 'PUT' });
}

export function getShopConversations(shopId: string) {
  return apiFetch<ShopConversation[]>(
    `/api/chat/conversations/${encodeURIComponent(shopId)}?participantType=SHOP`,
  );
}

export function getShopConversationMessages(conversation: ShopConversation, shopId: string) {
  const isShopBuyer = conversation.buyerType === 'SHOP' && conversation.buyerId === shopId;
  const currentParticipantId = shopId;
  const otherParticipantId = isShopBuyer ? conversation.sellerId : conversation.buyerId;
  const otherParticipantType = isShopBuyer ? conversation.sellerType : conversation.buyerType;
  return apiFetch<ShopMessage[]>('/api/chat/messages', {
    method: 'POST',
    body: {
      buyerId: conversation.buyerId,
      buyerType: conversation.buyerType,
      sellerId: conversation.sellerId,
      sellerType: conversation.sellerType,
      senderId: currentParticipantId,
      senderType: 'SHOP',
      receiverId: otherParticipantId,
      receiverType: otherParticipantType,
    },
  });
}

export function markShopConversationRead(conversationId: string, shopId: string) {
  const query = new URLSearchParams({ participantId: shopId, participantType: 'SHOP' });
  return apiFetch<void>(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}/read?${query}`,
    { method: 'PUT' },
  );
}

export function getShopReviews(shopId: string) {
  return apiFetch<ShopReview[]>(`/api/shop-reviews/${encodeURIComponent(shopId)}`);
}

export function replyToShopReview(reviewId: string, authorId: string, text: string) {
  return apiFetch<ShopReview>('/api/shop-reviews/reply', {
    method: 'POST',
    body: { reviewId, authorId, text },
  });
}

export function getPersonalProfile(email: string) {
  return apiFetch<PersonalProfile>(`/api/user-data?email=${encodeURIComponent(email)}`);
}

export function updatePersonalProfile(profile: PersonalProfileUpdate) {
  return apiFetch<PersonalProfile>('/api/update/profile', {
    method: 'PATCH',
    body: profile,
  });
}

export function uploadPersonalProfilePicture(profile: PersonalProfile, image: File) {
  const form = new FormData();
  form.append('profilePictures', image);
  form.append('email', profile.email || '');
  form.append('address', profile.location?.address || '');
  form.append('latitude', String(profile.location?.latitude ?? 0));
  form.append('longitude', String(profile.location?.longitude ?? 0));
  form.append('university', profile.university || '');
  form.append('campus', profile.campus || '');
  if (profile.countryOfResidence) form.append('countryOfResidence', profile.countryOfResidence);
  if (profile.stateOfResidence) form.append('stateOfResidence', profile.stateOfResidence);
  if (profile.lgaOfResidence) form.append('lgaOfResidence', profile.lgaOfResidence);
  return apiFetch<string>('/api/register/profile-picture', {
    method: 'POST',
    body: form,
    isFormData: true,
  });
}
