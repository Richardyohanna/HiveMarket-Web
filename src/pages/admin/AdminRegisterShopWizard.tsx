import { useMemo, useState } from 'react';
import {
  createProduct,
  createShop,
  createShopService,
  createUser,
  searchUsers,
  uploadProductImages,
  type AdminUserSummary,
} from '../../api/adminApi';
import { ApiError } from '../../lib/apiClient';
import { useRouter } from '../../lib/router';
import {
  ErrorBanner,
  FieldLabel,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  SuccessBanner,
  TextInput,
} from '../../components/ui';

type DraftProduct = {
  localId: string;
  pName: string;
  pDetail: string;
  pAmount: string;
  pDiscount: string;
  pCondition: 'NEW' | 'USED';
  pQuantity: string;
  category: string;
  images: File[];
};

type ProductOutcome = {
  localId: string;
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
};

type DraftService = {
  localId: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  availability: string;
};

const STEPS = ['Owner', 'Shop details', 'Catalog', 'Review'] as const;

function emptyService(): DraftService {
  return { localId: crypto.randomUUID(), name: '', description: '', price: '', duration: '', availability: '' };
}

function emptyProduct(): DraftProduct {
  return {
    localId: crypto.randomUUID(),
    pName: '',
    pDetail: '',
    pAmount: '',
    pDiscount: '',
    pCondition: 'NEW',
    pQuantity: '1',
    category: '',
    images: [],
  };
}

export default function AdminRegisterShopWizard() {
  const { navigate } = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Step 1: owner
  const [ownerMode, setOwnerMode] = useState<'new' | 'existing'>('new');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [existingQuery, setExistingQuery] = useState('');
  const [existingResults, setExistingResults] = useState<AdminUserSummary[]>([]);
  const [selectedExistingUser, setSelectedExistingUser] = useState<AdminUserSummary | null>(null);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Step 2: shop
  const [shopName, setShopName] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopType, setShopType] = useState('');
  const [categoriesInput, setCategoriesInput] = useState('');
  const [slogan, setSlogan] = useState('');
  const [website, setWebsite] = useState('');
  const [university, setUniversity] = useState('');
  const [areaName, setAreaName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [operatingMode, setOperatingMode] = useState<'FIXED' | 'FLEXIBLE'>('FIXED');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [shopImage, setShopImage] = useState<File | null>(null);
  const [shopBanner, setShopBanner] = useState<File | null>(null);

  // Step 3: products
  const [products, setProducts] = useState<DraftProduct[]>([]);
  const [services, setServices] = useState<DraftService[]>([]);
  const [serviceOutcomes, setServiceOutcomes] = useState<ProductOutcome[]>([]);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [createdShopId, setCreatedShopId] = useState<string | null>(null);
  const [createdShopName, setCreatedShopName] = useState<string | null>(null);
  const [productOutcomes, setProductOutcomes] = useState<ProductOutcome[]>([]);
  const [isDone, setIsDone] = useState(false);

  const categories = useMemo(
    () => categoriesInput.split(',').map((c) => c.trim()).filter(Boolean),
    [categoriesInput],
  );

  function to24hTimeToAmPm(time: string): string {
    if (!time) return '';
    const [hoursStr, minutesStr] = time.split(':');
    let hours = parseInt(hoursStr, 10);
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutesStr} ${period}`;
  }

  async function handleSearchExisting() {
    setIsSearchingUsers(true);
    setError(null);
    try {
      const results = await searchUsers(existingQuery);
      setExistingResults(results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not search users.');
    } finally {
      setIsSearchingUsers(false);
    }
  }

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (ownerMode === 'new') {
        if (!ownerFullName.trim() || !ownerEmail.trim() || !ownerPassword.trim()) {
          return 'Please fill in the owner\'s full name, email, and an initial password.';
        }
        if (ownerPassword.length < 8) return 'Password must be at least 8 characters.';
      } else if (!selectedExistingUser) {
        return 'Please search for and select an existing owner.';
      }
    }
    if (current === 1) {
      if (!shopName.trim() || !shopPhone.trim() || !shopType.trim()) {
        return 'Please fill in shop name, phone, and shop type.';
      }
      if (!address.trim() || !latitude.trim() || !longitude.trim()) {
        return 'Please provide the shop address and coordinates.';
      }
      if (Number.isNaN(Number(latitude)) || Number.isNaN(Number(longitude))) {
        return 'Latitude and longitude must be numbers.';
      }
    }
    if (current === 2) {
      for (const product of products) {
        if (!product.pName.trim() || !product.pDetail.trim() || !product.pAmount.trim() || !product.category.trim()) {
          return 'Every product needs a name, description, price, and category (or remove it).';
        }
      }
      for (const service of services) {
        if (!service.name.trim() || !service.description.trim() || !service.price.trim() || Number(service.price) <= 0) {
          return 'Every service needs a name, description, and a price above 0 (or remove it).';
        }
      }
    }
    return null;
  }

  function goNext() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function updateProduct(localId: string, patch: Partial<DraftProduct>) {
    setProducts((list) => list.map((p) => (p.localId === localId ? { ...p, ...patch } : p)));
  }

  function removeProduct(localId: string) {
    setProducts((list) => list.filter((p) => p.localId !== localId));
  }

  async function retryProduct(outcome: ProductOutcome) {
    const draft = products.find((p) => p.localId === outcome.localId);
    if (!draft || !createdShopId) return;
    setProductOutcomes((list) =>
      list.map((o) => (o.localId === outcome.localId ? { ...o, status: 'pending', message: undefined } : o)),
    );
    await submitSingleProduct(draft, createdShopId);
  }

  function updateService(localId: string, patch: Partial<DraftService>) {
    setServices((list) => list.map((s) => (s.localId === localId ? { ...s, ...patch } : s)));
  }

  async function submitSingleService(draft: DraftService, shopId: string) {
    try {
      await createShopService(shopId, {
        name: draft.name.trim(),
        description: draft.description.trim(),
        price: Number(draft.price),
        duration: draft.duration.trim() || undefined,
        availability: draft.availability.trim() || undefined,
      });
      setServiceOutcomes((list) =>
        list.map((o) => (o.localId === draft.localId ? { ...o, status: 'success', message: undefined } : o)),
      );
    } catch (err) {
      setServiceOutcomes((list) =>
        list.map((o) =>
          o.localId === draft.localId
            ? { ...o, status: 'error', message: err instanceof ApiError ? err.message : 'Failed to create service.' }
            : o,
        ),
      );
    }
  }

  async function retryService(outcome: ProductOutcome) {
    const draft = services.find((s) => s.localId === outcome.localId);
    if (!draft || !createdShopId) return;
    setServiceOutcomes((list) =>
      list.map((o) => (o.localId === outcome.localId ? { ...o, status: 'pending', message: undefined } : o)),
    );
    await submitSingleService(draft, createdShopId);
  }

  async function submitSingleProduct(draft: DraftProduct, shopId: string) {
    try {
      const created = await createProduct({
        pName: draft.pName.trim(),
        pDetail: draft.pDetail.trim(),
        pAmount: Number(draft.pAmount),
        pDiscount: draft.pDiscount ? Number(draft.pDiscount) : undefined,
        pCondition: draft.pCondition,
        pQuantity: Number(draft.pQuantity || '1'),
        category: draft.category.trim(),
        shopId,
      });
      if (draft.images.length) {
        await uploadProductImages(created.id, draft.images);
      }
      setProductOutcomes((list) =>
        list.map((o) => (o.localId === draft.localId ? { ...o, status: 'success', message: undefined } : o)),
      );
    } catch (err) {
      setProductOutcomes((list) =>
        list.map((o) =>
          o.localId === draft.localId
            ? { ...o, status: 'error', message: err instanceof ApiError ? err.message : 'Failed to create product.' }
            : o,
        ),
      );
    }
  }

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      let userId = selectedExistingUser?.id || createdUserId;

      if (!userId && ownerMode === 'new') {
        const user = await createUser({
          fullName: ownerFullName.trim(),
          email: ownerEmail.trim(),
          phone: ownerPhone.trim(),
          password: ownerPassword,
        });
        userId = user.id;
        setCreatedUserId(user.id);
      }

      if (!userId) throw new Error('No owner selected.');

      let shopId = createdShopId;
      if (!shopId) {
        const shop = await createShop({
          userId,
          name: shopName.trim(),
          phone: shopPhone.trim(),
          slogan: slogan.trim() || undefined,
          shopType: shopType.trim(),
          categories,
          university: university.trim() || undefined,
          areaName: areaName.trim() || undefined,
          website: website.trim() || undefined,
          openingTime: to24hTimeToAmPm(openingTime) || undefined,
          closingTime: to24hTimeToAmPm(closingTime) || undefined,
          operatingMode,
          address: address.trim(),
          latitude: Number(latitude),
          longitude: Number(longitude),
          image: shopImage,
          banner: shopBanner,
        });
        shopId = shop.id;
        setCreatedShopId(shop.id);
        setCreatedShopName(shop.name);
      }

      const initialOutcomes: ProductOutcome[] = products.map((p) => ({
        localId: p.localId,
        name: p.pName.trim() || 'Untitled product',
        status: 'pending',
      }));
      setProductOutcomes(initialOutcomes);

      for (const draft of products) {
        await submitSingleProduct(draft, shopId);
      }

      setServiceOutcomes(
        services.map((s) => ({ localId: s.localId, name: s.name.trim() || 'Untitled service', status: 'pending' as const })),
      );
      for (const draft of services) {
        await submitSingleService(draft, shopId);
      }

      setIsDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong while registering the shop.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isDone) {
    const successCount = productOutcomes.filter((o) => o.status === 'success').length;
    const failedOutcomes = productOutcomes.filter((o) => o.status === 'error');
    const serviceSuccess = serviceOutcomes.filter((o) => o.status === 'success').length;
    const failedServices = serviceOutcomes.filter((o) => o.status === 'error');
    const parts = [
      productOutcomes.length ? `${successCount}/${productOutcomes.length} product(s)` : null,
      serviceOutcomes.length ? `${serviceSuccess}/${serviceOutcomes.length} service(s)` : null,
    ].filter(Boolean);
    return (
      <PageShell title="Shop registered" maxWidth="max-w-xl">
        <SuccessBanner
          message={parts.length === 0
            ? `"${createdShopName}" was created with no products or services. They can be added later.`
            : `"${createdShopName}" was created with ${parts.join(' and ')} added successfully.`}
        />
        {failedServices.length > 0 && (
          <div className="mb-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              {failedServices.length} service(s) failed to save. You can retry them individually:
            </p>
            {failedServices.map((outcome) => (
              <div key={outcome.localId} className="flex items-center justify-between gap-3 text-sm">
                <span>{outcome.name} — {outcome.message}</span>
                <button
                  type="button"
                  onClick={() => retryService(outcome)}
                  className="font-semibold text-[#008100] hover:underline"
                >
                  Retry
                </button>
              </div>
            ))}
          </div>
        )}        {failedOutcomes.length > 0 && (
          <div className="mb-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              {failedOutcomes.length} product(s) failed to save. You can retry them individually:
            </p>
            {failedOutcomes.map((outcome) => (
              <div key={outcome.localId} className="flex items-center justify-between gap-3 text-sm">
                <span>{outcome.name} — {outcome.message}</span>
                <button
                  type="button"
                  onClick={() => retryProduct(outcome)}
                  className="font-semibold text-[#008100] hover:underline"
                >
                  Retry
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <PrimaryButton type="button" onClick={() => navigate('/admin')}>
            Back to dashboard
          </PrimaryButton>
          <SecondaryButton type="button" onClick={() => window.location.reload()}>
            Register another shop
          </SecondaryButton>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Register a shop" subtitle="Walk the owner through each step on your device." maxWidth="max-w-xl">
      <div className="mb-6 flex gap-1.5">
        {STEPS.map((label, index) => (
          <div key={label} className="flex-1">
            <div className={`h-1.5 rounded-full ${index <= step ? 'bg-[#008100]' : 'bg-gray-200'}`} />
            <p className={`mt-1 text-[11px] font-medium ${index === step ? 'text-[#008100]' : 'text-gray-400'}`}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <ErrorBanner message={error} />

      {step === 0 && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOwnerMode('new')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${ownerMode === 'new' ? 'border-[#008100] bg-[#e8f5e9] text-[#008100]' : 'border-[var(--hive-border)] text-gray-600'}`}
            >
              New owner
            </button>
            <button
              type="button"
              onClick={() => setOwnerMode('existing')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${ownerMode === 'existing' ? 'border-[#008100] bg-[#e8f5e9] text-[#008100]' : 'border-[var(--hive-border)] text-gray-600'}`}
            >
              Existing user
            </button>
          </div>

          {ownerMode === 'new' ? (
            <>
              <div>
                <FieldLabel>Full name</FieldLabel>
                <TextInput value={ownerFullName} onChange={(e) => setOwnerFullName(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <TextInput type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <TextInput value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Initial password (min. 8 characters)</FieldLabel>
                <TextInput
                  type="text"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Share this with the owner so they can sign in later"
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <TextInput
                  placeholder="Search by name or email"
                  value={existingQuery}
                  onChange={(e) => setExistingQuery(e.target.value)}
                />
                <SecondaryButton type="button" className="w-auto px-4" onClick={handleSearchExisting} disabled={isSearchingUsers}>
                  Search
                </SecondaryButton>
              </div>
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {existingResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedExistingUser(user)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${selectedExistingUser?.id === user.id ? 'border-[#008100] bg-[#e8f5e9]' : 'border-[var(--hive-border)]'}`}
                  >
                    <p className="font-semibold">{user.fullName}</p>
                    <p className="text-gray-500">{user.email}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <FieldLabel>Shop name</FieldLabel>
            <TextInput value={shopName} onChange={(e) => setShopName(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Shop phone</FieldLabel>
            <TextInput value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Shop type</FieldLabel>
            <TextInput value={shopType} onChange={(e) => setShopType(e.target.value)} placeholder="e.g. Fashion, Food" />
          </div>
          <div>
            <FieldLabel>Categories (comma-separated)</FieldLabel>
            <TextInput value={categoriesInput} onChange={(e) => setCategoriesInput(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Slogan (optional)</FieldLabel>
            <TextInput value={slogan} onChange={(e) => setSlogan(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>University (optional)</FieldLabel>
              <TextInput value={university} onChange={(e) => setUniversity(e.target.value)} />
            </div>
            <div>
              <FieldLabel>Area (optional)</FieldLabel>
              <TextInput value={areaName} onChange={(e) => setAreaName(e.target.value)} />
            </div>
          </div>
          <div>
            <FieldLabel>Website (optional)</FieldLabel>
            <TextInput value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Address</FieldLabel>
            <TextInput value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Latitude</FieldLabel>
              <TextInput value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="6.5244" />
            </div>
            <div>
              <FieldLabel>Longitude</FieldLabel>
              <TextInput value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="3.3792" />
            </div>
          </div>
          <SecondaryButton
            type="button"
            onClick={() => {
              if (!navigator.geolocation) return;
              navigator.geolocation.getCurrentPosition((pos) => {
                setLatitude(String(pos.coords.latitude));
                setLongitude(String(pos.coords.longitude));
              });
            }}
          >
            Use my current location
          </SecondaryButton>
          <div>
            <FieldLabel>Operating mode</FieldLabel>
            <select
              value={operatingMode}
              onChange={(e) => setOperatingMode(e.target.value as 'FIXED' | 'FLEXIBLE')}
              className="w-full rounded-lg border border-[var(--hive-border)] px-3.5 py-2.5 text-[15px]"
            >
              <option value="FIXED">Fixed hours</option>
              <option value="FLEXIBLE">Flexible hours</option>
            </select>
          </div>
          {operatingMode === 'FIXED' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Opening time</FieldLabel>
                <TextInput type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Closing time</FieldLabel>
                <TextInput type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} />
              </div>
            </div>
          )}
          <div>
            <FieldLabel>Shop logo/image (optional)</FieldLabel>
            <input type="file" accept="image/*" onChange={(e) => setShopImage(e.target.files?.[0] || null)} />
          </div>
          <div>
            <FieldLabel>Shop banner (optional)</FieldLabel>
            <input type="file" accept="image/*" onChange={(e) => setShopBanner(e.target.files?.[0] || null)} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-semibold text-[#17191c]">Products (Optional)</h2>
            <p className="mt-1 text-sm text-gray-500">
              Add products now, or add them later from the shop dashboard.
            </p>
          </div>
          {products.map((product, index) => (
            <div key={product.localId} className="space-y-3 rounded-lg border border-[var(--hive-border)] p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Product {index + 1}</p>
                <button type="button" onClick={() => removeProduct(product.localId)} className="text-sm text-red-600">
                  Remove
                </button>
              </div>
              <div>
                <FieldLabel>Name</FieldLabel>
                <TextInput value={product.pName} onChange={(e) => updateProduct(product.localId, { pName: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <TextInput value={product.pDetail} onChange={(e) => updateProduct(product.localId, { pDetail: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Price (₦)</FieldLabel>
                  <TextInput value={product.pAmount} onChange={(e) => updateProduct(product.localId, { pAmount: e.target.value })} />
                </div>
                <div>
                  <FieldLabel>Discount price (optional)</FieldLabel>
                  <TextInput value={product.pDiscount} onChange={(e) => updateProduct(product.localId, { pDiscount: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Condition</FieldLabel>
                  <select
                    value={product.pCondition}
                    onChange={(e) => updateProduct(product.localId, { pCondition: e.target.value as 'NEW' | 'USED' })}
                    className="w-full rounded-lg border border-[var(--hive-border)] px-3.5 py-2.5 text-[15px]"
                  >
                    <option value="NEW">New</option>
                    <option value="USED">Used</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Quantity</FieldLabel>
                  <TextInput value={product.pQuantity} onChange={(e) => updateProduct(product.localId, { pQuantity: e.target.value })} />
                </div>
              </div>
              <div>
                <FieldLabel>Category</FieldLabel>
                <TextInput value={product.category} onChange={(e) => updateProduct(product.localId, { category: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Images (optional)</FieldLabel>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => updateProduct(product.localId, { images: Array.from(e.target.files || []) })}
                />
              </div>
            </div>
          ))}
          <SecondaryButton type="button" onClick={() => setProducts((list) => [...list, emptyProduct()])}>
            + Add product
          </SecondaryButton>
          <div className="border-t border-[var(--hive-border)] pt-6">
            <h2 className="font-semibold text-[#17191c]">Services (Optional)</h2>
            <p className="mt-1 text-sm text-gray-500">
              Add services if the shop provides services. You can also add them later.
            </p>
          </div>
          {services.map((service, index) => (
            <div key={service.localId} className="space-y-3 rounded-lg border border-[var(--hive-border)] p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Service {index + 1}</p>
                <button
                  type="button"
                  onClick={() => setServices((list) => list.filter((s) => s.localId !== service.localId))}
                  className="text-sm text-red-600"
                >
                  Remove
                </button>
              </div>
              <div>
                <FieldLabel>Service name</FieldLabel>
                <TextInput value={service.name} onChange={(e) => updateService(service.localId, { name: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <TextInput value={service.description} onChange={(e) => updateService(service.localId, { description: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Price (₦)</FieldLabel>
                <TextInput value={service.price} onChange={(e) => updateService(service.localId, { price: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Duration (optional)</FieldLabel>
                  <TextInput value={service.duration} onChange={(e) => updateService(service.localId, { duration: e.target.value })} />
                </div>
                <div>
                  <FieldLabel>Availability (optional)</FieldLabel>
                  <TextInput value={service.availability} onChange={(e) => updateService(service.localId, { availability: e.target.value })} />
                </div>
              </div>
            </div>
          ))}
          <SecondaryButton type="button" onClick={() => setServices((list) => [...list, emptyService()])}>
            + Add Service
          </SecondaryButton>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 text-sm">
          <div className="rounded-lg bg-[var(--hive-background)] p-4">
            <p className="font-semibold">Owner</p>
            <p>{ownerMode === 'new' ? `${ownerFullName} (${ownerEmail})` : `${selectedExistingUser?.fullName} (${selectedExistingUser?.email})`}</p>
          </div>
          <div className="rounded-lg bg-[var(--hive-background)] p-4">
            <p className="font-semibold">Shop</p>
            <p>{shopName} — {shopType}</p>
            <p>{address}</p>
          </div>
          <div className="rounded-lg bg-[var(--hive-background)] p-4">
            <p className="font-semibold">Products (Optional) ({products.length})</p>
            {products.length ? (
              <ul className="list-disc pl-5">
                {products.map((p) => (
                  <li key={p.localId}>{p.pName || 'Untitled'} — ₦{p.pAmount || 0}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-gray-600">No products added. You can add them later from the shop dashboard.</p>
            )}
          </div>
          <div className="rounded-lg bg-[var(--hive-background)] p-4">
            <p className="font-semibold">Services (Optional) ({services.length})</p>
            {services.length ? (
              <ul className="list-disc pl-5">
                {services.map((s) => (
                  <li key={s.localId}>{s.name || 'Untitled'} — ₦{s.price || 0}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-gray-600">No services added. You can add them later.</p>
            )}
          </div>
          {productOutcomes.length > 0 && (
            <div className="space-y-1">
              {productOutcomes.map((o) => (
                <p key={o.localId}>
                  {o.name}: {o.status === 'pending' ? 'Saving…' : o.status === 'success' ? 'Saved' : `Failed: ${o.message}`}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <SecondaryButton type="button" onClick={goBack} disabled={isSubmitting}>
            Back
          </SecondaryButton>
        )}
        {step < STEPS.length - 1 ? (
          <PrimaryButton type="button" onClick={goNext}>
            Continue
          </PrimaryButton>
        ) : (
          <PrimaryButton type="button" onClick={handleSubmit} isLoading={isSubmitting}>
            Submit registration
          </PrimaryButton>
        )}
      </div>
    </PageShell>
  );
}
