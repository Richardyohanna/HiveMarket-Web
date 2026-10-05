import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/router';
import { FullPageLoader } from './ui';

/**
 * Client-side gates are UX convenience only. Every endpoint these pages call
 * (account-deletion/*, admin/*) is independently authorized by the backend,
 * which is the only real security boundary.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { navigate, pathname } = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(pathname)}`, { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate, pathname]);

  if (isLoading) return <FullPageLoader />;
  if (!isAuthenticated) return <FullPageLoader label="Redirecting to sign in…" />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { navigate, pathname } = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(pathname)}`, { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate, pathname]);

  if (isLoading || !isAuthenticated) return <FullPageLoader />;
  if (!user?.isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--hive-background)] px-4">
        <section className="max-w-md rounded-2xl border border-[var(--hive-border)] bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#17191c]">Admin access required</h1>
          <p className="mt-2 text-sm text-[#4b5158]">
            This account does not have HiveMarket administrator access.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-5 rounded-lg bg-[#008100] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#006d24]"
          >
            Return to HiveMarket
          </button>
        </section>
      </main>
    );
  }
  return <>{children}</>;
}
