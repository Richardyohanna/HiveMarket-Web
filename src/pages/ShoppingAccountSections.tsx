import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import { ArrowDown, MessageCircle, Send } from 'lucide-react';
import type { MeResponse } from '../api/authApi';
import {
  getUserConversationMessages,
  getUserConversations,
  getUserNotifications,
  getUserShoppingRequests,
  markUserConversationRead,
  markUserNotificationRead,
  startUserConversation,
  type UserChatMessage,
  type UserConversation,
  type UserNotification,
  type UserShoppingRequest,
} from '../api/shoppingApi';
import { API_BASE_URL } from '../lib/config';
import { getAccessToken } from '../lib/tokenStorage';
import { useRouter } from '../lib/router';

const cardClass = 'rounded-2xl border border-[var(--hive-border)] bg-white p-5';

const PAGE_SIZE = 40; // messages rendered at first / per "load earlier"
const NEAR_BOTTOM_PX = 80; // within this distance we treat the user as "at the bottom"
const SHOW_JUMP_BUTTON_PX = 240; // show the scroll-to-bottom button beyond this distance
const LOAD_OLDER_TRIGGER_PX = 80; // load earlier messages when this close to the top

function formatTime(value: string | number) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDayLabel(value: string | number) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

export function ShoppingRequestsSection() {
  const [requests, setRequests] = useState<UserShoppingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUserShoppingRequests()
      .then((items) => { if (!cancelled) setRequests(items); })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load shopping requests.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className={cardClass}>
      <h2 className="text-xl font-bold text-[#17191c]">Your shopping requests</h2>
      <p className="mt-1 text-sm text-gray-600">Request history and status are loaded from your signed-in account.</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {loading ? <p className="mt-4 text-sm text-gray-600">Loading your requests…</p>
        : requests.length === 0 ? <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">You have not sent a shopping request yet.</p>
          : <ul className="mt-4 divide-y divide-gray-100">{requests.map((request) => (
            <li key={request.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><h3 className="font-semibold text-[#17191c]">{request.shopName || 'Shop'}</h3><time className="text-xs text-gray-500">{new Date(request.createdAt).toLocaleString()}</time></div>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-[#006d24]">{request.status.replaceAll('_', ' ')}</span>
              </div>
              {request.declineReason && <p className="mt-2 text-sm text-red-700">{request.declineReason}</p>}
              <ul className="mt-2 space-y-1 text-sm text-gray-600">{request.items.map((item) => <li key={item.productId}>{item.productName} × {item.quantity}</li>)}</ul>
            </li>
          ))}</ul>}
    </section>
  );
}

export function ShoppingNotificationsSection({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUserNotifications(userId)
      .then((items) => { if (!cancelled) setNotifications(items); })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load notifications.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  async function markRead(notification: UserNotification) {
    if (notification.read) return;
    setBusyId(notification.id);
    setError(null);
    try {
      await markUserNotificationRead(notification.id, userId);
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : 'Unable to mark this notification as read.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className={cardClass}>
      <h2 className="text-xl font-bold text-[#17191c]">Your notifications</h2>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {loading ? <p className="mt-4 text-sm text-gray-600">Loading notifications…</p>
        : notifications.length === 0 ? <p className="mt-4 text-sm text-gray-600">No notifications to show.</p>
          : <ul className="mt-3 divide-y divide-gray-100">{notifications.map((item) => (
            <li key={item.id} className={`flex items-start gap-3 py-4 ${item.read ? '' : 'bg-green-50/50'}`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-[#17191c]">{item.title}</h3><time className="text-xs text-gray-500">{new Date(item.time).toLocaleString()}</time></div>
                <p className="mt-1 text-sm text-gray-600">{item.body}</p>
                <p className="mt-1 text-xs text-gray-500">{item.group} · {item.type}</p>
              </div>
              {!item.read && <button type="button" disabled={busyId === item.id} onClick={() => void markRead(item)} className="shrink-0 text-xs font-semibold text-[#008100] disabled:opacity-50">{busyId === item.id ? 'Saving…' : 'Mark read'}</button>}
            </li>
          ))}</ul>}
    </section>
  );
}

export function ShoppingMessagesSection({ user }: { user: MeResponse }) {
  const { navigate } = useRouter();
  const [conversations, setConversations] = useState<UserConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UserChatMessage[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [draft, setDraft] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyReloadKey, setHistoryReloadKey] = useState(0);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [newWhileAway, setNewWhileAway] = useState(0);

  const selectedIdRef = useRef<string | null>(null);
  const selectedRef = useRef<UserConversation | null>(null);
  const clientRef = useRef<Client | null>(null);
  const startedShopRef = useRef<string | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);

  // Scroll management
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true); // is the user currently at/near the bottom?
  const forceBottomRef = useRef(false); // jump to bottom after the next render (conversation open)
  const pendingRestoreRef = useRef<{ prevHeight: number; prevTop: number } | null>(null);
  const loadingOlderRef = useRef(false);
  const prevLastKeyRef = useRef('');

  const selected = conversations.find((item) => item.conversationId === selectedId) || null;

  const hiddenCount = Math.max(0, messages.length - visibleCount);
  const startIndex = hiddenCount;
  const visibleMessages = hiddenCount > 0 ? messages.slice(startIndex) : messages;

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  // Bring the chat panel into view when this section opens, so the composer is on screen
  useEffect(() => {
    rootRef.current?.scrollIntoView({ block: 'start' });
  }, []);

  const loadConversations = useCallback(async (isActive: () => boolean = () => true) => {
    setLoadingConversations(true);
    try {
      const results = await getUserConversations(user.userId);
      if (!isActive()) return;
      setConversations(results);
      setConversationError(null);
      setSelectedId((current) => current && results.some((item) => item.conversationId === current)
        ? current
        : results[0]?.conversationId || null);
    } catch (loadError) {
      if (isActive()) setConversationError(loadError instanceof Error ? loadError.message : 'Unable to load conversations.');
    } finally {
      if (isActive()) setLoadingConversations(false);
    }
  }, [user.userId]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) return loadConversations(() => !cancelled);
      return undefined;
    });
    return () => { cancelled = true; };
  }, [loadConversations]);

  useEffect(() => {
    const shopId = new URLSearchParams(window.location.search).get('shopId');
    if (!shopId || startedShopRef.current === shopId) return;
    startedShopRef.current = shopId;
    startUserConversation(user.userId, shopId)
      .then(async (conversation) => {
        await loadConversations();
        setSelectedId(conversation.conversationId);
        navigate('/shopping/messages');
      })
      .catch((startError: unknown) => {
        setError(startError instanceof Error ? startError.message : 'Unable to start a conversation with this shop.');
      });
  }, [user.userId, loadConversations, navigate]);

  useEffect(() => {
    const client = new Client({
      brokerURL: `${API_BASE_URL.replace(/^http/, 'ws')}/ws`,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      beforeConnect: () => {
        const token = getAccessToken();
        if (!token) {
          setError('Your sign-in has expired. Sign in again to use messages.');
          client.connectHeaders = {};
          return;
        }
        client.connectHeaders = { Authorization: `Bearer ${token}` };
      },
      onConnect: () => {
        setConnected(true);
        client.subscribe('/user/hivemarket-queue/messages', (frame: IMessage) => {
          try {
            const incoming = JSON.parse(frame.body) as UserChatMessage;
            if (incoming.conversationId === selectedIdRef.current) {
              setMessages((current) => current.some((message) => message.conversationId === incoming.conversationId
                && message.messageTime === incoming.messageTime && message.senderId === incoming.senderId)
                ? current
                : [...current, incoming]);
              void markUserConversationRead(incoming.conversationId, user.userId).catch((readError: unknown) => {
                setError(readError instanceof Error ? readError.message : 'Unable to mark this conversation as read.');
              });
            }
            setConversations((current) => current.map((item) => item.conversationId === incoming.conversationId
              ? { ...item, lastMessage: incoming.message, lastMessageTime: incoming.messageTime }
              : item));
          } catch (parseError) {
            setError(parseError instanceof Error ? `Received an unreadable chat message: ${parseError.message}` : 'Received an unreadable chat message.');
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
      onWebSocketError: () => {
        setConnected(false);
        setError('Unable to connect to live messages. Check your connection and try again.');
      },
      onStompError: (frame) => {
        setConnected(false);
        setError(frame.headers.message || 'The chat server rejected the WebSocket connection.');
      },
    });
    clientRef.current = client;
    client.activate();
    return () => {
      clientRef.current = null;
      void client.deactivate();
    };
  }, [user.userId]);

  useEffect(() => {
    if (!selectedId) return;

    // Reset scroll state whenever a conversation is opened
    stickToBottomRef.current = true;
    forceBottomRef.current = true;
    pendingRestoreRef.current = null;
    loadingOlderRef.current = false;
    prevLastKeyRef.current = '';
    setVisibleCount(PAGE_SIZE);
    setNewWhileAway(0);
    setShowJumpButton(false);

    // On desktop, put the cursor in the message box so the user can type straight away.
    // Skipped on touch devices so the keyboard doesn't pop up unasked.
    if (window.matchMedia?.('(pointer: fine)').matches) {
      window.setTimeout(() => messageInputRef.current?.focus({ preventScroll: true }), 0);
    }

    let cancelled = false;
    void Promise.resolve()
      .then(() => {
        if (cancelled) return null;
        setMessages([]);
        setHistoryError(null);
        setLoadingMessages(true);
        const conversation = selectedRef.current;
        if (!conversation || conversation.conversationId !== selectedId) return null;
        return getUserConversationMessages(conversation, user.userId);
      })
      .then((history) => {
        if (!history || cancelled) return;
        setMessages(history);
        return markUserConversationRead(selectedId, user.userId);
      })
      .then(() => {
        if (!cancelled) setConversations((current) => current.map((item) => item.conversationId === selectedId ? { ...item, unreadCount: 0 } : item));
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setHistoryError(loadError instanceof Error ? loadError.message : 'Unable to load this conversation.');
      })
      .finally(() => { if (!cancelled) setLoadingMessages(false); });
    return () => { cancelled = true; };
  }, [selectedId, user.userId, historyReloadKey]);

  const scrollToBottom = useCallback((smooth: boolean) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    stickToBottomRef.current = true;
    setNewWhileAway(0);
    setShowJumpButton(false);
  }, []);

  // Runs after DOM updates but before paint, so there is no visible "jump".
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // 1) Earlier messages were just prepended: keep the user's position steady.
    if (pendingRestoreRef.current) {
      const { prevHeight, prevTop } = pendingRestoreRef.current;
      el.scrollTop = el.scrollHeight - prevHeight + prevTop;
      pendingRestoreRef.current = null;
      loadingOlderRef.current = false;
      return;
    }

    const last = messages[messages.length - 1];
    const lastKey = last ? `${last.conversationId}-${last.messageTime}-${last.senderId}` : '';
    const lastChanged = lastKey !== prevLastKeyRef.current;
    prevLastKeyRef.current = lastKey;

    // 2) Conversation just opened: land on the latest message instantly.
    if (forceBottomRef.current) {
      if (messages.length > 0) {
        el.scrollTop = el.scrollHeight;
        forceBottomRef.current = false;
        stickToBottomRef.current = true;
      }
      return;
    }

    // 3) A new message arrived at the end.
    if (lastChanged && last) {
      const own = last.senderId === user.userId;
      if (stickToBottomRef.current || own) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        stickToBottomRef.current = true;
      } else {
        setNewWhileAway((count) => count + 1);
        setShowJumpButton(true);
      }
    }
  }, [messages, visibleCount, user.userId]);

  const loadOlder = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    pendingRestoreRef.current = { prevHeight: el.scrollHeight, prevTop: el.scrollTop };
    setVisibleCount((count) => count + PAGE_SIZE);
  }, []);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom < NEAR_BOTTOM_PX;
    stickToBottomRef.current = atBottom;
    setShowJumpButton(distanceFromBottom > SHOW_JUMP_BUTTON_PX);
    if (atBottom) setNewWhileAway(0);
    if (el.scrollTop < LOAD_OLDER_TRIGGER_PX && hiddenCount > 0) loadOlder();
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || !selected) return;
    const client = clientRef.current;
    if (!connected || !client?.connected) {
      setError('Live messaging is not connected. Wait for reconnection before sending.');
      return;
    }
    const isBuyer = selected.buyerType === 'USER' && selected.buyerId === user.userId;
    const receiverId = isBuyer ? selected.sellerId : selected.buyerId;
    const receiverType = isBuyer ? selected.sellerType : selected.buyerType;
    try {
      client.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify({
          buyerId: selected.buyerId,
          buyerType: selected.buyerType,
          sellerId: selected.sellerId,
          sellerType: selected.sellerType,
          senderId: user.userId,
          senderType: 'USER',
          receiverId,
          receiverType,
          message,
        }),
      });
      stickToBottomRef.current = true; // make sure our own message scrolls into view
      setDraft('');
      setError(null);
      messageInputRef.current?.focus({ preventScroll: true }); // keep typing without extra taps
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send this message.');
    }
  }

  return (
    // Height is tied to the viewport so the composer is always on screen.
    // 10.5rem on mobile = sticky header + bottom nav; 6.5rem on desktop = sticky header only. Adjust if needed.
    <section
      ref={rootRef}
      className="grid h-[calc(100dvh-10.5rem)] max-h-[56rem] min-h-[24rem] scroll-mt-20 grid-rows-[minmax(0,1fr)] overflow-hidden rounded-2xl border border-[var(--hive-border)] bg-white md:grid-cols-[17rem_minmax(0,1fr)] lg:h-[calc(100dvh-6.5rem)]"
    >
      <aside className={`${selectedId ? 'hidden md:block' : 'block'} min-h-0 overflow-y-auto border-b border-[var(--hive-border)] md:border-b-0 md:border-r`}>
        <div className="sticky top-0 z-10 border-b border-[var(--hive-border)] bg-white p-4">
          <h2 className="font-bold text-[#17191c]">Messages</h2>
          <p className="mt-1 text-xs text-gray-500">{connected ? 'Live connection' : 'Connecting…'}</p>
        </div>
        {loadingConversations ? <p className="p-4 text-sm text-gray-600">Loading conversations…</p>
          : conversationError ? <div className="p-4"><p role="alert" className="text-sm text-red-800">{conversationError}</p><button type="button" onClick={() => void loadConversations()} className="mt-2 text-sm font-semibold text-[#008100] underline">Retry</button></div>
            : conversations.length === 0 ? <p className="p-4 text-sm text-gray-600">No conversations yet. Open a shop profile and choose Message shop to start one.</p>
              : conversations.map((conversation) => <button key={conversation.conversationId} type="button" onClick={() => setSelectedId(conversation.conversationId)} className={`flex w-full items-center gap-3 border-b border-gray-100 p-4 text-left hover:bg-gray-50 ${selectedId === conversation.conversationId ? 'bg-green-50' : ''}`}>
                {conversation.profile_picture ? <img src={conversation.profile_picture} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 font-bold text-[#008100]">{conversation.otherUserName?.slice(0, 1) || '?'}</div>}
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#17191c]">{conversation.otherUserName || 'HiveMarket contact'}</span><span className="block truncate text-xs text-gray-500">{conversation.lastMessage || 'No messages yet'}</span></span>
                {conversation.unreadCount > 0 && <span className="rounded-full bg-[#008100] px-2 py-0.5 text-xs font-bold text-white">{conversation.unreadCount}</span>}
              </button>)}
      </aside>

      <div className={`${selectedId ? 'flex' : 'hidden md:flex'} h-full min-h-0 min-w-0 flex-col overflow-hidden`}>
        {selected ? <>
          {/* Pinned: header */}
          <header className="flex shrink-0 items-center gap-3 border-b border-[var(--hive-border)] bg-white p-4">
            <button type="button" onClick={() => setSelectedId(null)} className="rounded-md px-2 py-1 text-sm font-semibold text-[#008100] md:hidden">Back</button>
            <h2 className="min-w-0 flex-1 truncate font-bold text-[#17191c]">{selected.otherUserName || 'Conversation'}</h2>
            <span className={`text-xs ${connected ? 'text-green-700' : 'text-gray-500'}`}>{connected ? 'Connected' : 'Reconnecting'}</span>
          </header>
          {error && <p role="alert" className="mx-3 mt-3 shrink-0 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

          {/* Scrollable: only the message list scrolls */}
          <div className="relative min-h-0 flex-1 bg-gray-50">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="h-full overflow-y-auto overscroll-contain px-4 py-3"
            >
              {loadingMessages ? <p className="text-sm text-gray-600">Loading messages…</p>
                : historyError ? <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{historyError}<button type="button" onClick={() => setHistoryReloadKey((key) => key + 1)} className="ml-2 font-semibold underline">Retry</button></div>
                  : messages.length === 0 ? <p className="text-center text-sm text-gray-500">Start the conversation with a message.</p>
                    : (
                      <>
                        {hiddenCount > 0 && (
                          <div className="mb-3 flex justify-center">
                            <button
                              type="button"
                              onClick={loadOlder}
                              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#008100] shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
                            >
                              Load earlier messages ({hiddenCount})
                            </button>
                          </div>
                        )}
                        {visibleMessages.map((message, i) => {
                          const index = startIndex + i;
                          const previous = index > 0 ? messages[index - 1] : null;
                          const own = message.senderId === user.userId;
                          const newDay = !previous
                            || new Date(previous.messageTime).toDateString() !== new Date(message.messageTime).toDateString();
                          const sameSenderAsPrevious = !!previous && !newDay && previous.senderId === message.senderId;
                          return (
                            <div key={`${message.conversationId}-${message.messageTime}-${message.senderId}-${index}`}>
                              {newDay && (
                                <div className="my-3 flex justify-center">
                                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-gray-500 shadow-sm ring-1 ring-gray-200">
                                    {formatDayLabel(message.messageTime)}
                                  </span>
                                </div>
                              )}
                              <div className={`flex ${own ? 'justify-end' : 'justify-start'} ${sameSenderAsPrevious ? 'mt-0.5' : 'mt-3'}`}>
                                <article className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm sm:max-w-[70%] ${own ? 'rounded-br-md bg-[#008100] text-white' : 'rounded-bl-md bg-white text-[#17191c] shadow-sm'}`}>
                                  <p className="whitespace-pre-wrap break-words">{message.fileUrl ? 'Attachment' : message.message}</p>
                                  {message.fileUrl && <a className="mt-1 block underline" href={message.fileUrl} target="_blank" rel="noreferrer">Open attachment</a>}
                                  <time
                                    dateTime={new Date(message.messageTime).toISOString()}
                                    title={new Date(message.messageTime).toLocaleString()}
                                    className={`mt-1 block text-right text-[10px] ${own ? 'text-green-100' : 'text-gray-500'}`}
                                  >
                                    {formatTime(message.messageTime)}
                                  </time>
                                </article>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
            </div>

            {showJumpButton && (
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                aria-label={newWhileAway > 0 ? `Scroll to latest, ${newWhileAway} new messages` : 'Scroll to latest message'}
                className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#008100] shadow-lg ring-1 ring-gray-200 hover:bg-gray-50"
              >
                <ArrowDown size={20} aria-hidden="true" />
                {newWhileAway > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-[1.25rem] rounded-full bg-[#008100] px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                    {newWhileAway > 99 ? '99+' : newWhileAway}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Pinned: composer is always visible, no scrolling needed to type */}
          <form onSubmit={sendMessage} className="flex shrink-0 items-center gap-2 border-t border-[var(--hive-border)] bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <input
              ref={messageInputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              aria-label="Message"
              placeholder="Write a message…"
              autoComplete="off"
              className="h-10 min-w-0 flex-1 rounded-lg border border-[var(--hive-border)] px-3 text-sm"
            />
            <button type="submit" disabled={!connected || !draft.trim()} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#008100] px-4 text-sm font-semibold text-white disabled:opacity-50"><Send size={15} />Send</button>
          </form>
        </> : <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-sm text-gray-500"><MessageCircle size={28} className="mb-2 text-[#008100]" />Select a conversation to view messages.</div>}
      </div>
    </section>
  );
}