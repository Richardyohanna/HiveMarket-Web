import { useEffect, useState } from 'react';
import {
  confirmAccountDeletion,
  confirmShopDeletion,
  type DeletionActionResponse,
} from '../api/accountDeletionApi';
import { ApiError } from '../lib/apiClient';
import { ErrorBanner, FullPageLoader, PageShell, SuccessBanner } from '../components/ui';

export default function DeleteAccountConfirmPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DeletionActionResponse | null>(null);
  const isShopDeletion = window.location.pathname.startsWith('/shop-deletion/');

  useEffect(() => {
    async function run() {
      await Promise.resolve();
      const token = new URLSearchParams(window.location.search).get('token');
      if (!token) {
        setError('This confirmation link is missing its token. Please use the link from your email.');
        setIsLoading(false);
        return;
      }
      try {
        const confirmation = isShopDeletion
          ? await confirmShopDeletion(token)
          : await confirmAccountDeletion(token);
        setResult(confirmation);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : 'This confirmation link is invalid or has expired.',
        );
      } finally {
        setIsLoading(false);
      }
    }
    void run();
  }, [isShopDeletion]);

  if (isLoading) return <FullPageLoader label="Confirming deletion…" />;

  return (
    <PageShell title={`${isShopDeletion ? 'Shop' : 'Account'} deletion confirmation`}>
      <ErrorBanner message={error} />
      <SuccessBanner message={result?.message || null} />
      {!error && (
        <p className="text-sm text-[#4b5158]">
          Your {isShopDeletion ? 'shop' : 'account'} deletion request is confirmed.
          {' The 30-day grace period is active.'}
          {result?.scheduledDeletionDate
            ? ` HiveMarket scheduled deletion for ${new Date(result.scheduledDeletionDate).toLocaleString()}.`
            : ''}
          {' You can manage or cancel the request by signing in.'}
        </p>
      )}
    </PageShell>
  );
}
