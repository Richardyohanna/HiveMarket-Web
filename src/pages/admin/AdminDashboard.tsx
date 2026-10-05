import { useEffect, useState } from 'react';
import {
  getAdminAnalytics,
  getAdminAudit,
  getAdminDashboard,
  getAdminFeedback,
  getAdminRequests,
  getAdminShopDetail,
  getAdminShops,
  getAdminSupport,
  getAdminUserDetail,
  getAdminUsers,
  sendAdminRequestReminder,
  updateAdminSupport,
  type AdminAnalyticsPoint,
  type AdminAuditEntry,
  type AdminDashboardMetrics,
  type AdminFeedback,
  type AdminPage,
  type AdminRequest,
  type AdminShopDetail,
  type AdminShopSummary,
  type AdminSupportRequest,
  type AdminUserDetail,
  type AdminUserSummary,
} from '../../api/adminApi';
import { ApiError } from '../../lib/apiClient';
import { useAuth } from '../../lib/AuthContext';
import { useRouter } from '../../lib/router';
import { ErrorBanner, SecondaryButton, SuccessBanner, TextInput } from '../../components/ui';

type AdminTab = 'overview' | 'users' | 'shops' | 'requests' | 'support' | 'feedback' | 'audit';
type PageData<T> = AdminPage<T>;

const tabs: { id: AdminTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'shops', label: 'Shops' },
  { id: 'requests', label: 'Requests' },
  { id: 'support', label: 'Support' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'audit', label: 'Audit history' },
];

const cardClass = 'rounded-xl border border-[var(--hive-border)] bg-white p-4';
const tableClass = 'w-full min-w-[720px] border-collapse text-left text-sm';
const headClass = 'border-b border-[var(--hive-border)] bg-gray-50 text-xs uppercase tracking-wide text-gray-500';

function displayDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function Pagination({ data, onPage }: { data: PageData<unknown> | null; onPage: (page: number) => void }) {
  if (!data || data.totalPages < 2) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
      <span>{data.totalElements} records · Page {data.page + 1} of {data.totalPages}</span>
      <div className="flex gap-2">
        <SecondaryButton className="w-auto px-3 py-1.5 text-sm" disabled={data.page === 0} onClick={() => onPage(data.page - 1)}>
          Previous
        </SecondaryButton>
        <SecondaryButton className="w-auto px-3 py-1.5 text-sm" disabled={data.page + 1 >= data.totalPages} onClick={() => onPage(data.page + 1)}>
          Next
        </SecondaryButton>
      </div>
    </div>
  );
}

function tabFromSection(section: string): AdminTab {
  const tab = tabs.find((item) => item.id === section);
  return tab?.id ?? 'overview';
}

export default function AdminDashboard({ initialSection = 'overview' }: { initialSection?: string }) {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<AdminTab>(() => tabFromSection(initialSection));
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsPoint[]>([]);
  const [users, setUsers] = useState<PageData<AdminUserSummary> | null>(null);
  const [shops, setShops] = useState<PageData<AdminShopSummary> | null>(null);
  const [requests, setRequests] = useState<PageData<AdminRequest> | null>(null);
  const [support, setSupport] = useState<PageData<AdminSupportRequest> | null>(null);
  const [feedback, setFeedback] = useState<PageData<AdminFeedback> | null>(null);
  const [audit, setAudit] = useState<PageData<AdminAuditEntry> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | AdminShopDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        if (tab === 'overview') {
          const [dashboard, points] = await Promise.all([getAdminDashboard(), getAdminAnalytics()]);
          if (!cancelled) {
            setMetrics(dashboard);
            setAnalytics(points);
          }
        } else if (tab === 'users') {
          const data = await getAdminUsers({ query: appliedQuery, page, size: 20 });
          if (!cancelled) setUsers(data);
        } else if (tab === 'shops') {
          const data = await getAdminShops({ query: appliedQuery, page, size: 20 });
          if (!cancelled) setShops(data);
        } else if (tab === 'requests') {
          const data = await getAdminRequests({ query: appliedQuery, status: filter || undefined, page, size: 20 });
          if (!cancelled) setRequests(data);
        } else if (tab === 'support') {
          const data = await getAdminSupport({ status: filter || undefined, page, size: 20 });
          if (!cancelled) setSupport(data);
        } else if (tab === 'feedback') {
          const data = await getAdminFeedback({ category: filter || undefined, page, size: 20 });
          if (!cancelled) setFeedback(data);
        } else {
          const data = await getAdminAudit({ page, size: 20 });
          if (!cancelled) setAudit(data);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Unable to load admin data.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [tab, appliedQuery, filter, page, refreshKey]);

  function selectTab(nextTab: AdminTab) {
    setTab(nextTab);
    setPage(0);
    setFilter('');
    setNotice(null);
    navigate(nextTab === 'overview' ? '/admin' : `/admin/${nextTab}`);
  }

  async function remind(request: AdminRequest) {
    setWorkingId(request.id);
    setError(null);
    setNotice(null);
    try {
      await sendAdminRequestReminder(request.id);
      setNotice(`Reminder sent to ${request.shopOwnerEmail}.`);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send the reminder.');
    } finally {
      setWorkingId(null);
    }
  }

  async function saveSupportStatus(id: string, status: string, response: string) {
    setWorkingId(id);
    setError(null);
    setNotice(null);
    try {
      await updateAdminSupport(id, { status, response });
      setNotice('Support request updated.');
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update support request.');
    } finally {
      setWorkingId(null);
    }
  }

  async function openDetails(kind: 'user' | 'shop', id: string) {
    setError(null);
    setDetail(null);
    try {
      setDetail(kind === 'user' ? await getAdminUserDetail(id) : await getAdminShopDetail(id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load record details.');
    }
  }

  const metricCards = metrics ? [
    ['Users', metrics.totalUsers, `${metrics.onlineUsers} connected now · ${metrics.activeUsers} enabled`],
    ['Shops', metrics.totalShops, `${metrics.openShops} currently open`],
    ['Products', metrics.totalProducts, `${metrics.activeProducts} active`],
    ['Shopping requests', metrics.totalRequests, `${metrics.pendingRequests} pending`],
    ['Open support', metrics.openSupportRequests, 'Customer support queue'],
    ['Feedback', metrics.suggestions, 'App ratings and feedback'],
    ['Shop reports', metrics.pendingReports, 'Awaiting review'],
    ['Deletion requests', metrics.pendingDeletionRequests + metrics.scheduledDeletionRequests,
      `${metrics.pendingDeletionRequests} awaiting confirmation · ${metrics.scheduledDeletionRequests} scheduled`],
  ] : [];

  return (
    <div className="min-h-screen bg-[var(--hive-background)]">
      <header className="border-b border-[var(--hive-border)] bg-white px-5 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#008100]">HiveMarket Admin</p>
            <h1 className="text-lg font-bold text-[#17191c]">{user?.fullName}</h1>
          </div>
          <div className="flex gap-2">
            <SecondaryButton type="button" className="w-auto px-4" onClick={() => navigate('/')}>Site</SecondaryButton>
            <SecondaryButton type="button" className="w-auto px-4" onClick={() => {
              logout();
              navigate('/', { replace: true });
            }}>Sign out</SecondaryButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#17191c]">Administrative console</h2>
            <p className="mt-1 text-sm text-gray-500">Live records and aggregate metrics from HiveMarket.</p>
          </div>
          <button type="button" onClick={() => navigate('/admin/register-shop')}
            className="rounded-lg bg-[#008100] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#006d24]">
            + Register shop
          </button>
        </div>

        <nav className="mb-5 flex gap-2 overflow-x-auto pb-1" aria-label="Admin sections">
          {tabs.map((item) => (
            <button key={item.id} type="button" onClick={() => selectTab(item.id)}
              className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-semibold ${tab === item.id
                ? 'bg-[#008100] text-white' : 'border border-[var(--hive-border)] bg-white text-gray-600 hover:bg-gray-50'}`}>
              {item.label}
            </button>
          ))}
        </nav>

        <ErrorBanner message={error} />
        <SuccessBanner message={notice} />

        {(tab === 'users' || tab === 'shops' || tab === 'requests') && (
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <TextInput placeholder={`Search ${tab} by name or email`} value={query} onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setPage(0);
                  setAppliedQuery(query.trim());
                }
              }} />
            <SecondaryButton type="button" className="w-auto px-5" disabled={isLoading} onClick={() => {
              setPage(0);
              setAppliedQuery(query.trim());
            }}>Search</SecondaryButton>
          </div>
        )}

        {(tab === 'requests' || tab === 'support' || tab === 'feedback') && (
          <div className="mb-4">
            <label className="sr-only" htmlFor="admin-filter">Filter records</label>
            <select id="admin-filter" value={filter} onChange={(event) => {
              setPage(0);
              setFilter(event.target.value);
            }} className="rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2.5 text-sm text-[#17191c]">
              <option value="">All {tab}</option>
              {(tab === 'requests'
                ? ['PENDING', 'ACCEPTED', 'DECLINED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED']
                : tab === 'support'
                  ? ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
                  : ['LOVE', 'IDEA', 'BUG', 'OTHER']
              ).map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
            </select>
          </div>
        )}

        {tab === 'overview' && (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metricCards.map(([label, value, caption]) => (
                <div key={label} className={cardClass}>
                  <p className="text-sm font-medium text-gray-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-[#17191c]">{isLoading && !metrics ? '—' : value}</p>
                  <p className="mt-1 text-xs text-gray-500">{caption}</p>
                </div>
              ))}
            </section>
            <section className={`${cardClass} mt-5`}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#17191c]">Activity analytics</h3>
                  <p className="text-xs text-gray-500">Daily counts for the past 30 days; no estimated values.</p>
                </div>
                {metrics && <p className="text-xs text-gray-500">Today: {metrics.usersToday} users · {metrics.shopsToday} shops</p>}
              </div>
              <div className="overflow-x-auto">
                <table className={tableClass}>
                  <thead className={headClass}><tr>
                    {['Date', 'Users', 'Shops', 'Requests', 'Support', 'Feedback'].map((label) => <th key={label} className="px-3 py-2">{label}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-[var(--hive-border)]">
                    {analytics.slice(-14).map((point) => <tr key={point.date}>
                      <td className="px-3 py-2">{point.date}</td><td className="px-3 py-2">{point.users}</td>
                      <td className="px-3 py-2">{point.shops}</td><td className="px-3 py-2">{point.requests}</td>
                      <td className="px-3 py-2">{point.supportRequests}</td><td className="px-3 py-2">{point.feedback}</td>
                    </tr>)}
                    {!analytics.length && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">{isLoading ? 'Loading analytics…' : 'No analytics data available.'}</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className={cardClass}><p className="text-sm text-gray-500">New users this week</p><p className="mt-2 text-2xl font-bold">{metrics?.usersThisWeek ?? '—'}</p></div>
              <div className={cardClass}><p className="text-sm text-gray-500">New users this month</p><p className="mt-2 text-2xl font-bold">{metrics?.usersThisMonth ?? '—'}</p></div>
              <div className={cardClass}><p className="text-sm text-gray-500">Shops registered this month</p><p className="mt-2 text-2xl font-bold">{metrics?.shopsThisMonth ?? '—'}</p></div>
            </div>
          </>
        )}

        {tab === 'users' && (
          <section className={cardClass}>
            <h3 className="mb-3 font-bold">Users</h3>
            <div className="overflow-x-auto"><table className={tableClass}>
              <thead className={headClass}><tr>{['Name', 'Email', 'Phone', 'Registered', 'Account', 'Details'].map((x) => <th key={x} className="px-3 py-2">{x}</th>)}</tr></thead>
              <tbody className="divide-y divide-[var(--hive-border)]">{users?.content.map((entry) => <tr key={entry.id}>
                <td className="px-3 py-3 font-medium">{entry.fullName}</td><td className="px-3 py-3">{entry.email}</td>
                <td className="px-3 py-3">{entry.phone || '—'}</td><td className="px-3 py-3">{displayDate(entry.registeredAt)}</td>
                <td className="px-3 py-3">{entry.isAdmin ? 'Admin' : entry.hasShop ? 'Shop owner' : 'Customer'}</td>
                <td className="px-3 py-3"><button type="button" className="font-semibold text-[#008100]" onClick={() => void openDetails('user', entry.id)}>View</button></td>
              </tr>)}
              {!users?.content.length && <EmptyRow cols={6} loading={isLoading} />}
              </tbody></table></div>
            <Pagination data={users} onPage={setPage} />
          </section>
        )}

        {tab === 'shops' && (
          <section className={cardClass}>
            <h3 className="mb-3 font-bold">Shops</h3>
            <div className="overflow-x-auto"><table className={tableClass}>
              <thead className={headClass}><tr>{['Shop', 'Owner', 'Owner email', 'Phone', 'Status', 'Registered', 'Details'].map((x) => <th key={x} className="px-3 py-2">{x}</th>)}</tr></thead>
              <tbody className="divide-y divide-[var(--hive-border)]">{shops?.content.map((entry) => <tr key={entry.id}>
                <td className="px-3 py-3 font-medium">{entry.name}</td><td className="px-3 py-3">{entry.ownerName || '—'}</td>
                <td className="px-3 py-3">{entry.ownerEmail || '—'}</td><td className="px-3 py-3">{entry.phone || '—'}</td>
                <td className="px-3 py-3">{entry.status}</td><td className="px-3 py-3">{displayDate(entry.registeredAt)}</td>
                <td className="px-3 py-3"><button type="button" className="font-semibold text-[#008100]" onClick={() => void openDetails('shop', entry.id)}>View</button></td>
              </tr>)}
              {!shops?.content.length && <EmptyRow cols={7} loading={isLoading} />}
              </tbody></table></div>
            <Pagination data={shops} onPage={setPage} />
          </section>
        )}

        {tab === 'requests' && (
          <section className={cardClass}>
            <h3 className="mb-3 font-bold">Shopping-list requests</h3>
            <div className="overflow-x-auto"><table className={tableClass}>
              <thead className={headClass}><tr>{['Customer', 'Shop', 'Owner', 'Status', 'Created', 'Reminder'].map((x) => <th key={x} className="px-3 py-2">{x}</th>)}</tr></thead>
              <tbody className="divide-y divide-[var(--hive-border)]">{requests?.content.map((entry) => <tr key={entry.id}>
                <td className="px-3 py-3"><p className="font-medium">{entry.customerName}</p><p className="text-xs text-gray-500">{entry.customerEmail}</p></td>
                <td className="px-3 py-3">{entry.shopName}</td>
                <td className="px-3 py-3"><p>{entry.shopOwnerName}</p><p className="text-xs text-gray-500">{entry.shopOwnerEmail}</p></td>
                <td className="px-3 py-3">{entry.status.replaceAll('_', ' ')}</td><td className="px-3 py-3">{displayDate(entry.createdAt)}</td>
                <td className="px-3 py-3">{entry.status === 'PENDING' ? <button type="button" disabled={workingId === entry.id}
                  onClick={() => void remind(entry)} className="rounded-md border border-[#008100] px-2.5 py-1.5 text-xs font-semibold text-[#008100] disabled:opacity-50">
                  {workingId === entry.id ? 'Sending…' : 'Send reminder'}
                </button> : <span className="text-xs text-gray-500">{entry.lastAdminReminderAt ? displayDate(entry.lastAdminReminderAt) : '—'}</span>}</td>
              </tr>)}
              {!requests?.content.length && <EmptyRow cols={6} loading={isLoading} />}
              </tbody></table></div>
            <Pagination data={requests} onPage={setPage} />
          </section>
        )}

        {tab === 'support' && (
          <section className={cardClass}>
            <h3 className="mb-3 font-bold">Customer support</h3>
            <div className="overflow-x-auto"><table className={tableClass}>
              <thead className={headClass}><tr>{['Customer', 'Topic / subject', 'Message', 'Priority', 'Response', 'Status', 'Update'].map((x) => <th key={x} className="px-3 py-2">{x}</th>)}</tr></thead>
              <tbody className="divide-y divide-[var(--hive-border)]">{support?.content.map((entry) => <SupportRow key={`${entry.id}-${entry.updatedAt || ''}`} entry={entry}
                disabled={workingId === entry.id} onSave={(status, response) => void saveSupportStatus(entry.id, status, response)} />)}
              {!support?.content.length && <EmptyRow cols={7} loading={isLoading} />}
              </tbody></table></div>
            <Pagination data={support} onPage={setPage} />
          </section>
        )}

        {tab === 'feedback' && (
          <section className={cardClass}>
            <h3 className="mb-3 font-bold">App feedback</h3>
            <div className="overflow-x-auto"><table className={tableClass}>
              <thead className={headClass}><tr>{['User', 'Category', 'Rating', 'Feedback', 'Submitted'].map((x) => <th key={x} className="px-3 py-2">{x}</th>)}</tr></thead>
              <tbody className="divide-y divide-[var(--hive-border)]">{feedback?.content.map((entry) => <tr key={entry.id}>
                <td className="px-3 py-3"><p className="font-medium">{entry.userName}</p><p className="text-xs text-gray-500">{entry.userEmail}</p></td>
                <td className="px-3 py-3">{entry.category || '—'}</td><td className="px-3 py-3">{entry.rating}/5</td>
                <td className="max-w-lg whitespace-pre-wrap px-3 py-3">{entry.message || '—'}</td><td className="px-3 py-3">{displayDate(entry.createdAt)}</td>
              </tr>)}
              {!feedback?.content.length && <EmptyRow cols={5} loading={isLoading} />}
              </tbody></table></div>
            <Pagination data={feedback} onPage={setPage} />
          </section>
        )}

        {tab === 'audit' && (
          <section className={cardClass}>
            <h3 className="mb-3 font-bold">Administrative audit history</h3>
            <div className="overflow-x-auto"><table className={tableClass}>
              <thead className={headClass}><tr>{['Time', 'Admin', 'Action', 'Target', 'Details'].map((x) => <th key={x} className="px-3 py-2">{x}</th>)}</tr></thead>
              <tbody className="divide-y divide-[var(--hive-border)]">{audit?.content.map((entry) => <tr key={entry.id}>
                <td className="whitespace-nowrap px-3 py-3">{displayDate(entry.createdAt)}</td><td className="px-3 py-3">{entry.adminUserId}</td>
                <td className="px-3 py-3 font-medium">{entry.action}</td><td className="px-3 py-3">{entry.targetType} · {entry.targetId || '—'}</td>
                <td className="px-3 py-3">{entry.metadata || '—'}</td>
              </tr>)}
              {!audit?.content.length && <EmptyRow cols={5} loading={isLoading} />}
              </tbody></table></div>
            <Pagination data={audit} onPage={setPage} />
          </section>
        )}
        {detail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onClick={() => setDetail(null)}>
            <section role="dialog" aria-modal="true" aria-label="Record details" onClick={(event) => event.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-[#008100]">Record details</p>
                  <h3 className="text-xl font-bold text-[#17191c]">{'email' in detail ? detail.fullName : detail.name}</h3></div>
                <button type="button" aria-label="Close details" className="text-2xl leading-none text-gray-500" onClick={() => setDetail(null)}>×</button>
              </div>
              {'email' in detail ? (
                <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-2 text-sm">
                  <Detail label="Name" value={detail.fullName} /><Detail label="Email" value={detail.email} />
                  <Detail label="Phone" value={detail.phone} /><Detail label="Role" value={detail.role} />
                  <Detail label="Enabled" value={detail.enabled ? 'Yes' : 'No'} />
                  <Detail label="Current presence" value={detail.online ? 'Connected now' : 'Offline'} />
                  <Detail label="Last login" value={displayDate(detail.lastLoginAt)} />
                  <Detail label="Registered" value={displayDate(detail.registeredAt)} />
                  <Detail label="Shop" value={detail.shopName} />
                </dl>
              ) : (
                <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-2 text-sm">
                  <Detail label="Owner" value={detail.ownerName} /><Detail label="Owner email" value={detail.ownerEmail} />
                  <Detail label="Phone" value={detail.phone} /><Detail label="Type" value={detail.shopType} />
                  <Detail label="Address" value={detail.address} /><Detail label="Open" value={detail.open ? 'Yes' : 'No'} />
                  <Detail label="Verified" value={detail.verified ? 'Yes' : 'No'} />
                  <Detail label="Active products" value={String(detail.productCount)} />
                  <Detail label="Registered" value={displayDate(detail.registeredAt)} />
                </dl>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyRow({ cols, loading }: { cols: number; loading: boolean }) {
  return <tr><td colSpan={cols} className="px-3 py-8 text-center text-sm text-gray-400">
    {loading ? 'Loading records…' : 'No records found.'}
  </td></tr>;
}

function SupportRow({ entry, disabled, onSave }: {
  entry: AdminSupportRequest;
  disabled: boolean;
  onSave: (status: string, response: string) => void;
}) {
  const [status, setStatus] = useState(entry.status);
  const [response, setResponse] = useState(entry.response || '');
  return (
    <tr>
      <td className="px-3 py-3"><p className="font-medium">{entry.userName}</p><p className="text-xs text-gray-500">{entry.userEmail}</p></td>
      <td className="px-3 py-3"><p className="font-medium">{entry.topic}</p><p className="text-xs">{entry.subject}</p></td>
      <td className="max-w-sm whitespace-pre-wrap px-3 py-3">{entry.message}</td>
      <td className="px-3 py-3">{entry.priority > 0 ? 'High' : entry.priority < 0 ? 'Low' : 'Normal'}</td>
      <td className="px-3 py-3"><textarea aria-label={`Response for ${entry.subject}`} value={response}
        onChange={(event) => setResponse(event.target.value)} maxLength={2000} rows={2}
        className="min-w-52 rounded border border-[var(--hive-border)] px-2 py-1.5" /></td>
      <td className="px-3 py-3">
        <select aria-label={`Status for ${entry.subject}`} value={status} onChange={(event) => setStatus(event.target.value)}
          className="rounded border border-[var(--hive-border)] bg-white px-2 py-1.5">
          {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((value) => <option key={value}>{value}</option>)}
        </select>
      </td>
      <td className="px-3 py-3"><button type="button" disabled={disabled || (status === entry.status && response === (entry.response || ''))}
        onClick={() => onSave(status, response)} className="rounded-md bg-[#008100] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
        Save
      </button></td>
    </tr>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return <><dt className="font-medium text-gray-500">{label}</dt><dd className="break-words text-[#17191c]">{value || '—'}</dd></>;
}
