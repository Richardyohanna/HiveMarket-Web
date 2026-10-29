import { useEffect, useState } from 'react';
import {
  getShopRequests,
  updateShopRequestItemAvailability,
  updateShopRequestStatus,
  type ShopRequest,
  type ShopRequestStatus,
} from '../api/shopOwnerApi';

const cardClass = 'rounded-xl border border-[var(--hive-border)] bg-white p-4 sm:p-5';
const actionClass = 'rounded-lg border border-[var(--hive-border)] px-3 py-2 text-sm font-semibold text-[#17191c] hover:bg-gray-50 disabled:opacity-50';

function displayStatus(status: ShopRequestStatus) {
  return status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ShopOwnerRequestsSection({ shopId }: { shopId: string }) {
  const [requests, setRequests] = useState<ShopRequest[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [declineRequestId, setDeclineRequestId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadRequests() {
      try {
        const result = await getShopRequests(shopId);
        if (!cancelled) setRequests(result);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load shopping requests.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadRequests();
    return () => { cancelled = true; };
  }, [shopId]);

  async function runAction(request: ShopRequest, status: 'ACCEPTED' | 'DECLINED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'COMPLETED', reason?: string) {
    if (status === 'DECLINED' && !reason?.trim()) return;
    setBusyId(request.id);
    setError(null);
    try {
      const updated = await updateShopRequestStatus(request.id, status, reason?.trim());
      setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
      setDeclineRequestId(null);
      setDeclineReason('');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update this request.');
    } finally {
      setBusyId(null);
    }
  }

  async function updateAvailability(requestId: string, productId: string, availability: ShopRequest['items'][number]['availability']) {
    setBusyId(requestId);
    setError(null);
    try {
      const updated = await updateShopRequestItemAvailability(requestId, productId, availability);
      setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update item availability.');
    } finally {
      setBusyId(null);
    }
  }

  const filteredRequests = requests.filter((request) => filter === 'ALL' || request.status === filter);

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">{requests.length} requests for this shop</p>
        <label className="text-sm font-medium text-gray-700">
          Filter
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="ml-2 rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2">
            <option value="ALL">All statuses</option>
            {['PENDING', 'PENDING_SHOP', 'ACCEPTED', 'PREPARING', 'READY', 'READY_FOR_PICKUP', 'COMPLETED', 'DECLINED', 'CANCELLED'].map((status) => (
              <option key={status} value={status}>{displayStatus(status as ShopRequestStatus)}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? <p className={cardClass}>Loading shopping requests…</p> : filteredRequests.length === 0 ? (
        <p className={cardClass}>No shopping requests match this filter.</p>
      ) : filteredRequests.map((request) => (
        <article key={request.id} className={cardClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {request.customerProfilePicture
                ? <img src={request.customerProfilePicture} alt="" className="h-10 w-10 rounded-full object-cover" />
                : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-sm font-bold text-[#008100]">{request.customerName?.slice(0, 1) || 'C'}</div>}
              <div>
                <h3 className="font-semibold text-[#17191c]">{request.customerName || 'Customer'}</h3>
                <p className="text-xs text-gray-500">{new Date(request.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{displayStatus(request.status)}</span>
          </div>

          <ul className="mt-4 divide-y divide-gray-100">
            {request.items.map((item) => (
              <li key={item.productId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0 flex-1 text-[#17191c]">{item.productName} × {item.quantity} <span className="text-gray-500">({new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(item.price)})</span></span>
                <label className="text-xs text-gray-600">
                  Availability
                  <select
                    disabled={busyId === request.id || request.status === 'COMPLETED' || request.status === 'DECLINED' || request.status === 'CANCELLED'}
                    value={item.availability}
                    onChange={(event) => void updateAvailability(request.id, item.productId, event.target.value as ShopRequest['items'][number]['availability'])}
                    className="ml-2 rounded-md border border-[var(--hive-border)] bg-white px-2 py-1"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="PARTIALLY_AVAILABLE">Partially available</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                  </select>
                </label>
              </li>
            ))}
          </ul>

          {request.declineReason && <p className="mt-2 text-sm text-red-700">Decline reason: {request.declineReason}</p>}
          {request.status === 'READY' || request.status === 'READY_FOR_PICKUP' ? (
            <p className="mt-3 text-sm text-gray-600">Shop confirmation is recorded; the customer must also confirm pickup for the request to complete.</p>
          ) : null}

          {declineRequestId === request.id && (
            <form onSubmit={(event) => { event.preventDefault(); void runAction(request, 'DECLINED', declineReason); }} className="mt-4 space-y-2 rounded-lg bg-red-50 p-3">
              <label className="block text-sm font-medium text-gray-700">
                Reason for declining
                <textarea required value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2 text-sm" />
              </label>
              <div className="flex gap-2">
                <button type="submit" disabled={busyId === request.id || !declineReason.trim()} className={actionClass}>{busyId === request.id ? 'Saving…' : 'Confirm decline'}</button>
                <button type="button" disabled={busyId === request.id} onClick={() => { setDeclineRequestId(null); setDeclineReason(''); }} className={actionClass}>Cancel</button>
              </div>
            </form>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {request.status === 'PENDING' || request.status === 'PENDING_SHOP' ? (
              <>
                <button type="button" disabled={busyId === request.id} onClick={() => void runAction(request, 'ACCEPTED')} className={actionClass}>Accept request</button>
                <button type="button" disabled={busyId === request.id} onClick={() => { setDeclineRequestId(request.id); setDeclineReason(''); }} className={actionClass}>Decline</button>
              </>
            ) : null}
            {request.status === 'ACCEPTED' && <button type="button" disabled={busyId === request.id} onClick={() => void runAction(request, 'PREPARING')} className={actionClass}>Start preparing</button>}
            {request.status === 'PREPARING' && <button type="button" disabled={busyId === request.id} onClick={() => void runAction(request, 'READY_FOR_PICKUP')} className={actionClass}>Mark ready for pickup</button>}
            {(request.status === 'READY' || request.status === 'READY_FOR_PICKUP') && !request.shopConfirmed && <button type="button" disabled={busyId === request.id} onClick={() => void runAction(request, 'COMPLETED')} className={actionClass}>Confirm shop handoff</button>}
          </div>
        </article>
      ))}
    </div>
  );
}
