import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import {
  getShopConversationMessages,
  getShopConversations,
  markShopConversationRead,
  type ShopConversation,
  type ShopMessage,
} from '../api/shopOwnerApi';
import { API_BASE_URL } from '../lib/config';
import { getAccessToken } from '../lib/tokenStorage';

const cardClass = 'rounded-xl border border-[var(--hive-border)] bg-white';
const maxFileBytes = 10 * 1024 * 1024;
const allowedFileExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt']);
const FILE_CHUNK_SIZE = 128 * 1024;

const PAGE_SIZE = 40; // how many messages render at first / per "load older"
const NEAR_BOTTOM_PX = 80; // within this distance we treat the user as "at the bottom"
const SHOW_JUMP_BUTTON_PX = 240; // show the scroll-to-bottom button beyond this distance
const LOAD_OLDER_TRIGGER_PX = 80; // load older messages when this close to the top

function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  const blockSize = 32 * 1024;
  for (let offset = 0; offset < bytes.length; offset += blockSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + blockSize, bytes.length)));
  }
  return btoa(binary);
}

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

export default function ShopOwnerMessagesSection({ shopId }: { shopId: string }) {
  const [conversations, setConversations] = useState<ShopConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ShopMessage[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [newWhileAway, setNewWhileAway] = useState(0);

  const selectedIdRef = useRef<string | null>(selectedId);
  const selectedConversationRef = useRef<ShopConversation | null>(null);
  const clientRef = useRef<Client | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);

  // Scroll management
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true); // is the user currently at/near the bottom?
  const forceBottomRef = useRef(false); // jump to bottom after the next render (conversation open)
  const pendingRestoreRef = useRef<{ prevHeight: number; prevTop: number } | null>(null);
  const loadingOlderRef = useRef(false);
  const prevLastKeyRef = useRef('');

  const selectedConversation = conversations.find((conversation) => conversation.conversationId === selectedId) || null;

  const hiddenCount = Math.max(0, messages.length - visibleCount);
  const startIndex = hiddenCount;
  const visibleMessages = hiddenCount > 0 ? messages.slice(startIndex) : messages;

  useEffect(() => {
    selectedIdRef.current = selectedId;
    selectedConversationRef.current = selectedConversation;
  }, [selectedId, selectedConversation]);

  useEffect(() => {
    let cancelled = false;
    async function loadConversations() {
      setLoadingConversations(true);
      setError(null);
      try {
        const result = await getShopConversations(shopId);
        if (!cancelled) {
          setConversations(result);
          setSelectedId((current) => current && result.some((item) => item.conversationId === current)
            ? current
            : result[0]?.conversationId || null);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load conversations.');
      } finally {
        if (!cancelled) setLoadingConversations(false);
      }
    }
    void loadConversations();
    return () => { cancelled = true; };
  }, [shopId]);

  useEffect(() => {
    // Reset scroll state whenever a conversation is opened
    stickToBottomRef.current = true;
    forceBottomRef.current = true;
    pendingRestoreRef.current = null;
    loadingOlderRef.current = false;
    prevLastKeyRef.current = '';
    setVisibleCount(PAGE_SIZE);
    setNewWhileAway(0);
    setShowJumpButton(false);
    setMessages([]);
    setAttachment(null);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';

    const conversation = selectedConversationRef.current;
    if (!selectedId || !conversation) return;

    // On desktop, put the cursor in the message box so the user can type straight away.
    // Skipped on touch devices so the keyboard doesn't pop up unasked.
    if (window.matchMedia?.('(pointer: fine)').matches) {
      window.setTimeout(() => messageInputRef.current?.focus({ preventScroll: true }), 0);
    }

    const activeConversation = conversation;
    let cancelled = false;
    async function loadMessages() {
      setLoadingMessages(true);
      setError(null);
      try {
        const history = await getShopConversationMessages(activeConversation, shopId);
        if (!cancelled) setMessages(history);
        await markShopConversationRead(activeConversation.conversationId, shopId);
        if (!cancelled) {
          setConversations((current) => current.map((item) => item.conversationId === activeConversation.conversationId
            ? { ...item, unreadCount: 0 }
            : item));
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load this conversation.');
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }
    void loadMessages();
    return () => { cancelled = true; };
  }, [selectedId, shopId]);

  useEffect(() => {
    const brokerUrl = `${API_BASE_URL.replace(/^http/, 'ws')}/ws`;
    const client = new Client({
      brokerURL: brokerUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      beforeConnect: () => {
        const latestToken = getAccessToken();
        if (!latestToken) {
          setError('Your sign-in has expired. Sign in again to use shop messages.');
          client.connectHeaders = {};
          return;
        }
        client.connectHeaders = {
          Authorization: `Bearer ${latestToken}`,
          mode: 'SHOP',
          shopId,
        };
      },
      onConnect: () => {
        setConnected(true);
        setError(null);
        client.subscribe('/user/hivemarket-queue/messages', (frame: IMessage) => {
          try {
            const incoming = JSON.parse(frame.body) as ShopMessage;
            if (incoming.conversationId === selectedIdRef.current) {
              setMessages((current) => current.some((message) => message.conversationId === incoming.conversationId
                && message.messageTime === incoming.messageTime
                && message.senderId === incoming.senderId)
                ? current
                : [...current, incoming]);
              void markShopConversationRead(incoming.conversationId, shopId).then(() => {
                setConversations((current) => current.map((item) => item.conversationId === incoming.conversationId
                  ? { ...item, unreadCount: 0 }
                  : item));
              }).catch((readError: unknown) => {
                setError(readError instanceof Error ? readError.message : 'Unable to mark the message as read.');
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
        setError('Unable to connect to live shop messages. Check your connection and try again.');
      },
      onStompError: (frame) => {
        setConnected(false);
        setError(frame.headers.message || 'The chat server rejected the WebSocket connection.');
      },
    });
    clientRef.current = client;
    client.activate();
    return () => {
      setConnected(false);
      clientRef.current = null;
      void client.deactivate();
    };
  }, [shopId]);

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

    // 1) Older messages were just prepended: keep the user's position steady.
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
      const ownMessage = last.senderId === shopId;
      if (stickToBottomRef.current || ownMessage) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        stickToBottomRef.current = true;
      } else {
        setNewWhileAway((count) => count + 1);
        setShowJumpButton(true);
      }
    }
  }, [messages, visibleCount, shopId]);

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

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || !selectedConversation) return;
    const client = clientRef.current;
    if (!connected) {
      setError('Live messaging is not connected. Wait for reconnection before sending.');
      return;
    }
    if (!client) {
      setError('The chat connection is unavailable. Reopen this section and try again.');
      return;
    }
    const shopIsBuyer = selectedConversation.buyerType === 'SHOP'
      && selectedConversation.buyerId === shopId;
    const receiverId = shopIsBuyer ? selectedConversation.sellerId : selectedConversation.buyerId;
    const receiverType = shopIsBuyer ? selectedConversation.sellerType : selectedConversation.buyerType;
    const payload = {
      buyerId: selectedConversation.buyerId,
      buyerType: selectedConversation.buyerType,
      sellerId: selectedConversation.sellerId,
      sellerType: selectedConversation.sellerType,
      senderId: shopId,
      senderType: 'SHOP',
      receiverId,
      receiverType,
      message,
    };

    try {
      client.publish({ destination: '/app/chat.sendMessage', body: JSON.stringify(payload) });
      stickToBottomRef.current = true; // make sure our own message scrolls into view
      setDraft('');
      setError(null);
      messageInputRef.current?.focus({ preventScroll: true }); // keep typing without extra taps
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send this message.');
    }
  }

  function clearAttachment() {
    setAttachment(null);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  }

  async function sendAttachment() {
    const file = attachment;
    const conversation = selectedConversation;
    const client = clientRef.current;
    if (!file || !conversation) return;
    if (!connected || !client?.connected) {
      setError('Live messaging is not connected. Wait for reconnection before sending an attachment.');
      return;
    }
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedFileExtensions.has(extension)) {
      setError('This file type is not supported. Use an image, PDF, Word, Excel, or text file.');
      return;
    }
    if (file.size === 0 || file.size > maxFileBytes) {
      setError('Choose a file smaller than 10 MB.');
      return;
    }

    const totalChunks = Math.ceil(file.size / FILE_CHUNK_SIZE);
    setUploadingAttachment(true);
    setUploadProgress(0);
    setError(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
        if (!client.connected) throw new Error('The chat connection closed while uploading. Reconnect and send the file again.');
        const chunk = bytes.subarray(chunkIndex * FILE_CHUNK_SIZE, Math.min((chunkIndex + 1) * FILE_CHUNK_SIZE, bytes.length));
        client.publish({
          destination: '/app/chat.sendFile',
          body: JSON.stringify({
            buyerId: conversation.buyerId,
            buyerType: conversation.buyerType,
            sellerId: conversation.sellerId,
            sellerType: conversation.sellerType,
            senderId: shopId,
            senderType: 'SHOP',
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
            chunkIndex,
            totalChunks,
            chunkData: encodeBase64(chunk),
          }),
        });
        setUploadProgress(chunkIndex + 1);
        if (chunkIndex < totalChunks - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 75));
        }
      }
      stickToBottomRef.current = true;
      clearAttachment();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to send this attachment.');
    } finally {
      setUploadingAttachment(false);
    }
  }

  return (
    // Height is tied to the viewport so the composer is always on screen.
    // Adjust 9rem to match the height of the header/nav above this section in your dashboard.
    <div className={`${cardClass} grid h-[calc(100dvh-9rem)] max-h-[56rem] min-h-[28rem] grid-rows-[minmax(0,1fr)] overflow-hidden md:grid-cols-[17rem_minmax(0,1fr)]`}>
      <aside className={`min-h-0 overflow-y-auto border-b border-[var(--hive-border)] md:border-b-0 md:border-r ${selectedId ? 'hidden md:block' : 'block'}`}>
        <div className="sticky top-0 z-10 border-b border-[var(--hive-border)] bg-white p-4">
          <h2 className="font-bold text-[#17191c]">Conversations</h2>
          <p className="mt-1 text-xs text-gray-500">{connected ? 'Live connection' : 'Connecting…'}</p>
        </div>
        {loadingConversations ? <p className="p-4 text-sm text-gray-600">Loading conversations…</p>
          : conversations.length === 0 ? <p className="p-4 text-sm text-gray-600">No shop conversations yet.</p>
            : conversations.map((conversation) => (
              <button
                key={conversation.conversationId}
                type="button"
                onClick={() => setSelectedId(conversation.conversationId)}
                className={`flex w-full items-center gap-3 border-b border-gray-100 p-4 text-left hover:bg-gray-50 ${selectedId === conversation.conversationId ? 'bg-green-50' : ''}`}
              >
                {conversation.profile_picture
                  ? <img src={conversation.profile_picture} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">{conversation.otherUserName?.slice(0, 1) || '?'}</div>}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#17191c]">{conversation.otherUserName || 'HiveMarket user'}</span>
                  <span className="block truncate text-xs text-gray-500">{conversation.lastMessage || 'No messages yet'}</span>
                </span>
                {conversation.unreadCount > 0 && <span className="rounded-full bg-[#008100] px-2 py-0.5 text-xs font-bold text-white">{conversation.unreadCount}</span>}
              </button>
            ))}
      </aside>

      <section className={`h-full min-h-0 min-w-0 flex-col overflow-hidden ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
        {selectedConversation ? (
          <>
            {/* Pinned: header */}
            <header className="flex shrink-0 items-center gap-3 border-b border-[var(--hive-border)] bg-white p-4">
              <button type="button" onClick={() => setSelectedId(null)} className="rounded-md px-2 py-1 text-sm font-semibold text-[#008100] md:hidden">Back</button>
              <h2 className="min-w-0 flex-1 truncate font-bold text-[#17191c]">{selectedConversation.otherUserName || 'Conversation'}</h2>
              <span className={`text-xs ${connected ? 'text-green-700' : 'text-gray-500'}`}>{connected ? 'Connected' : 'Reconnecting'}</span>
            </header>
            {error && <p role="alert" className="mx-4 mt-3 shrink-0 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

            {/* Scrollable: only the message list scrolls */}
            <div className="relative min-h-0 flex-1 bg-gray-50">
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto overscroll-contain px-4 py-3"
              >
                {loadingMessages ? <p className="text-sm text-gray-600">Loading messages…</p>
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
                          const ownMessage = message.senderId === shopId;
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
                              <div className={`flex ${ownMessage ? 'justify-end' : 'justify-start'} ${sameSenderAsPrevious ? 'mt-0.5' : 'mt-3'}`}>
                                <article className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm sm:max-w-[70%] ${ownMessage ? 'rounded-br-md bg-[#008100] text-white' : 'rounded-bl-md bg-white text-[#17191c] shadow-sm'}`}>
                                  <p className="whitespace-pre-wrap break-words">{message.fileUrl ? 'Attachment' : message.message}</p>
                                  {message.fileUrl && <a className="mt-1 block underline" href={message.fileUrl} target="_blank" rel="noreferrer">Open attachment</a>}
                                  <time
                                    dateTime={new Date(message.messageTime).toISOString()}
                                    title={new Date(message.messageTime).toLocaleString()}
                                    className={`mt-1 block text-right text-[10px] ${ownMessage ? 'text-green-100' : 'text-gray-500'}`}
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
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                  {newWhileAway > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-[1.25rem] rounded-full bg-[#008100] px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                      {newWhileAway > 99 ? '99+' : newWhileAway}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Pinned: composer is always visible, no scrolling needed to type */}
            <div className="shrink-0 border-t border-[var(--hive-border)] bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {attachment && (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
                  <span className="min-w-0 flex-1 truncate font-medium">{attachment.name}</span>
                  <button
                    type="button"
                    onClick={() => void sendAttachment()}
                    disabled={!connected || uploadingAttachment}
                    className="shrink-0 rounded-md bg-[#008100] px-3 py-1.5 font-semibold text-white disabled:opacity-50"
                  >
                    {uploadingAttachment
                      ? `Uploading ${uploadProgress ?? 0}/${Math.ceil(attachment.size / FILE_CHUNK_SIZE)}`
                      : 'Send file'}
                  </button>
                  <button
                    type="button"
                    onClick={clearAttachment}
                    disabled={uploadingAttachment}
                    aria-label="Remove attachment"
                    className="shrink-0 rounded-md px-2 py-1.5 font-semibold text-gray-500 hover:bg-gray-200 disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              )}
              <form onSubmit={(event) => void sendMessage(event)} className="flex items-center gap-2">
                <input
                  type="file"
                  hidden
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  aria-label="Choose an attachment"
                  disabled={uploadingAttachment}
                  ref={attachmentInputRef}
                  onChange={(event) => { setAttachment(event.target.files?.[0] || null); setError(null); }}
                />
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  disabled={uploadingAttachment}
                  aria-label="Attach a file"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--hive-border)] text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <input
                  ref={messageInputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  aria-label="Message"
                  placeholder="Write a message…"
                  autoComplete="off"
                  className="h-10 min-w-0 flex-1 rounded-lg border border-[var(--hive-border)] px-3 text-sm"
                />
                <button type="submit" disabled={!connected || !draft.trim()} className="h-10 shrink-0 rounded-lg bg-[#008100] px-4 text-sm font-semibold text-white disabled:opacity-50">Send</button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-500">
            Select a conversation to view messages.
          </div>
        )}
      </section>
    </div>
  );
}