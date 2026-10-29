import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  MessageCircle,
  MessageSquareText,
  Package,
  RefreshCw,
  ShoppingBag,
  Star,
  Store,
  UserRound,
} from 'lucide-react';
import {
  getMyShops,
  getSellerTransactions,
  getShopActivityStats,
  getShopNotifications,
  getShopOwnerProfile,
  getShopReviews,
  getShopVisitors,
  markShopNotificationRead,
  replyToShopReview,
  updateShopOpenStatus,
  type OwnedShopSummary,
  type SellerTransaction,
  type ShopActivityStats,
  type ShopNotification,
  type ShopOwnerProfile,
  type ShopReview,
  type ShopVisitor,
} from '../api/shopOwnerApi';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/router';
import ShopManagementPage from './ShopManagementPage';
import ShopOwnerMessagesSection from './ShopOwnerMessagesSection';
import ShopOwnerProfileSection from './ShopOwnerProfileSection';
import ShopOwnerRequestsSection from './ShopOwnerRequestsSection';

type DashboardSection = 'dashboard' | 'profile' | 'visitors' | 'requests' | 'listings' | 'transactions' | 'notifications' | 'messages' | 'reviews';

const navigation: Array<{ id: DashboardSection | 'listings'; label: string; icon: typeof Store; path: string }> = [
  { id: 'dashboard', label: 'Overview', icon: ChartNoAxesColumnIncreasing, path: '/shop-owner/dashboard' },
  { id: 'profile', label: 'Shop profile', icon: Store, path: '/shop-owner/profile' },
  { id: 'visitors', label: 'Visitors', icon: UserRound, path: '/shop-owner/visitors' },
  { id: 'requests', label: 'Shopping requests', icon: ClipboardList, path: '/shop-owner/requests' },
  { id: 'listings', label: 'Products & services', icon: Package, path: '/shop-owner/listings' },
  { id: 'transactions', label: 'Transactions', icon: ChartNoAxesColumnIncreasing, path: '/shop-owner/transactions' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/shop-owner/notifications' },
  { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/shop-owner/messages' },
  { id: 'reviews', label: 'Reviews', icon: Star, path: '/shop-owner/reviews' },
];
const dashboardSections: DashboardSection[] = [
  'dashboard', 'profile', 'visitors', 'requests', 'listings', 'transactions', 'notifications', 'messages', 'reviews',
];

const cardClass = 'rounded-xl border border-[var(--hive-border)] bg-white p-5';
const currency = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' });

function getTodayInLagos() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function DashboardOverview({ shopId, onManageListings }: { shopId: string; onManageListings: () => void }) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [profile, setProfile] = useState<ShopOwnerProfile | null>(null);
  const [stats, setStats] = useState<ShopActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusBusy, setStatusBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [shopProfile, activity] = await Promise.all([
          getShopOwnerProfile(shopId),
          getShopActivityStats(shopId, period),
        ]);
        if (!cancelled) {
          setProfile(shopProfile);
          setStats(activity);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load shop activity.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [shopId, period, refreshKey]);

  async function toggleShopStatus() {
    if (!profile || profile.isOpen == null) return;
    setStatusBusy(true);
    setError(null);
    try {
      const updated = await updateShopOpenStatus(shopId, !profile.isOpen);
      setProfile({ ...profile, isOpen: updated.isOpen });
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Unable to update shop status.');
    } finally {
      setStatusBusy(false);
    }
  }

  const peakVisitCount = stats
    ? Math.max(1, ...stats.visitsSeries.map((point) => point.value))
    : 1;

  if (loading) return <p className={cardClass}>Loading shop activity…</p>;

  return (
    <div className="space-y-5">
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">Shop activity for {period}</p>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Activity period" className="flex rounded-lg border border-[var(--hive-border)] bg-white p-1">
            {(['today', 'week', 'month'] as const).map((value) => (
              <button key={value} type="button" aria-pressed={period === value} onClick={() => setPeriod(value)} className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${period === value ? 'bg-green-50 text-[#008100]' : 'text-gray-600'}`}>
                {value}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="inline-flex items-center gap-2 rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2 text-sm font-semibold text-[#17191c]">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {profile && (
        <section className={`${cardClass} flex flex-wrap items-center justify-between gap-4`}>
          <div className="flex min-w-0 items-center gap-3">
            {profile.imageUrl ? <img src={profile.imageUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />
              : <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-50 text-[#008100]"><Store size={25} /></div>}
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-[#17191c]">{profile.name}</h2>
              <p className="text-sm text-gray-600">{profile.location?.address || 'Shop location not set'}</p>
            </div>
          </div>
          <button type="button" disabled={statusBusy || profile.isOpen == null} onClick={() => void toggleShopStatus()} className={`rounded-full px-4 py-2 text-sm font-semibold ${profile.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'} disabled:opacity-50`}>
            {statusBusy ? 'Updating…' : profile.isOpen == null ? 'Status unavailable' : profile.isOpen ? 'Open · Set closed' : 'Closed · Set open'}
          </button>
        </section>
      )}

      {stats && (
        <>
          <section aria-label="Shop metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: 'Shop profile views', value: stats.totalVisits, icon: UserRound },
              { label: 'Active shopping requests', value: stats.requestsCount, icon: ClipboardList },
              { label: 'Successful transactions', value: stats.transactionsCount, icon: ChartNoAxesColumnIncreasing },
              { label: 'Transaction amount', value: currency.format(stats.transactionsAmount || 0), icon: ChartNoAxesColumnIncreasing },
              { label: 'Subscribers', value: profile?.followers ?? '—', icon: UserRound },
            ].map((metric) => (
              <article key={metric.label} className={cardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-600">{metric.label}</p>
                  <metric.icon size={18} className="shrink-0 text-[#008100]" />
                </div>
                <p className="mt-3 text-2xl font-bold text-[#17191c]">{metric.value}</p>
              </article>
            ))}
          </section>
          <p className="-mt-2 text-xs text-gray-500">Profile views count shop-page views recorded by HiveMarket; they are not physical footfall. Transaction amounts reflect the activity endpoint’s reported totals for the selected period.</p>
          {stats.visitsSeries.length > 0 && (
            <section className={`${cardClass} overflow-hidden`}>
              <h2 className="font-bold text-[#17191c]">Profile views over time</h2>
              <div role="img" aria-label={`${stats.totalVisits} profile views for the selected period`} className="mt-4 flex h-36 min-w-0 items-end gap-2 overflow-x-auto border-b border-gray-200 pb-2">
                {stats.visitsSeries.map((point, index) => {
                  return (
                    <div key={`${point.label}-${index}`} title={`${point.label}: ${point.value}`} className="flex h-full min-w-5 flex-1 flex-col items-center justify-end gap-1">
                      <div className="w-full max-w-8 rounded-t bg-[#008100]" style={{ height: `${Math.max(3, (point.value / peakVisitCount) * 100)}%` }} />
                      <span className="w-full truncate text-center text-[10px] text-gray-500">{point.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          <section className={`${cardClass} flex flex-wrap items-center justify-between gap-4`}>
            <div>
              <h2 className="font-bold text-[#17191c]">Your listings</h2>
              <p className="mt-1 text-sm text-gray-600">{profile?.productCount ?? '—'} products · {profile?.serviceCount ?? '—'} services</p>
            </div>
            <button type="button" onClick={onManageListings} className="inline-flex items-center gap-2 rounded-lg bg-[#008100] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#006d24]">
              <Package size={16} /> Manage products and services
            </button>
          </section>
          {stats.recentVisitors.length > 0 && (
            <section className={cardClass}>
              <h2 className="font-bold text-[#17191c]">Recent profile visitors</h2>
              <ul className="mt-3 divide-y divide-gray-100">
                {stats.recentVisitors.slice(0, 5).map((visitor) => <li key={visitor.id} className="flex items-center gap-3 py-3">
                  {visitor.profile_picture ? <img src={visitor.profile_picture} alt="" className="h-9 w-9 rounded-full object-cover" />
                    : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold">{visitor.full_name?.slice(0, 1) || '?'}</div>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#17191c]">{visitor.full_name}</p>
                    <p className="text-xs text-gray-500">{visitor.university || 'University not listed'}</p>
                  </div>
                  <time className="text-xs text-gray-500">{formatDate(visitor.visited_at)}</time>
                </li>)}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function VisitorsSection({ shopId }: { shopId: string }) {
  const [date, setDate] = useState(getTodayInLagos);
  const [visitors, setVisitors] = useState<ShopVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getShopVisitors(shopId, date);
        if (!cancelled) setVisitors(result);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load visitors.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [shopId, date]);

  return (
    <section className="space-y-4">
      <label className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-700">
        <CalendarDays size={18} className="text-[#008100]" /> Visitor date
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2" />
      </label>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className={cardClass}>
        {loading ? <p className="text-sm text-gray-600">Loading visitors…</p>
          : visitors.length === 0 ? <p className="text-sm text-gray-600">No profile views were recorded for this date.</p>
            : <>
              <p className="text-sm text-gray-600">{visitors.length} recorded profile views{visitors.length === 100 ? ' (maximum returned for one date)' : ''}</p>
              <ul className="mt-3 divide-y divide-gray-100">
                {visitors.map((visitor) => <li key={visitor.id} className="flex items-center gap-3 py-3">
                  {visitor.profile_picture ? <img src={visitor.profile_picture} alt="" className="h-10 w-10 rounded-full object-cover" />
                    : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-sm font-bold text-[#008100]">{visitor.full_name?.slice(0, 1) || '?'}</div>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#17191c]">{visitor.full_name}</p>
                    <p className="text-xs text-gray-500">{visitor.university || 'University not listed'}</p>
                  </div>
                  <time className="text-right text-xs text-gray-500">{formatDate(visitor.visited_at)}</time>
                </li>)}
              </ul>
            </>}
      </div>
    </section>
  );
}

function TransactionsSection({ userId }: { userId: string }) {
  const [transactions, setTransactions] = useState<SellerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getSellerTransactions(userId);
        if (!cancelled) setTransactions(result);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load seller transactions.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div className={cardClass}>
      {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {loading ? <p className="text-sm text-gray-600">Loading transactions…</p>
        : transactions.length === 0 ? <p className="text-sm text-gray-600">No seller transactions were returned for this account.</p>
          : <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500"><tr><th className="py-3 pr-4">Reference</th><th className="py-3 pr-4">Amount</th><th className="py-3 pr-4">Status</th><th className="py-3">Date</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{transactions.map((transaction) => <tr key={transaction.id}>
                <td className="py-3 pr-4 font-medium text-[#17191c]">{transaction.reference}</td>
                <td className="py-3 pr-4">{currency.format(transaction.amount)}</td>
                <td className="py-3 pr-4">{transaction.status}</td>
                <td className="py-3">{formatDate(transaction.createdAt)}</td>
              </tr>)}</tbody>
            </table>
          </div>}
    </div>
  );
}

function NotificationsSection({ shopId }: { shopId: string }) {
  const [notifications, setNotifications] = useState<ShopNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getShopNotifications(shopId);
        if (!cancelled) setNotifications(result);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load shop notifications.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [shopId]);

  async function markRead(notification: ShopNotification) {
    if (notification.read) return;
    setBusyId(notification.id);
    setError(null);
    try {
      await markShopNotificationRead(notification.id, shopId);
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : 'Unable to mark this notification as read.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={cardClass}>
      {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {loading ? <p className="text-sm text-gray-600">Loading notifications…</p>
        : notifications.length === 0 ? <p className="text-sm text-gray-600">No shop notifications.</p>
          : <ul className="divide-y divide-gray-100">{notifications.map((notification) => <li key={notification.id} className={`flex items-start gap-3 py-4 ${notification.read ? '' : 'bg-green-50/50'}`}>
            <MessageSquareText size={18} className="mt-1 shrink-0 text-[#008100]" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-semibold text-[#17191c]">{notification.title}</h2>
                <time className="text-xs text-gray-500">{notification.time}</time>
              </div>
              <p className="mt-1 text-sm text-gray-600">{notification.body}</p>
              <p className="mt-1 text-xs text-gray-500">{notification.group.toLowerCase()} · {notification.type}</p>
            </div>
            {!notification.read && <button type="button" disabled={busyId === notification.id} onClick={() => void markRead(notification)} className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-[#008100] disabled:opacity-50">{busyId === notification.id ? 'Saving…' : 'Mark read'}</button>}
          </li>)}</ul>}
    </div>
  );
}

function ReviewsSection({ shopId, ownerId }: { shopId: string; ownerId: string }) {
  const [reviews, setReviews] = useState<ShopReview[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getShopReviews(shopId);
        if (!cancelled) setReviews(result);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load shop reviews.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [shopId]);

  async function submitReply(review: ShopReview) {
    const text = drafts[review.id]?.trim();
    if (!text) return;
    setBusyId(review.id);
    setError(null);
    try {
      const updated = await replyToShopReview(review.id, ownerId, text);
      setReviews((current) => current.map((item) => item.id === updated.id ? updated : item));
      setDrafts((current) => ({ ...current, [review.id]: '' }));
    } catch (replyError) {
      setError(replyError instanceof Error ? replyError.message : 'Unable to reply to this review.');
    } finally {
      setBusyId(null);
    }
  }

  const average = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {!loading && <p className="text-sm text-gray-600">{reviews.length} reviews · {average} average rating</p>}
      {loading ? <div className={cardClass}>Loading reviews…</div>
        : reviews.length === 0 ? <div className={cardClass}>No reviews have been posted for this shop yet.</div>
          : reviews.map((review) => <article key={review.id} className={cardClass}>
            <div className="flex items-start gap-3">
              {review.userAvatar ? <img src={review.userAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold">{review.userName?.slice(0, 1) || '?'}</div>}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold text-[#17191c]">{review.userName}</h2>
                  <span className="text-sm font-semibold text-amber-700">{'★'.repeat(Math.max(0, Math.min(5, review.rating)))} <span className="text-gray-600">{review.rating}/5</span></span>
                </div>
                <time className="text-xs text-gray-500">{formatDate(review.createdAt)}</time>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{review.comment}</p>
              </div>
            </div>
            {review.replies.map((reply) => <div key={reply.id} className={`ml-4 mt-3 border-l-2 py-1 pl-3 sm:ml-12 ${reply.isOwner ? 'border-[#008100]' : 'border-gray-200'}`}>
              <p className="text-xs font-semibold text-gray-700">{reply.authorName}{reply.isOwner ? ' · Shop owner' : ''}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{reply.text}</p>
            </div>)}
            <form onSubmit={(event) => { event.preventDefault(); void submitReply(review); }} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input value={drafts[review.id] || ''} onChange={(event) => setDrafts((current) => ({ ...current, [review.id]: event.target.value }))} aria-label={`Reply to ${review.userName}'s review`} placeholder="Write an owner response…" className="min-w-0 flex-1 rounded-lg border border-[var(--hive-border)] px-3 py-2 text-sm" />
              <button type="submit" disabled={!drafts[review.id]?.trim() || busyId === review.id} className="rounded-lg bg-[#008100] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busyId === review.id ? 'Sending…' : 'Reply'}</button>
            </form>
          </article>)}
    </div>
  );
}

export default function ShopOwnerDashboardPage({ section = 'dashboard' }: { section?: string }) {
  const { user } = useAuth();
  const { navigate, pathname } = useRouter();
  const [shops, setShops] = useState<OwnedShopSummary[]>([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadShops() {
      setLoading(true);
      setError(null);
      try {
        const result = await getMyShops();
        if (!cancelled) {
          setShops(result);
          setSelectedShopId((current) => current && result.some((shop) => shop.id === current)
            ? current
            : result[0]?.id || '');
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load your shops.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadShops();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const currentSection: DashboardSection = dashboardSections.includes(section as DashboardSection)
    ? section as DashboardSection
    : 'dashboard';
  const selectedShop = shops.find((shop) => shop.id === selectedShopId) || null;

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--hive-background)] p-6 text-sm text-gray-600">Loading your shop workspace…</div>;
  }

  return (
    <main className="min-h-screen bg-[var(--hive-background)] px-3 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/account')} className="inline-flex items-center gap-2 text-sm font-semibold text-[#008100]">
            <ArrowLeft size={17} /> Your account
          </button>
          <button type="button" onClick={() => navigate('/shopping')} className="inline-flex items-center gap-2 rounded-lg bg-[#008100] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#006d24]">
            <ShoppingBag size={16} /> Explore HiveMarket
          </button>
        </div>
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#008100]">HiveMarket seller tools</p>
            <h1 className="mt-1 text-2xl font-bold text-[#17191c] sm:text-3xl">Shop owner dashboard</h1>
          </div>
          {shops.length > 1 && (
            <label className="text-sm font-medium text-gray-700">
              Active shop
              <select value={selectedShopId} onChange={(event) => setSelectedShopId(event.target.value)} className="ml-2 max-w-[16rem] rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2.5">
                {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
              </select>
            </label>
          )}
        </header>

        {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <span>{error}</span>
          <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="font-semibold underline">Try again</button>
        </div>}

        {shops.length === 0 && !error ? (
          <section className={`${cardClass} flex items-start gap-3`}>
            <Store className="mt-0.5 shrink-0 text-[#008100]" size={22} />
            <div>
              <h2 className="font-semibold text-[#17191c]">No shop is linked to your account</h2>
              <p className="mt-2 text-sm text-gray-600">When a HiveMarket shop is registered to your account, it will appear here.</p>
            </div>
          </section>
        ) : selectedShop ? (
          <>
            <nav aria-label="Shop owner navigation" className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-[var(--hive-border)] bg-white p-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === currentSection || (item.id === 'listings' && pathname === '/shop-management');
                return (
                  <button key={item.id} type="button" onClick={() => navigate(item.path)} aria-current={isActive ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-green-50 text-[#008100]' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Icon size={16} />{item.label}
                  </button>
                );
              })}
            </nav>
            <div className="mb-5 flex items-center gap-3">
              {selectedShop.imageUrl ? <img src={selectedShop.imageUrl} alt="" className="h-11 w-11 rounded-lg object-cover" />
                : <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-[#008100]"><Store size={20} /></div>}
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Managing shop</p>
                <p className="truncate font-semibold text-[#17191c]">{selectedShop.name}</p>
              </div>
            </div>

            {currentSection === 'dashboard' && <DashboardOverview shopId={selectedShop.id} onManageListings={() => navigate('/shop-owner/listings')} />}
            {currentSection === 'profile' && <ShopOwnerProfileSection key={selectedShop.id} shopId={selectedShop.id} />}
            {currentSection === 'visitors' && <VisitorsSection key={selectedShop.id} shopId={selectedShop.id} />}
            {currentSection === 'requests' && <ShopOwnerRequestsSection key={selectedShop.id} shopId={selectedShop.id} />}
            {currentSection === 'listings' && <ShopManagementPage key={selectedShop.id} initialShopId={selectedShop.id} returnToDashboard />}
            {currentSection === 'transactions' && (user?.userId
              ? <TransactionsSection key={user.userId} userId={user.userId} />
              : <p role="alert" className={cardClass}>Your signed-in user ID is unavailable.</p>)}
            {currentSection === 'notifications' && <NotificationsSection key={selectedShop.id} shopId={selectedShop.id} />}
            {currentSection === 'messages' && <ShopOwnerMessagesSection key={selectedShop.id} shopId={selectedShop.id} />}
            {currentSection === 'reviews' && (user?.userId
              ? <ReviewsSection key={selectedShop.id} shopId={selectedShop.id} ownerId={user.userId} />
              : <p role="alert" className={cardClass}>Your signed-in user ID is unavailable.</p>)}
          </>
        ) : null}
      </div>
    </main>
  );
}
