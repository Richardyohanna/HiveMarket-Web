import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Bookmark, Heart, Home, MessageCircle, MessageSquareText, Send, Share2, Trash2, X } from 'lucide-react';
import {
  addGalleryComment,
  deleteGalleryComment,
  getGalleryComments,
  getGalleryFeed,
  setGalleryReaction,
  setGallerySaved,
  type GalleryComment,
  type GalleryPost,
} from '../api/galleryApi';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/router';

const pageSize = 10;

export default function GalleryFeedPage() {
  const { navigate } = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyPostIds, setBusyPostIds] = useState<Set<string>>(() => new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(() => new Set());
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [commentsPost, setCommentsPost] = useState<GalleryPost | null>(null);
  const [comments, setComments] = useState<GalleryComment[]>([]);
  const [commentsPage, setCommentsPage] = useState(0);
  const [commentsHasNext, setCommentsHasNext] = useState(false);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsSending, setCommentsSending] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState<GalleryComment | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestInFlightRef = useRef(false);
  const nextPageRef = useRef(0);
  const hasNextRef = useRef(true);

  const loadNextPage = useCallback(async () => {
    if (requestInFlightRef.current || !hasNextRef.current) return;
    requestInFlightRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await getGalleryFeed(nextPageRef.current, pageSize);
      setPosts((current) => {
        const ids = new Set(current.map((post) => post.id));
        return [...current, ...response.items.filter((post) => !ids.has(post.id))];
      });
      nextPageRef.current = response.page + 1;
      hasNextRef.current = response.hasNext;
      setHasNext(response.hasNext);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the Gallery Feed.');
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNextPage();
  }, [loadNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollContainerRef.current;
    if (!sentinel || !root || !hasNext || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadNextPage();
      },
      { root, rootMargin: '400px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNext, loadNextPage, posts.length]);

  async function updatePost(post: GalleryPost, action: 'react' | 'save') {
    if (busyPostIds.has(post.id)) return;
    setBusyPostIds((current) => new Set(current).add(post.id));
    setError(null);
    try {
      const updated = action === 'react'
        ? await setGalleryReaction(post.id, !post.isReacted)
        : await setGallerySaved(post.id, !post.isSaved);
      setPosts((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update this Gallery post.');
    } finally {
      setBusyPostIds((current) => {
        const next = new Set(current);
        next.delete(post.id);
        return next;
      });
    }
  }

  async function sharePost(post: GalleryPost) {
    setShareNotice(null);
    const url = `${window.location.origin}/shopping/gallery#${encodeURIComponent(post.id)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.shopName} on HiveMarket`,
          text: `View this photo from ${post.shopName} on HiveMarket`,
          url,
        });
      } catch (shareError) {
        if (!(shareError instanceof DOMException && shareError.name === 'AbortError')) {
          try {
            await navigator.clipboard.writeText(url);
            setShareNotice('Sharing did not open. Gallery link copied instead.');
          } catch {
            setShareNotice('Sharing and clipboard access are unavailable in this browser.');
          }
        }
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareNotice('Gallery link copied.');
    } catch {
      setShareNotice('Sharing is unavailable in this browser.');
    }
  }

  async function loadComments(postId: string, page: number, append = false) {
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const response = await getGalleryComments(postId, page, 20);
      setComments((current) => append ? [...current, ...response.items] : response.items);
      setCommentsPage(response.page);
      setCommentsHasNext(response.hasNext);
      setCommentsTotal(response.totalCount);
    } catch (loadError) {
      setCommentsError(loadError instanceof Error ? loadError.message : 'Unable to load Gallery comments.');
    } finally {
      setCommentsLoading(false);
    }
  }

  function openComments(post: GalleryPost) {
    setCommentsPost(post);
    setComments([]);
    setCommentsPage(0);
    setCommentsHasNext(false);
    setCommentsTotal(post.commentsCount);
    setCommentsError(null);
    setCommentText('');
    setReplyTarget(null);
    void loadComments(post.id, 0);
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = commentText.trim();
    if (!commentsPost || !text || commentsSending) return;
    if (!isAuthenticated) {
      setCommentsError('Sign in to comment on Gallery images.');
      return;
    }
    setCommentsSending(true);
    setCommentsError(null);
    const parent = replyTarget;
    try {
      const response = await addGalleryComment(commentsPost.id, text, parent?.id);
      setComments((current) => {
        if (!parent) return [response.comment, ...current];
        const appendReply = (items: GalleryComment[]): GalleryComment[] => items.map((item) => item.id === parent.id
          ? { ...item, replies: [...item.replies, response.comment] }
          : { ...item, replies: appendReply(item.replies) });
        return appendReply(current);
      });
      setCommentsTotal(response.totalCount);
      setPosts((current) => current.map((item) => item.id === commentsPost.id
        ? { ...item, commentsCount: response.totalCount }
        : item));
      setCommentText('');
      setReplyTarget(null);
    } catch (submitError) {
      setCommentsError(submitError instanceof Error ? submitError.message : 'Unable to post your comment.');
    } finally {
      setCommentsSending(false);
    }
  }

  async function removeComment(commentId: string) {
    if (!commentsPost) return;
    setCommentsError(null);
    try {
      const response = await deleteGalleryComment(commentId);
      const removeFromTree = (items: GalleryComment[]): GalleryComment[] => items
        .filter((item) => item.id !== commentId)
        .map((item) => ({ ...item, replies: removeFromTree(item.replies) }));
      setComments(removeFromTree(comments));
      setCommentsTotal(response.totalCount);
      setPosts((current) => current.map((item) => item.id === commentsPost.id
        ? { ...item, commentsCount: response.totalCount }
        : item));
    } catch (deleteError) {
      setCommentsError(deleteError instanceof Error ? deleteError.message : 'Unable to delete the comment.');
    }
  }

  function openShop(post: GalleryPost) {
    navigate(`/shopping/shop/${encodeURIComponent(post.shopId)}`);
  }

  return (
    <main className="h-[100dvh] overflow-hidden bg-[#101410] text-white">
      <header className="relative z-10 flex h-16 items-center justify-between border-b border-white/10 bg-[#101410] px-4 sm:px-6">
        <button type="button" onClick={() => navigate('/shopping')} className="inline-flex items-center gap-2 font-bold text-white" aria-label="Back to shopping">
          <Home size={19} /> <span>HiveMarket</span>
        </button>
        <h1 className="text-lg font-bold">Gallery</h1>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate('/shopping/saved-gallery')} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold text-white/80 hover:bg-white/10" aria-label="Saved Gallery images">
            <Bookmark size={17} /> <span className="hidden sm:inline">Saved</span>
          </button>
          <button type="button" onClick={() => navigate('/shopping')} className="rounded-lg px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10">
            Shopping
          </button>
        </div>
      </header>

      <div ref={scrollContainerRef} className="h-[calc(100dvh-4rem)] snap-y snap-mandatory overflow-y-auto overscroll-contain">
        {posts.map((post) => (
          <article id={post.id} key={post.id} className="relative h-[calc(100dvh-4rem)] min-h-[30rem] snap-start overflow-hidden bg-neutral-900">
            {!imageErrors.has(post.id) ? (
              <img
                src={post.imageUrl}
                alt={`Gallery photo from ${post.shopName}`}
                loading="lazy"
                onError={() => setImageErrors((current) => new Set(current).add(post.id))}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div role="img" aria-label={`Image unavailable from ${post.shopName}`} className="absolute inset-0 flex items-center justify-center bg-neutral-800 px-16 text-center text-sm text-white/70">
                This Gallery image could not be loaded.
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

            <button
              type="button"
              onClick={() => openShop(post)}
              className="absolute bottom-8 left-4 z-10 max-w-[65%] truncate rounded-lg bg-black/35 px-3 py-2 text-left text-lg font-bold text-white backdrop-blur-sm sm:bottom-10 sm:left-8"
            >
              {post.shopName}
            </button>

            <div aria-label="Gallery actions" className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-3 sm:right-6">
              <button
                type="button"
                disabled={busyPostIds.has(post.id)}
                aria-label={post.isReacted ? 'Unlike Gallery image' : 'Like Gallery image'}
                aria-pressed={post.isReacted}
                onClick={() => void updatePost(post, 'react')}
                className="flex min-h-12 min-w-12 flex-col items-center justify-center rounded-full bg-black/45 p-2 text-white backdrop-blur-sm hover:bg-black/65 disabled:opacity-50"
              >
                <Heart size={23} fill={post.isReacted ? 'currentColor' : 'none'} className={post.isReacted ? 'text-rose-400' : ''} />
                <span className="mt-1 text-[11px] font-semibold">{post.reactionCount}</span>
              </button>
              <button
                type="button"
                aria-label={`View ${post.commentsCount} comments`}
                onClick={() => openComments(post)}
                className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/45 p-2 text-white backdrop-blur-sm hover:bg-black/65"
              >
                <span className="flex flex-col items-center">
                  <MessageSquareText size={22} />
                  <span className="mt-1 text-[11px] font-semibold">{post.commentsCount}</span>
                </span>
              </button>
              <button
                type="button"
                aria-label={`Chat with ${post.shopName}`}
                onClick={() => navigate(`/shopping/messages?shopId=${encodeURIComponent(post.shopId)}`)}
                className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/45 p-2 text-white backdrop-blur-sm hover:bg-black/65"
              >
                <MessageCircle size={23} />
              </button>
              <button
                type="button"
                aria-label={`Share photo from ${post.shopName}`}
                onClick={() => void sharePost(post)}
                className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/45 p-2 text-white backdrop-blur-sm hover:bg-black/65"
              >
                <Share2 size={22} />
              </button>
              <button
                type="button"
                disabled={busyPostIds.has(post.id)}
                aria-label={post.isSaved ? 'Remove Gallery image from saved' : 'Save Gallery image'}
                aria-pressed={post.isSaved}
                onClick={() => void updatePost(post, 'save')}
                className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/45 p-2 text-white backdrop-blur-sm hover:bg-black/65 disabled:opacity-50"
              >
                <Bookmark size={22} fill={post.isSaved ? 'currentColor' : 'none'} className={post.isSaved ? 'text-amber-300' : ''} />
              </button>
            </div>
          </article>
        ))}

        <div ref={sentinelRef} className="flex min-h-24 items-center justify-center px-4 py-6 text-center">
          {loading && <p role="status" className="text-sm text-white/75">{posts.length ? 'Loading more Gallery photos…' : 'Loading Gallery photos…'}</p>}
          {error && (
            <div className="space-y-2">
              <p role="alert" className="text-sm text-red-200">{error}</p>
              <button type="button" onClick={() => void loadNextPage()} className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Retry</button>
            </div>
          )}
          {!loading && !error && posts.length === 0 && (
            <div>
              <h2 className="text-lg font-bold">No Gallery photos yet</h2>
              <p className="mt-2 text-sm text-white/70">Shops have not uploaded Gallery images yet. Please check back soon.</p>
            </div>
          )}
          {!loading && !error && posts.length > 0 && hasNext && (
            <button type="button" onClick={() => void loadNextPage()} className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Load more</button>
          )}
          {!loading && !error && posts.length > 0 && !hasNext && <p className="text-xs text-white/60">You’re all caught up.</p>}
        </div>
      </div>

      {shareNotice && <p role="status" className="fixed bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-lg bg-black/80 px-4 py-2 text-sm text-white">{shareNotice}</p>}

      {commentsPost && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/65 sm:items-center sm:p-5" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCommentsPost(null);
        }}>
          <section aria-label={`Comments for ${commentsPost.shopName}`} className="flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-white text-[#17191c] shadow-2xl sm:rounded-2xl">
            <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="font-bold">Gallery comments</h2>
                <p className="text-xs text-gray-500">{commentsTotal} comments · {commentsPost.shopName}</p>
              </div>
              <button type="button" aria-label="Close comments" onClick={() => setCommentsPost(null)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
                <X size={20} />
              </button>
            </header>
            <div className="min-h-32 flex-1 space-y-4 overflow-y-auto p-5">
              {commentsError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{commentsError}</p>}
              {commentsLoading && comments.length === 0 && <p role="status" className="text-center text-sm text-gray-500">Loading comments…</p>}
              {!commentsLoading && comments.length === 0 && !commentsError && <p className="py-8 text-center text-sm text-gray-500">No comments yet. Start the conversation.</p>}
              {comments.map((comment) => (
                <GalleryCommentItem
                  key={comment.id}
                  comment={comment}
                  userId={user?.userId}
                  onReply={(target) => setReplyTarget(target)}
                  onDelete={(id) => void removeComment(id)}
                />
              ))}
              {commentsHasNext && (
                <button type="button" disabled={commentsLoading} onClick={() => void loadComments(commentsPost.id, commentsPage + 1, true)} className="w-full py-2 text-sm font-semibold text-[#008100] disabled:opacity-50">
                  {commentsLoading ? 'Loading…' : 'Load older comments'}
                </button>
              )}
            </div>
            <form onSubmit={submitComment} className="border-t border-gray-100 p-4">
              {replyTarget && (
                <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Replying to {replyTarget.authorName}</span>
                  <button type="button" onClick={() => setReplyTarget(null)} className="font-semibold text-[#008100]">Cancel reply</button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  aria-label="Write a Gallery comment"
                  placeholder={isAuthenticated ? 'Write a comment…' : 'Sign in to comment'}
                  maxLength={2000}
                  rows={2}
                  disabled={!isAuthenticated || commentsSending}
                  className="min-h-11 flex-1 resize-y rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#008100] disabled:bg-gray-50"
                />
                <button type="submit" disabled={!isAuthenticated || !commentText.trim() || commentsSending} aria-label="Post comment" className="rounded-xl bg-[#008100] p-3 text-white hover:bg-[#006d24] disabled:opacity-50">
                  <Send size={17} />
                </button>
              </div>
              {!isAuthenticated && <button type="button" onClick={() => navigate('/login')} className="mt-2 text-xs font-semibold text-[#008100] hover:underline">Sign in</button>}
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function GalleryCommentItem({
  comment,
  userId,
  onReply,
  onDelete,
  nested = false,
}: {
  comment: GalleryComment;
  userId?: string;
  onReply: (comment: GalleryComment) => void;
  onDelete: (commentId: string) => void;
  nested?: boolean;
}) {
  return (
    <article className={nested ? 'ml-5 border-l-2 border-green-100 pl-3' : ''}>
      <div className="flex items-start gap-2">
        {comment.authorImageUrl
          ? <img src={comment.authorImageUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
          : <div aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-xs font-bold text-[#008100]">{comment.authorName.slice(0, 1) || '?'}</div>}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{comment.authorName}<time className="ml-2 text-[11px] font-normal text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</time></p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">{comment.text}</p>
          <div className="mt-1 flex gap-3">
            <button type="button" onClick={() => onReply(comment)} className="text-xs font-semibold text-[#008100] hover:underline">Reply</button>
            {userId === comment.authorId && (
              <button type="button" onClick={() => onDelete(comment.id)} aria-label="Delete your comment" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600">
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
      {comment.replies.map((reply) => (
        <GalleryCommentItem key={reply.id} comment={reply} userId={userId} onReply={onReply} onDelete={onDelete} nested />
      ))}
    </article>
  );
}
