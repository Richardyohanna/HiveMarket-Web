import { useState } from 'react';
import { searchShops, searchUsers, type AdminShopSummary, type AdminUserSummary } from '../../api/adminApi';
import { ApiError } from '../../lib/apiClient';
import { useAuth } from '../../lib/AuthContext';
import { useRouter } from '../../lib/router';
import { ErrorBanner, SecondaryButton, TextInput } from '../../components/ui';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<'users' | 'shops'>('shops');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [shops, setShops] = useState<AdminShopSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch() {
    setIsLoading(true);
    setError(null);
    try {
      if (tab === 'users') setUsers(await searchUsers(query));
      else setShops(await searchShops(query));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--hive-background)]">
      <header className="border-b border-[var(--hive-border)] bg-white px-5 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#008100]">HiveMarket Admin</p>
            <h1 className="text-lg font-bold text-[#17191c]">{user?.fullName}</h1>
          </div>
          <div className="flex gap-2">
            <SecondaryButton type="button" className="w-auto px-4" onClick={() => navigate('/')}>
              Site
            </SecondaryButton>
            <SecondaryButton
              type="button"
              className="w-auto px-4"
              onClick={() => {
                logout();
                navigate('/', { replace: true });
              }}
            >
              Sign out
            </SecondaryButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-[#17191c]">Register a new shop owner in person</h2>
          <button
            type="button"
            onClick={() => navigate('/admin/register-shop')}
            className="rounded-lg bg-[#008100] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#006d24]"
          >
            + Register shop
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--hive-border)] bg-white p-5">
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setTab('shops')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === 'shops' ? 'bg-[#e8f5e9] text-[#008100]' : 'text-gray-500'}`}
            >
              Shops
            </button>
            <button
              type="button"
              onClick={() => setTab('users')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === 'users' ? 'bg-[#e8f5e9] text-[#008100]' : 'text-gray-500'}`}
            >
              Users
            </button>
          </div>

          <div className="mb-4 flex gap-2">
            <TextInput
              placeholder={`Search ${tab} by name or email`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
            <SecondaryButton type="button" className="w-auto px-4" onClick={runSearch} disabled={isLoading}>
              Search
            </SecondaryButton>
          </div>

          <ErrorBanner message={error} />

          {tab === 'shops' ? (
            <div className="divide-y divide-[var(--hive-border)]">
              {shops.map((shop) => (
                <div key={shop.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-semibold text-[#17191c]">{shop.name}</p>
                    <p className="text-gray-500">{shop.ownerName} · {shop.ownerEmail}</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                    {shop.status}
                  </span>
                </div>
              ))}
              {!shops.length && !isLoading && <p className="py-6 text-center text-sm text-gray-400">No shops yet. Try searching.</p>}
            </div>
          ) : (
            <div className="divide-y divide-[var(--hive-border)]">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-semibold text-[#17191c]">{u.fullName}</p>
                    <p className="text-gray-500">{u.email} · {u.phone}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {u.isAdmin && <span className="rounded-full bg-[#e8f5e9] px-2.5 py-1 text-xs font-semibold text-[#008100]">Admin</span>}
                    {u.hasShop && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">Has shop</span>}
                  </div>
                </div>
              ))}
              {!users.length && !isLoading && <p className="py-6 text-center text-sm text-gray-400">No users yet. Try searching.</p>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
