import { apiFetch } from '../lib/apiClient';

export type GalleryPost = {
  id: string;
  imageUrl: string;
  shopId: string;
  shopName: string;
  shopImageUrl: string | null;
  reactionCount: number;
  isReacted: boolean;
  isSaved: boolean;
  createdAt: string;
  orderIndex: number;
  cover: boolean;
  sourceType?: 'UPLOAD' | 'PRODUCT';
  productId?: string | null;
  productName?: string | null;
  commentsCount: number;
  shopOwnerId?: string | null;
};

export type GalleryPage = {
  items: GalleryPost[];
  page: number;
  size: number;
  hasNext: boolean;
};

export type GalleryComment = {
  id: string;
  authorId: string;
  authorName: string;
  authorImageUrl?: string | null;
  text: string;
  createdAt: string;
  parentCommentId?: string | null;
  replyToName?: string | null;
  replies: GalleryComment[];
};

export type GalleryCommentPage = {
  items: GalleryComment[];
  page: number;
  size: number;
  hasNext: boolean;
  totalCount: number;
};

export type GalleryCommentMutation = {
  comment: GalleryComment;
  totalCount: number;
};

export function getGalleryFeed(page: number, size = 10) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return apiFetch<GalleryPage>(`/api/gallery/feed?${params}`);
}

export function getShopGallery(shopId: string, page: number, size = 30) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return apiFetch<GalleryPage>(
    `/api/gallery/shops/${encodeURIComponent(shopId)}?${params}`,
  );
}

export function uploadShopGalleryImage(shopId: string, clientUploadId: string, image: File) {
  const form = new FormData();
  form.append('shopId', shopId);
  form.append('clientUploadId', clientUploadId);
  form.append('images', image);
  return apiFetch<GalleryPost>('/api/gallery/posts', {
    method: 'POST',
    body: form,
    isFormData: true,
  });
}

export function deleteGalleryPost(postId: string) {
  return apiFetch<void>(`/api/gallery/posts/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
  });
}

export function getGalleryComments(postId: string, page = 0, size = 20) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return apiFetch<GalleryCommentPage>(
    `/api/gallery/posts/${encodeURIComponent(postId)}/comments?${params}`,
  );
}

export function addGalleryComment(postId: string, text: string, parentCommentId?: string) {
  return apiFetch<GalleryCommentMutation>(
    `/api/gallery/posts/${encodeURIComponent(postId)}/comments`,
    { method: 'POST', body: { text, parentCommentId } },
  );
}

export function deleteGalleryComment(commentId: string) {
  return apiFetch<{ totalCount: number }>(
    `/api/gallery/comments/${encodeURIComponent(commentId)}`,
    { method: 'DELETE' },
  );
}

export function getSavedGalleryImages(page = 0, size = 30) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return apiFetch<GalleryPage>(`/api/gallery/saved?${params}`);
}

export function setGalleryReaction(postId: string, reacted: boolean) {
  return apiFetch<GalleryPost>(`/api/gallery/posts/${encodeURIComponent(postId)}/reaction`, {
    method: reacted ? 'PUT' : 'DELETE',
  });
}

export function setGallerySaved(postId: string, saved: boolean) {
  return apiFetch<GalleryPost>(`/api/gallery/posts/${encodeURIComponent(postId)}/save`, {
    method: saved ? 'PUT' : 'DELETE',
  });
}
