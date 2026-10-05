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
  const { navigate } = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/login?redirect=%2Fadmin', { replace: true });
    } else if (!user?.isAdmin) {
      navigate('/', { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  if (isLoading || !isAuthenticated || !user?.isAdmin) return <FullPageLoader />;
  return <>{children}</>;
}
