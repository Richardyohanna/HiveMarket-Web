import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  createAdminOutreachRecord,
  deleteAdminOutreachRecord,
  getAdminOutreachRecords,
  getAdminOutreachSummary,
  updateAdminOutreachRecord,
  type ShopOutreachRecord,
  type ShopOutreachStatus,
} from '../../api/adminApi';
import { ErrorBanner, PrimaryButton, SecondaryButton, SuccessBanner, TextInput } from '../../components/ui';

const statusOptions: ShopOutreachStatus[] = ['REGISTERED', 'REJECTED', 'POTENTIAL'];
const defaultForm = {
  shopName: '',
  location: '',
  category: '',
  visitedAt: new Date().toISOString().slice(0, 10),
  status: 'POTENTIAL' as ShopOutreachStatus,
  ownerName: '',
  phoneNumber: '',
  address: '',
  notes: '',
  rejectionReason: '',
  followUpDate: '',
  linkedShopId: '',
};

const fallbackRecords: ShopOutreachRecord[] = [
  {
    id: 'outreach-001',
    shopName: 'City Mart',
    location: 'Lagos',
    category: 'Groceries',
    visitedAt: '2026-10-10',
    status: 'REGISTERED',
    ownerName: 'Aisha Bello',
    phoneNumber: '+2348012345678',
    address: 'Sabo, Yaba',
    notes: 'Owner requested a walkthrough and completed registration the same day.',
    linkedShopId: 'shop-1024',
    createdAt: '2026-10-10T09:00:00Z',
    updatedAt: '2026-10-10T12:00:00Z',
  },
  {
    id: 'outreach-002',
    shopName: 'Pearl Beauty Hub',
    location: 'Abuja',
    category: 'Beauty',
    visitedAt: '2026-10-14',
    status: 'REJECTED',
    ownerName: 'Grace Okafor',
    phoneNumber: '+2348023456789',
    address: 'Maitama',
    notes: 'Prefers offline sales and does not want to manage online orders.',
    rejectionReason: 'Not interested in digital onboarding at this time.',
    createdAt: '2026-10-14T11:30:00Z',
    updatedAt: '2026-10-14T11:45:00Z',
  },
  {
    id: 'outreach-003',
    shopName: 'Green Leaf Supply',
    location: 'Port Harcourt',
    category: 'Food & Beverage',
    visitedAt: '2026-10-19',
    status: 'POTENTIAL',
    ownerName: 'Tunde Adebayo',
    phoneNumber: '+2348034567890',
    address: 'Trans Amadi',
    notes: 'Interested in listing products and needs a follow-up from the sales team.',
    followUpDate: '2026-10-29',
    createdAt: '2026-10-19T08:15:00Z',
    updatedAt: '2026-10-24T15:10:00Z',
  },
  {
    id: 'outreach-004',
    shopName: 'Noble Electronics',
    location: 'Kano',
    category: 'Electronics',
    visitedAt: '2026-10-23',
    status: 'REGISTERED',
    ownerName: 'Musa Idris',
    phoneNumber: '+2348045678901',
    address: 'Sabon Gari',
    notes: 'Using a shared WhatsApp catalogue; has now completed registration.',
    linkedShopId: 'shop-2048',
    createdAt: '2026-10-23T14:20:00Z',
    updatedAt: '2026-10-25T08:30:00Z',
  },
  {
    id: 'outreach-005',
    shopName: 'Prime Prints',
    location: 'Ibadan',
    category: 'Printing',
    visitedAt: '2026-10-27',
    status: 'POTENTIAL',
    ownerName: 'Kemi Lawal',
    phoneNumber: '+2348056789012',
    address: 'UI Road',
    notes: 'Awaiting approval from the finance manager.',
    followUpDate: '2026-11-04',
    createdAt: '2026-10-27T09:50:00Z',
    updatedAt: '2026-10-28T11:40:00Z',
  },
];

type OutreachFormState = {
  shopName: string;
  location: string;
  category: string;
  visitedAt: string;
  status: ShopOutreachStatus;
  ownerName: string;
  phoneNumber: string;
  address: string;
  notes: string;
  rejectionReason: string;
  followUpDate: string;
  linkedShopId: string;
};

function formatScore(value: number) {
  return Number.isFinite(value) ? `${value.toFixed(1)}%` : '0.0%';
}

function buildSummary(records: ShopOutreachRecord[], totalPlatformShops: number) {
  const totalApproached = records.length;
  const registered = records.filter((record) => record.status === 'REGISTERED').length;
  const rejected = records.filter((record) => record.status === 'REJECTED').length;
  const potential = records.filter((record) => record.status === 'POTENTIAL').length;
  const today = new Date();
  const followUpsDue = records.filter((record) => {
    if (record.status !== 'POTENTIAL' || !record.followUpDate) return false;
    const dueDate = new Date(record.followUpDate);
    return !Number.isNaN(dueDate.getTime()) && dueDate <= today;
  }).length;

  return {
    totalApproached,
    registeredThroughOutreach: registered,
    rejectedShops: rejected,
    potentialShops: potential,
    overallRegistrationConversionRate: totalApproached > 0 ? (registered / totalApproached) * 100 : 0,
    followUpsDue,
    totalPlatformShops,
  };
}

function toPayload(form: OutreachFormState) {
  return {
    shopName: form.shopName.trim(),
    location: form.location.trim(),
    category: form.category.trim(),
    visitedAt: form.visitedAt,
    status: form.status,
    ownerName: form.ownerName.trim() || null,
    phoneNumber: form.phoneNumber.trim() || null,
    address: form.address.trim() || null,
    notes: form.notes.trim() || null,
    rejectionReason: form.rejectionReason.trim() || null,
    followUpDate: form.followUpDate || null,
    linkedShopId: form.linkedShopId.trim() || null,
  };
}

export default function ShopOutreachSection({ totalPlatformShops }: { totalPlatformShops: number }) {
  const [records, setRecords] = useState<ShopOutreachRecord[]>([]);
  const [summary, setSummary] = useState(() => buildSummary(fallbackRecords, totalPlatformShops));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OutreachFormState>(defaultForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ShopOutreachRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  async function refreshOutreach() {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryPayload, recordPage] = await Promise.all([
        getAdminOutreachSummary().catch(() => buildSummary(fallbackRecords, totalPlatformShops)),
        getAdminOutreachRecords({ page: 0, size: 100 }).catch(() => ({
          content: fallbackRecords,
          totalElements: fallbackRecords.length,
          totalPages: 1,
          page: 0,
          size: 100,
        })),
      ]);

      const nextRecords = recordPage.content ?? [];
      setRecords(nextRecords);
      setSummary({ ...buildSummary(nextRecords, totalPlatformShops), ...summaryPayload });
    } catch {
      const nextRecords = fallbackRecords;
      setRecords(nextRecords);
      setSummary(buildSummary(nextRecords, totalPlatformShops));
      setError('The backend outreach endpoint is not available yet. The dashboard is using the built-in fallback dataset until the server-side API is deployed.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshOutreach();
  }, [totalPlatformShops]);

  const locationOptions = useMemo(() => {
    const values = new Set(records.map((record) => record.location).filter(Boolean));
    return Array.from(values).sort();
  }, [records]);

  const categoryOptions = useMemo(() => {
    const values = new Set(records.map((record) => record.category).filter(Boolean));
    return Array.from(values).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch = !normalizedSearch || record.shopName.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
      const matchesLocation = locationFilter === 'ALL' || record.location === locationFilter;
      const matchesCategory = categoryFilter === 'ALL' || record.category === categoryFilter;
      const matchesStartDate = !startDate || record.visitedAt >= startDate;
      const matchesEndDate = !endDate || record.visitedAt <= endDate;
      return matchesSearch && matchesStatus && matchesLocation && matchesCategory && matchesStartDate && matchesEndDate;
    });
  }, [records, search, statusFilter, locationFilter, categoryFilter, startDate, endDate]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const [page, setPage] = useState(1);
  const paginatedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, locationFilter, categoryFilter, startDate, endDate]);

  function resetForm() {
    setForm({ ...defaultForm, visitedAt: new Date().toISOString().slice(0, 10) });
    setEditingId(null);
  }

  function openNewRecord() {
    resetForm();
    setModalOpen(true);
    setSelectedRecord(null);
  }

  function openEditRecord(record: ShopOutreachRecord) {
    setEditingId(record.id);
    setSelectedRecord(record);
    setForm({
      shopName: record.shopName,
      location: record.location,
      category: record.category,
      visitedAt: record.visitedAt,
      status: record.status,
      ownerName: record.ownerName ?? '',
      phoneNumber: record.phoneNumber ?? '',
      address: record.address ?? '',
      notes: record.notes ?? '',
      rejectionReason: record.rejectionReason ?? '',
      followUpDate: record.followUpDate ?? '',
      linkedShopId: record.linkedShopId ?? '',
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedRecord(null);
    setEditingId(null);
    resetForm();
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.shopName.trim() || !form.location.trim() || !form.category.trim() || !form.visitedAt || !form.status) {
      setError('Shop name, location, category, visit date, and status are required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const payload = toPayload(form);
      if (editingId) {
        await updateAdminOutreachRecord(editingId, payload);
        setNotice('The outreach record was updated successfully.');
      } else {
        await createAdminOutreachRecord(payload);
        setNotice('The outreach visit was saved successfully.');
      }
      closeModal();
      await refreshOutreach();
    } catch {
      setError('The outreach record could not be saved. Check the backend contract and try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const target = records.find((record) => record.id === id);
    if (!target) return;
    const confirmed = window.confirm(`Delete outreach record for ${target.shopName}? This action cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(id);
    setError(null);
    try {
      await deleteAdminOutreachRecord(id);
      setNotice('The outreach record was removed successfully.');
      await refreshOutreach();
    } catch {
      setError('The outreach record could not be deleted.');
    } finally {
      setIsDeleting(null);
    }
  }

  const cards = [
    { label: 'Total Shops Approached', value: summary.totalApproached, caption: 'Visit records tracked' },
    { label: 'Registered Through Outreach', value: summary.registeredThroughOutreach, caption: 'Converted to HiveMarket shops' },
    { label: 'Rejected Shops', value: summary.rejectedShops, caption: 'Declined registration' },
    { label: 'Potential Shops', value: summary.potentialShops, caption: 'Interest without registration' },
    { label: 'Overall Registration Conversion Rate', value: formatScore(summary.overallRegistrationConversionRate), caption: 'Registered ÷ approached' },
    { label: 'Follow-ups Due', value: summary.followUpsDue, caption: 'Potential shops due for follow-up' },
    { label: 'Total Shops on HiveMarket Platform', value: summary.totalPlatformShops, caption: 'Live platform shop count' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#17191c]">Shop Outreach Tracker</h3>
          <p className="text-sm text-gray-500">Capture physical outreach visits and distinguish registered, rejected, and potential shops.</p>
        </div>
        <PrimaryButton type="button" className="w-auto px-4" onClick={openNewRecord}>+ Record Shop Visit</PrimaryButton>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-[var(--hive-border)] bg-white p-4">
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-[#17191c]">{isLoading && !records.length ? '—' : card.value}</p>
            <p className="mt-1 text-xs text-gray-500">{card.caption}</p>
          </div>
        ))}
      </section>

      <ErrorBanner message={error} />
      <SuccessBanner message={notice} />

      <div className="rounded-xl border border-[var(--hive-border)] bg-white p-4">
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:flex-wrap">
          <TextInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by shop name" className="max-w-sm" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2.5 text-sm text-[#17191c]">
            <option value="ALL">All statuses</option>
            {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} className="rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2.5 text-sm text-[#17191c]">
            <option value="ALL">All locations</option>
            {locationOptions.map((location) => <option key={location} value={location}>{location}</option>)}
          </select>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2.5 text-sm text-[#17191c]">
            <option value="ALL">All categories</option>
            {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2.5 text-sm text-[#17191c]" />
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2.5 text-sm text-[#17191c]" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--hive-border)] bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-3">Shop Name</th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Date Visited</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Follow-up</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-500">No outreach records match the current filters.</td>
                </tr>
              ) : (
                paginatedRecords.map((record) => (
                  <tr key={record.id} className="border-b border-[var(--hive-border)] align-top hover:bg-gray-50">
                    <td className="px-3 py-3 font-medium text-[#17191c]">{record.shopName}</td>
                    <td className="px-3 py-3 text-gray-600">{record.location}</td>
                    <td className="px-3 py-3 text-gray-600">{record.category}</td>
                    <td className="px-3 py-3 text-gray-600">{record.visitedAt}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${record.status === 'REGISTERED' ? 'bg-green-100 text-green-800' : record.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{record.followUpDate || '—'}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setSelectedRecord(record)} className="rounded border border-[var(--hive-border)] bg-white px-2 py-1 text-xs font-medium text-[#17191c] hover:bg-gray-50">View</button>
                        <button type="button" onClick={() => openEditRecord(record)} className="rounded border border-[var(--hive-border)] bg-white px-2 py-1 text-xs font-medium text-[#17191c] hover:bg-gray-50">Edit</button>
                        <button type="button" onClick={() => handleDelete(record.id)} disabled={isDeleting === record.id} className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60">{isDeleting === record.id ? 'Deleting...' : 'Delete'}</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredRecords.length > pageSize && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>{filteredRecords.length} records · Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <SecondaryButton type="button" className="w-auto px-3 py-1.5 text-sm" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</SecondaryButton>
              <SecondaryButton type="button" className="w-auto px-3 py-1.5 text-sm" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</SecondaryButton>
            </div>
          </div>
        )}
      </div>

      {selectedRecord && !modalOpen && (
        <div className="rounded-xl border border-[var(--hive-border)] bg-white p-4">
          <h4 className="text-base font-bold text-[#17191c]">Visit detail</h4>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div><dt className="text-xs uppercase tracking-wide text-gray-500">Shop</dt><dd className="mt-1 text-sm text-[#17191c]">{selectedRecord.shopName}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-gray-500">Location</dt><dd className="mt-1 text-sm text-[#17191c]">{selectedRecord.location}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-gray-500">Category</dt><dd className="mt-1 text-sm text-[#17191c]">{selectedRecord.category}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-gray-500">Status</dt><dd className="mt-1 text-sm text-[#17191c]">{selectedRecord.status}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-gray-500">Owner</dt><dd className="mt-1 text-sm text-[#17191c]">{selectedRecord.ownerName || '—'}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-gray-500">Phone</dt><dd className="mt-1 text-sm text-[#17191c]">{selectedRecord.phoneNumber || '—'}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-gray-500">Address</dt><dd className="mt-1 text-sm text-[#17191c]">{selectedRecord.address || '—'}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-gray-500">Follow-up</dt><dd className="mt-1 text-sm text-[#17191c]">{selectedRecord.followUpDate || '—'}</dd></div>
            {selectedRecord.rejectionReason && <div className="sm:col-span-2"><dt className="text-xs uppercase tracking-wide text-gray-500">Rejection reason</dt><dd className="mt-1 text-sm text-[#17191c]">{selectedRecord.rejectionReason}</dd></div>}
            {selectedRecord.notes && <div className="sm:col-span-2"><dt className="text-xs uppercase tracking-wide text-gray-500">Notes</dt><dd className="mt-1 text-sm text-[#17191c]">{selectedRecord.notes}</dd></div>}
          </dl>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--hive-border)] bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-lg font-bold text-[#17191c]">{editingId ? 'Edit outreach visit' : 'Record shop visit'}</h4>
                <p className="text-sm text-gray-500">This record is isolated from the existing shop-registration flow and does not create a live account.</p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-full border border-[var(--hive-border)] px-2 py-1 text-sm text-gray-500">Close</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#17191c]">Shop name</label>
                  <TextInput value={form.shopName} onChange={(event) => setForm({ ...form, shopName: event.target.value })} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#17191c]">Shop location</label>
                  <TextInput value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#17191c]">Shop category</label>
                  <TextInput value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#17191c]">Date visited</label>
                  <input type="date" value={form.visitedAt} onChange={(event) => setForm({ ...form, visitedAt: event.target.value })} className="w-full rounded-lg border border-[var(--hive-border)] px-3.5 py-2.5 text-[15px] text-[#17191c] outline-none transition focus:border-[#008100] focus:ring-2 focus:ring-[#008100]/15" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[#17191c]">Outreach status</label>
                  <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ShopOutreachStatus })} className="w-full rounded-lg border border-[var(--hive-border)] bg-white px-3.5 py-2.5 text-[15px] text-[#17191c] outline-none transition focus:border-[#008100] focus:ring-2 focus:ring-[#008100]/15">
                    {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#17191c]">Shop owner&apos;s name</label>
                  <TextInput value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#17191c]">Phone number</label>
                  <TextInput value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#17191c]">Specific address or landmark</label>
                  <TextInput value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#17191c]">Linked HiveMarket shop ID</label>
                  <TextInput value={form.linkedShopId} onChange={(event) => setForm({ ...form, linkedShopId: event.target.value })} placeholder="Optional existing shop ID" />
                </div>
                {form.status === 'REJECTED' && (
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-[#17191c]">Reason for rejection</label>
                    <TextInput value={form.rejectionReason} onChange={(event) => setForm({ ...form, rejectionReason: event.target.value })} />
                  </div>
                )}
                {form.status === 'POTENTIAL' && (
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-[#17191c]">Follow-up date</label>
                    <input type="date" value={form.followUpDate} onChange={(event) => setForm({ ...form, followUpDate: event.target.value })} className="w-full rounded-lg border border-[var(--hive-border)] px-3.5 py-2.5 text-[15px] text-[#17191c] outline-none transition focus:border-[#008100] focus:ring-2 focus:ring-[#008100]/15" />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[#17191c]">Notes</label>
                  <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="w-full rounded-lg border border-[var(--hive-border)] px-3.5 py-2.5 text-[15px] text-[#17191c] outline-none transition focus:border-[#008100] focus:ring-2 focus:ring-[#008100]/15" rows={4} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <SecondaryButton type="button" className="w-auto px-4" onClick={closeModal}>Cancel</SecondaryButton>
                <PrimaryButton type="submit" isLoading={isSaving} className="w-auto px-5">{editingId ? 'Save changes' : 'Save record'}</PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
