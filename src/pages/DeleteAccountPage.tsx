import { useEffect, useState } from 'react';
import {
  cancelAccountDeletion,
  cancelShopDeletion,
  getAccountDeletionStatus,
  getMyShops,
  getShopDeletionStatus,
  requestAccountDeletion,
  requestShopDeletion,
  type DeletionStatusResponse,
  type OwnedShopSummary,
} from '../api/accountDeletionApi';
import { ApiError } from '../lib/apiClient';
import {
  ErrorBanner,
  FieldLabel,
  FullPageLoader,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  SuccessBanner,
} from '../components/ui';

const ACCOUNT_REASONS = [
  ['NO_LONGER_NEED_HIVEMARKET', 'I no longer need HiveMarket'],
  ['CREATED_ACCOUNT_BY_MISTAKE', 'I created my account by mistake'],
  ['UNSATISFIED_WITH_SERVICE', 'I am not satisfied with the service'],
  ['PRIVACY_CONCERNS', 'I am concerned about privacy'],
  ['MOVING_TO_ANOTHER_PLATFORM', 'I am moving to another platform'],
  ['PROBLEM_WITH_HIVEMARKET', 'I had a problem with HiveMarket'],
  ['OTHER', 'Other'],
] as const;

const SHOP_REASONS = [
  ['NO_LONGER_OPERATE_SHOP', 'I no longer operate this shop'],
  ['CREATED_SHOP_BY_MISTAKE', 'I created the shop by mistake'],
  ['MOVING_BUSINESS_ELSEWHERE', 'I am moving my business elsewhere'],
  ['NO_LONGER_USE_HIVEMARKET_FOR_SHOP', 'I no longer want to use HiveMarket for this shop'],
  ['PROBLEM_WITH_HIVEMARKET', 'I had a problem with HiveMarket'],
  ['OTHER', 'Other'],
] as const;

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
}

function DeletionStatusPanel({
  title,
  status,
}: {
  title: string;
  status: DeletionStatusResponse;
}) {
  const scheduledDate = formatDate(status.scheduledDeletionDate);

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1">
        Status: {status.status?.replaceAll('_', ' ').toLowerCase() || 'Pending confirmation'}
      </p>
      {status.reason && (
        <p className="mt-1">
          Reason: {status.reason.replaceAll('_', ' ').toLowerCase()}
          {status.reasonDetails ? ` — ${status.reasonDetails}` : ''}
        </p>
      )}
      {scheduledDate ? (
        <>
          <p className="mt-1">Scheduled deletion: {scheduledDate}</p>
          <p className="mt-1">
            Your request has a 30-day grace period. The scheduled date above is supplied by HiveMarket.
          </p>
          {typeof status.daysRemaining === 'number' && (
            <p className="mt-1">{status.daysRemaining} day(s) remain to cancel.</p>
          )}
        </>
      ) : (
        <p className="mt-1">
          Check your registered email and confirm the request to begin the 30-day grace period.
        </p>
      )}
    </div>
  );
}

export default function DeleteAccountPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState<DeletionStatusResponse | null>(null);
  const [shops, setShops] = useState<OwnedShopSummary[]>([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [shopStatus, setShopStatus] = useState<{ shopId: string; status: DeletionStatusResponse } | null>(null);
  const [accountReason, setAccountReason] = useState('');
  const [accountReasonDetails, setAccountReasonDetails] = useState('');
  const [shopReason, setShopReason] = useState('');
  const [shopReasonDetails, setShopReasonDetails] = useState('');
  const [reviewAccountRequest, setReviewAccountRequest] = useState(false);
  const [reviewShopRequest, setReviewShopRequest] = useState(false);
  const [busyAction, setBusyAction] = useState<'account-request' | 'account-cancel' | 'shop-request' | 'shop-cancel' | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [shopError, setShopError] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [shopMessage, setShopMessage] = useState<string | null>(null);
  const [shopLoadError, setShopLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [accountResult, shopsResult] = await Promise.allSettled([
          getAccountDeletionStatus(),
          getMyShops(),
        ]);
        if (cancelled) return;

        if (accountResult.status === 'fulfilled') {
          setAccountStatus(accountResult.value);
        } else {
          setAccountError(
            accountResult.reason instanceof ApiError
              ? accountResult.reason.message
              : 'Could not load account deletion status.',
          );
        }

        if (shopsResult.status === 'fulfilled') {
          setShops(shopsResult.value);
          const firstShop = shopsResult.value[0];
          if (firstShop) {
            setSelectedShopId(firstShop.id);
            try {
              const result = await getShopDeletionStatus(firstShop.id);
              if (!cancelled) setShopStatus({ shopId: firstShop.id, status: result });
            } catch (error) {
              if (!cancelled) {
                setShopError(
                  error instanceof ApiError ? error.message : 'Could not load shop deletion status.',
                );
              }
            }
          }
        } else {
          setShopLoadError(
            shopsResult.reason instanceof ApiError
              ? shopsResult.reason.message
              : 'Could not load your shops.',
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function selectShop(shopId: string) {
    setSelectedShopId(shopId);
    setShopStatus(null);
    setShopError(null);
    setShopMessage(null);
    setShopReason('');
    setShopReasonDetails('');
    setReviewShopRequest(false);
    if (!shopId) return;
    try {
      const result = await getShopDeletionStatus(shopId);
      setShopStatus({ shopId, status: result });
    } catch (error) {
      setShopError(
        error instanceof ApiError
          ? error.status === 403 || error.status === 404
            ? 'You are not authorized to manage deletion for this shop.'
            : error.message
          : 'Could not load shop deletion status.',
      );
    }
  }

  function validateReason(reason: string, details: string, kind: string): string | null {
    if (!reason) return `Select a reason for ${kind}.`;
    if (reason === 'OTHER' && !details.trim()) return 'Please explain your reason.';
    if (details.length > 1000) return 'The explanation must be 1,000 characters or fewer.';
    return null;
  }

  async function refreshAccountStatus() {
    setAccountStatus(await getAccountDeletionStatus());
  }

  async function refreshShopStatus(shopId: string) {
    const result = await getShopDeletionStatus(shopId);
    setShopStatus({ shopId, status: result });
  }

  async function submitAccountRequest() {
    const validationError = validateReason(accountReason, accountReasonDetails, 'deleting your account');
    if (validationError) {
      setAccountError(validationError);
      return;
    }
    setBusyAction('account-request');
    setAccountError(null);
    setAccountMessage(null);
    try {
      const result = await requestAccountDeletion(accountReason, accountReasonDetails.trim());
      setAccountMessage(result.message);
      setReviewAccountRequest(false);
      try {
        await refreshAccountStatus();
      } catch {
        setAccountError('Your request was submitted, but its status could not be refreshed. Reload this page to check it.');
      }
    } catch (error) {
      setAccountError(error instanceof ApiError ? error.message : 'Could not request account deletion.');
    } finally {
      setBusyAction(null);
    }
  }

  async function cancelAccountRequest() {
    setBusyAction('account-cancel');
    setAccountError(null);
    setAccountMessage(null);
    try {
      const result = await cancelAccountDeletion();
      setAccountMessage(result.message);
      try {
        await refreshAccountStatus();
      } catch {
        setAccountError('Your cancellation was submitted, but its status could not be refreshed. Reload this page to check it.');
      }
    } catch (error) {
      setAccountError(error instanceof ApiError ? error.message : 'Could not cancel account deletion.');
    } finally {
      setBusyAction(null);
    }
  }

  async function submitShopRequest() {
    const selectedShop = shops.find((shop) => shop.id === selectedShopId);
    if (!selectedShop) {
      setShopError('Select one of your shops.');
      return;
    }
    const validationError = validateReason(shopReason, shopReasonDetails, 'deleting this shop');
    if (validationError) {
      setShopError(validationError);
      return;
    }
    setBusyAction('shop-request');
    setShopError(null);
    setShopMessage(null);
    try {
      const result = await requestShopDeletion(selectedShop.id, shopReason, shopReasonDetails.trim());
      setShopMessage(result.message);
      setReviewShopRequest(false);
      try {
        await refreshShopStatus(selectedShop.id);
      } catch {
        setShopError('Your request was submitted, but its status could not be refreshed. Reload this page to check it.');
      }
    } catch (error) {
      setShopError(
        error instanceof ApiError
          ? error.status === 403 || error.status === 404
            ? 'You are not authorized to manage deletion for this shop.'
            : error.message
          : 'Could not request shop deletion.',
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function cancelShopRequest() {
    const selectedShop = shops.find((shop) => shop.id === selectedShopId);
    if (!selectedShop) return;
    setBusyAction('shop-cancel');
    setShopError(null);
    setShopMessage(null);
    try {
      const result = await cancelShopDeletion(selectedShop.id);
      setShopMessage(result.message);
      try {
        await refreshShopStatus(selectedShop.id);
      } catch {
        setShopError('Your cancellation was submitted, but its status could not be refreshed. Reload this page to check it.');
      }
    } catch (error) {
      setShopError(
        error instanceof ApiError
          ? error.status === 403 || error.status === 404
            ? 'You are not authorized to manage deletion for this shop.'
            : error.message
          : 'Could not cancel shop deletion.',
      );
    } finally {
      setBusyAction(null);
    }
  }

  if (isLoading) return <FullPageLoader />;

  const activeAccountRequest = accountStatus?.hasPendingRequest ?? false;
  const currentShop = shops.find((shop) => shop.id === selectedShopId) ?? null;
  const currentShopStatus = shopStatus?.shopId === selectedShopId ? shopStatus.status : null;

  return (
    <PageShell
      title="Manage deletion"
      subtitle="Shop deletion and account deletion are separate actions. Choose carefully."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-8">
        <section className="space-y-4 border-b border-[var(--hive-border)] pb-8">
          <div>
            <h2 className="text-lg font-bold text-[#17191c]">Delete a Shop</h2>
            <p className="mt-1 text-sm text-[#4b5158]">
              This deletes only the selected shop. Your HiveMarket account remains active.
            </p>
          </div>
          <ErrorBanner message={shopLoadError} />
          <ErrorBanner message={shopError} />
          <SuccessBanner message={shopMessage} />
          {shops.length > 0 ? (
            <>
              <div>
                <FieldLabel>Select one of your shops</FieldLabel>
                <select
                  value={selectedShopId}
                  onChange={(event) => void selectShop(event.target.value)}
                  disabled={busyAction !== null}
                  className="w-full rounded-lg border border-[var(--hive-border)] bg-white px-3.5 py-2.5 text-[15px]"
                >
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                  ))}
                </select>
              </div>

              {currentShopStatus?.hasPendingRequest ? (
                <div className="space-y-3">
                  <DeletionStatusPanel title={currentShop?.name ?? 'Shop deletion'} status={currentShopStatus} />
                  {currentShopStatus.canCancel && (
                    <SecondaryButton
                      type="button"
                      onClick={() => void cancelShopRequest()}
                      disabled={busyAction !== null}
                    >
                      {busyAction === 'shop-cancel' ? 'Cancelling…' : 'Cancel Shop Deletion'}
                    </SecondaryButton>
                  )}
                </div>
              ) : reviewShopRequest ? (
                <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <h3 className="font-semibold text-red-900">Confirm Shop Deletion Request</h3>
                  <p className="text-sm text-red-900"><strong>Shop:</strong> {currentShop?.name}</p>
                  <p className="text-sm text-red-900">
                    <strong>Reason:</strong>{' '}
                    {SHOP_REASONS.find(([value]) => value === shopReason)?.[1]}
                    {shopReason === 'OTHER' ? ` — ${shopReasonDetails.trim()}` : ''}
                  </p>
                  <p className="text-sm text-red-900">
                    This request affects only this shop, not your HiveMarket account. Confirm by email to
                    start the 30-day grace period. The backend will provide the scheduled deletion date.
                  </p>
                  <div className="flex gap-3">
                    <SecondaryButton type="button" onClick={() => setReviewShopRequest(false)} disabled={busyAction !== null}>
                      Go back
                    </SecondaryButton>
                    <PrimaryButton
                      type="button"
                      onClick={() => void submitShopRequest()}
                      isLoading={busyAction === 'shop-request'}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Request Shop Deletion
                    </PrimaryButton>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <FieldLabel>Why are you deleting this shop?</FieldLabel>
                    <select
                      value={shopReason}
                      onChange={(event) => setShopReason(event.target.value)}
                      className="w-full rounded-lg border border-[var(--hive-border)] bg-white px-3.5 py-2.5 text-[15px]"
                    >
                      <option value="">Select a reason</option>
                      {SHOP_REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </div>
                  {shopReason === 'OTHER' && (
                    <div>
                      <FieldLabel>Please explain</FieldLabel>
                      <textarea
                        value={shopReasonDetails}
                        onChange={(event) => setShopReasonDetails(event.target.value)}
                        maxLength={1000}
                        rows={3}
                        className="w-full rounded-lg border border-[var(--hive-border)] px-3.5 py-2.5 text-[15px]"
                      />
                    </div>
                  )}
                  <PrimaryButton
                    type="button"
                    onClick={() => {
                      const validationError = validateReason(shopReason, shopReasonDetails, 'deleting this shop');
                      if (!selectedShopId) setShopError('Select one of your shops.');
                      else if (validationError) setShopError(validationError);
                      else {
                        setShopError(null);
                        setReviewShopRequest(true);
                      }
                    }}
                  >
                    Continue
                  </PrimaryButton>
                </>
              )}
            </>
          ) : (
            <p className="rounded-lg bg-[var(--hive-background)] p-4 text-sm text-[#4b5158]">
              {shopLoadError ? 'Your shops could not be loaded.' : 'No shops are associated with your account.'}
            </p>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#17191c]">Delete My HiveMarket Account</h2>
            <p className="mt-1 text-sm text-[#4b5158]">
              This deletes your entire HiveMarket account and associated account data according to HiveMarket&apos;s
              deletion policy. It is different from deleting one shop.
            </p>
          </div>
          <ErrorBanner message={accountError} />
          <SuccessBanner message={accountMessage} />

          {activeAccountRequest && accountStatus ? (
            <div className="space-y-3">
              <DeletionStatusPanel title="Account deletion status" status={accountStatus} />
              {accountStatus.canCancel && (
                <SecondaryButton
                  type="button"
                  onClick={() => void cancelAccountRequest()}
                  disabled={busyAction !== null}
                >
                  {busyAction === 'account-cancel' ? 'Cancelling…' : 'Cancel Account Deletion'}
                </SecondaryButton>
              )}
            </div>
          ) : reviewAccountRequest ? (
            <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="font-semibold text-red-900">Confirm Account Deletion Request</h3>
              <p className="text-sm text-red-900">
                <strong>Reason:</strong>{' '}
                {ACCOUNT_REASONS.find(([value]) => value === accountReason)?.[1]}
                {accountReason === 'OTHER' ? ` — ${accountReasonDetails.trim()}` : ''}
              </p>
              <p className="text-sm text-red-900">
                This request is for your entire account. Confirm by email to start the 30-day grace period.
                The backend will provide the scheduled deletion date.
              </p>
              <div className="flex gap-3">
                <SecondaryButton type="button" onClick={() => setReviewAccountRequest(false)} disabled={busyAction !== null}>
                  Go back
                </SecondaryButton>
                <PrimaryButton
                  type="button"
                  onClick={() => void submitAccountRequest()}
                  isLoading={busyAction === 'account-request'}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Request Account Deletion
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <>
              <div>
                <FieldLabel>Why are you deleting your HiveMarket account?</FieldLabel>
                <select
                  value={accountReason}
                  onChange={(event) => setAccountReason(event.target.value)}
                  className="w-full rounded-lg border border-[var(--hive-border)] bg-white px-3.5 py-2.5 text-[15px]"
                >
                  <option value="">Select a reason</option>
                  {ACCOUNT_REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              {accountReason === 'OTHER' && (
                <div>
                  <FieldLabel>Please explain</FieldLabel>
                  <textarea
                    value={accountReasonDetails}
                    onChange={(event) => setAccountReasonDetails(event.target.value)}
                    maxLength={1000}
                    rows={3}
                    className="w-full rounded-lg border border-[var(--hive-border)] px-3.5 py-2.5 text-[15px]"
                  />
                </div>
              )}
              <p className="text-sm text-red-700">
                Account deletion applies to your account, not just a selected shop.
              </p>
              <PrimaryButton
                type="button"
                onClick={() => {
                  const validationError = validateReason(accountReason, accountReasonDetails, 'deleting your account');
                  if (validationError) setAccountError(validationError);
                  else {
                    setAccountError(null);
                    setReviewAccountRequest(true);
                  }
                }}
                disabled={activeAccountRequest || busyAction !== null}
                className="bg-red-600 hover:bg-red-700"
              >
                Review Account Deletion
              </PrimaryButton>
            </>
          )}
        </section>
      </div>
    </PageShell>
  );
}
