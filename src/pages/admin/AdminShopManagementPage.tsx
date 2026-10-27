import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, MapPin, Package, Store, Wrench } from 'lucide-react';
import {
  createProduct,
  createShopService,
  deleteAdminShopProduct,
  deleteAdminShopService,
  getAdminShopDetail,
  getAdminShopProducts,
  getAdminShopServices,
  getNigeriaLocations,
  updateAdminShop,
  updateAdminShopProduct,
  updateAdminShopService,
  uploadProductImages,
  type AdminShopDetail,
  type AdminShopProduct,
  type AdminShopService,
  type CreateProductPayload,
  type CreateServicePayload,
} from '../../api/adminApi';
import { ApiError } from '../../lib/apiClient';
import { useRouter } from '../../lib/router';
import { ErrorBanner, FieldLabel, PrimaryButton, SecondaryButton, SuccessBanner, TextInput } from '../../components/ui';

type ManagementView = 'overview' | 'products' | 'services' | 'add-product' | 'add-service' | 'edit-shop';

const countries = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'United Kingdom',
  'United States',
  'Canada',
  'United Arab Emirates',
  'Other',
];

const selectClass = 'w-full rounded-lg border border-[var(--hive-border)] bg-white px-3.5 py-2.5 text-[15px] text-[#17191c]';
const cardClass = 'rounded-xl border border-[var(--hive-border)] bg-white p-5';

function formatLocation(shop: AdminShopDetail) {
  return [shop.address, shop.areaName, shop.lga, shop.state, shop.country]
    .map((part) => part?.trim())
    .filter((part, index, parts): part is string => Boolean(part)
      && parts.findIndex((candidate) => candidate?.toLowerCase() === part?.toLowerCase()) === index)
    .join(', ');
}

function inputTime(value?: string | null) {
  const match = value?.match(/(\d{1,2}):(\d{2})/);
  if (!match) return '';
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function amPmTime(value: string) {
  if (!value) return undefined;
  const [hoursText, minutes] = value.split(':');
  const hours = Number(hoursText);
  return `${hours % 12 || 12}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
}

export default function AdminShopManagementPage({ shopId }: { shopId: string }) {
  const { navigate } = useRouter();
  const [view, setView] = useState<ManagementView>('overview');
  const [shop, setShop] = useState<AdminShopDetail | null>(null);
  const [products, setProducts] = useState<AdminShopProduct[]>([]);
  const [services, setServices] = useState<AdminShopService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [nigeriaLocations, setNigeriaLocations] = useState<Record<string, string[]> | null>(null);
  const [locationDataError, setLocationDataError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<AdminShopProduct | null>(null);
  const [editingService, setEditingService] = useState<AdminShopService | null>(null);

  const loadShopData = useCallback(() => Promise.allSettled([
      getAdminShopDetail(shopId),
      getAdminShopProducts(shopId),
      getAdminShopServices(shopId),
  ]), [shopId]);

  const applyShopData = useCallback(([
    shopResult,
    productsResult,
    servicesResult,
  ]: Awaited<ReturnType<typeof loadShopData>>) => {
    if (shopResult.status === 'fulfilled') setShop(shopResult.value);
    else setError(shopResult.reason instanceof ApiError ? shopResult.reason.message : 'Unable to load this shop.');
    if (productsResult.status === 'fulfilled') {
      setProducts(productsResult.value);
      setProductsError(null);
    } else {
      setProductsError(productsResult.reason instanceof ApiError ? productsResult.reason.message : 'Unable to load shop products.');
    }
    if (servicesResult.status === 'fulfilled') {
      setServices(servicesResult.value);
      setServicesError(null);
    } else {
      setServicesError(servicesResult.reason instanceof ApiError ? servicesResult.reason.message : 'Unable to load shop services.');
    }
    setIsLoading(false);
  }, []);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    applyShopData(await loadShopData());
  }, [applyShopData, loadShopData]);

  useEffect(() => {
    let cancelled = false;
    void loadShopData().then((results) => {
      if (!cancelled) applyShopData(results);
    });
    return () => { cancelled = true; };
  }, [applyShopData, loadShopData]);

  useEffect(() => {
    let cancelled = false;
    getNigeriaLocations()
      .then((data) => { if (!cancelled) setNigeriaLocations(data); })
      .catch((err: unknown) => {
        if (!cancelled) setLocationDataError(err instanceof Error ? err.message : 'Unable to load Nigerian location data.');
      });
    return () => { cancelled = true; };
  }, []);

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shop) return;
    const form = new FormData(event.currentTarget);
    const pAmount = Number(form.get('pAmount'));
    const pQuantity = Number(form.get('pQuantity'));
    if (!Number.isFinite(pAmount) || pAmount <= 0 || !Number.isInteger(pQuantity) || pQuantity < 0) {
      setError('Enter a valid product price and a non-negative whole-number quantity.');
      return;
    }
    const payload: CreateProductPayload = {
      pName: String(form.get('pName') || '').trim(),
      pDetail: String(form.get('pDetail') || '').trim(),
      pAmount,
      pDiscount: form.get('pDiscount') ? Number(form.get('pDiscount')) : undefined,
      pCondition: String(form.get('pCondition') || 'NEW') as 'NEW' | 'USED',
      pQuantity,
      category: String(form.get('category') || '').trim(),
      shopId: shop.id,
    };
    const imageInput = event.currentTarget.elements.namedItem('images') as HTMLInputElement | null;
    const imageFiles = Array.from(imageInput?.files ?? []).filter((image) => image.size > 0);
    if (!payload.pName || !payload.pDetail || !payload.category) {
      setError('Product name, description, and category are required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const saved = editingProduct
        ? await updateAdminShopProduct(editingProduct.id, payload)
        : await createProduct(payload);
      if (imageFiles.length && !editingProduct) {
        try {
          await uploadProductImages(saved.id, imageFiles);
        } catch (imageError) {
          setNotice(`Product saved, but its images could not be uploaded: ${imageError instanceof Error ? imageError.message : 'Upload failed.'}`);
          setEditingProduct(null);
          setView('products');
          await reload();
          return;
        }
      }
      setNotice(editingProduct ? 'Product updated.' : 'Product added to this shop.');
      setEditingProduct(null);
      setView('products');
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to save the product.');
    } finally {
      setIsSaving(false);
    }
  }

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const price = Number(form.get('price'));
    if (!Number.isFinite(price) || price <= 0) {
      setError('Enter a service price greater than zero.');
      return;
    }
    const payload: CreateServicePayload = {
      name: String(form.get('name') || '').trim(),
      description: String(form.get('description') || '').trim(),
      price,
      duration: String(form.get('duration') || '').trim() || undefined,
      availability: String(form.get('availability') || '').trim() || undefined,
    };
    if (!payload.name || !payload.description) {
      setError('Service name and description are required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (editingService) {
        await updateAdminShopService(editingService.id, payload);
      } else {
        await createShopService(shopId, payload);
      }
      setNotice(editingService ? 'Service updated.' : 'Service added to this shop.');
      setEditingService(null);
      setView('services');
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to save the service.');
    } finally {
      setIsSaving(false);
    }
  }

  async function saveShop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shop) return;
    const form = new FormData(event.currentTarget);
    const countryChoice = String(form.get('countryChoice') || '');
    const country = countryChoice === 'Other' ? String(form.get('otherCountry') || '').trim() : countryChoice;
    const state = String(form.get('state') || '').trim();
    const lga = String(form.get('lga') || '').trim();
    const address = String(form.get('address') || '').trim();
    if (!country || !state || !lga || !address) {
      setError('Country, state/region, LGA/district, and a specific address are required.');
      return;
    }
    const latitude = String(form.get('latitude') || '').trim();
    const longitude = String(form.get('longitude') || '').trim();
    if ((latitude && !Number.isFinite(Number(latitude))) || (longitude && !Number.isFinite(Number(longitude)))) {
      setError('Latitude and longitude must be valid numbers.');
      return;
    }
    if (country.toLowerCase() === 'nigeria'
        && (locationDataError || !nigeriaLocations?.[state]?.includes(lga))) {
      setError('Choose a valid Nigerian LGA under the selected state.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const hours = String(form.get('openTime') || '');
      const closing = String(form.get('closingTime') || '');
      await updateAdminShop(shop.id, {
        name: String(form.get('name') || '').trim(),
        phone: String(form.get('phone') || '').trim(),
        address,
        country,
        state,
        lga,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        isOpen: form.get('isOpen') === 'on',
        slogan: String(form.get('slogan') || '').trim(),
        website: String(form.get('website') || '').trim(),
        university: String(form.get('university') || '').trim(),
        areaName: String(form.get('areaName') || '').trim(),
        operatingMode: String(form.get('operatingMode') || '') as 'FIXED' | 'FLEXIBLE',
        openTime: amPmTime(hours),
        closingTime: amPmTime(closing),
        image: (form.get('image') as File).size ? form.get('image') as File : null,
        banner: (form.get('banner') as File).size ? form.get('banner') as File : null,
      });
      setNotice('Shop details updated.');
      setView('overview');
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to update shop details.');
    } finally {
      setIsSaving(false);
    }
  }

  async function removeProduct(product: AdminShopProduct) {
    if (!window.confirm(`Delete "${product.pName}" from this shop?`)) return;
    setIsSaving(true);
    setError(null);
    try {
      await deleteAdminShopProduct(product.id);
      setNotice('Product deleted.');
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to delete the product.');
    } finally {
      setIsSaving(false);
    }
  }

  async function removeService(service: AdminShopService) {
    if (!window.confirm(`Delete "${service.name}" from this shop?`)) return;
    setIsSaving(true);
    setError(null);
    try {
      await deleteAdminShopService(service.id);
      setNotice('Service deleted.');
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to delete the service.');
    } finally {
      setIsSaving(false);
    }
  }

  const backToOverview = () => {
    setError(null);
    setNotice(null);
    setEditingProduct(null);
    setEditingService(null);
    setView('overview');
  };

  if (isLoading && !shop) {
    return <div className="min-h-screen bg-[var(--hive-background)] p-8 text-center text-gray-600">Loading shop…</div>;
  }
  if (!shop) {
    return (
      <main className="min-h-screen bg-[var(--hive-background)] p-6">
        <ErrorBanner message={error || 'Shop not found.'} />
        <SecondaryButton className="w-auto" onClick={() => navigate('/admin/shops')}>Back to shops</SecondaryButton>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--hive-background)]">
      <header className="border-b border-[var(--hive-border)] bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin/shops')} className="flex items-center gap-2 text-sm font-semibold text-[#008100]">
            <ArrowLeft size={18} /> Shops
          </button>
          <button type="button" onClick={() => navigate('/admin')} className="text-sm font-semibold text-gray-600">Admin dashboard</button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <ErrorBanner message={error} />
        <SuccessBanner message={notice} />
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {shop.image || shop.banner ? (
              <img src={shop.image || shop.banner || ''} alt="" className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#e8f5e9] text-[#008100]"><Store /></div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-[#17191c]">{shop.name}</h1>
              <p className="mt-1 text-sm text-gray-600">{shop.shopType || 'Shop'} · {shop.verified ? 'Verified' : 'Pending verification'}</p>
            </div>
          </div>
          <SecondaryButton type="button" className="w-auto" onClick={() => { setIsLoading(true); setNotice(null); setError(null); void reload(); }}>
            Refresh
          </SecondaryButton>
        </div>

        <nav className="mb-5 flex flex-wrap gap-2" aria-label="Shop management">
          <SecondaryButton type="button" className="w-auto" onClick={backToOverview}>Overview</SecondaryButton>
          <SecondaryButton type="button" className="w-auto" onClick={() => setView('products')}>View products</SecondaryButton>
          <SecondaryButton type="button" className="w-auto" onClick={() => setView('services')}>View services</SecondaryButton>
          <PrimaryButton type="button" className="w-auto" onClick={() => { setEditingProduct(null); setView('add-product'); }}>Add product</PrimaryButton>
          <PrimaryButton type="button" className="w-auto" onClick={() => { setEditingService(null); setView('add-service'); }}>Add service</PrimaryButton>
          <SecondaryButton type="button" className="w-auto" onClick={() => { setError(null); setView('edit-shop'); }}>Edit shop details</SecondaryButton>
        </nav>

        {view === 'overview' && (
          <>
            <section className="mb-5 grid gap-4 sm:grid-cols-2">
              <div className={cardClass}>
                <p className="text-sm text-gray-500">Products</p>
                <p className="mt-1 text-3xl font-bold">{shop.productCount}</p>
                <p className="mt-2 text-sm text-gray-600">{shop.productCount === 0 ? 'No products have been added to this shop yet.' : 'Products associated with this shop.'}</p>
                {shop.productCount === 0 && <button type="button" onClick={() => setView('add-product')} className="mt-3 text-sm font-semibold text-[#008100]">Add First Product</button>}
              </div>
              <div className={cardClass}>
                <p className="text-sm text-gray-500">Services</p>
                <p className="mt-1 text-3xl font-bold">{shop.serviceCount ?? services.length}</p>
                <p className="mt-2 text-sm text-gray-600">{(shop.serviceCount ?? services.length) === 0 ? 'No services have been added to this shop yet.' : 'Services associated with this shop.'}</p>
                {(shop.serviceCount ?? services.length) === 0 && <button type="button" onClick={() => setView('add-service')} className="mt-3 text-sm font-semibold text-[#008100]">Add First Service</button>}
              </div>
            </section>
            <section className={cardClass}>
              <h2 className="mb-4 text-lg font-bold">Shop information</h2>
              {shop.slogan && <p className="mb-4 text-sm text-gray-600">{shop.slogan}</p>}
              <div className="mb-4 flex items-start gap-2 text-sm text-gray-700">
                <MapPin size={17} className="mt-0.5 shrink-0 text-[#008100]" />
                <span>{formatLocation(shop) || 'No location has been recorded.'}</span>
              </div>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {[
                  ['Owner', shop.ownerName],
                  ['Owner email', shop.ownerEmail],
                  ['Phone', shop.phone],
                  ['Category', shop.categories?.join(', ') || shop.shopType],
                  ['Website', shop.website],
                  ['University / region', shop.university],
                  ['Registration status', shop.verified ? 'Verified' : 'Pending verification'],
                  ['Operating status', shop.open ? 'Open' : 'Closed'],
                  ['Registered', shop.registeredAt ? new Date(shop.registeredAt).toLocaleDateString() : null],
                ].map(([label, value]) => value && (
                  <div key={label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
                    <dd className="mt-0.5 break-words text-sm text-[#17191c]">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </>
        )}

        {view === 'products' && (
          <section className={cardClass}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold"><Package className="mr-2 inline" size={19} />Products</h2>
              <PrimaryButton type="button" className="w-auto" onClick={() => { setEditingProduct(null); setView('add-product'); }}>Add product</PrimaryButton>
            </div>
            {productsError && <ErrorBanner message={productsError} />}
            {products.length ? (
              <div className="divide-y divide-[var(--hive-border)]">
                {products.map((product) => (
                  <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div>
                      <p className="font-semibold">{product.pName}</p>
                      <p className="text-sm text-gray-600">{product.category} · ₦{Number(product.pAmount).toLocaleString()} · Qty {product.pQuantity}</p>
                    </div>
                    <div className="flex gap-2">
                      <SecondaryButton type="button" className="w-auto px-3" onClick={() => { setEditingProduct(product); setView('add-product'); }}>Edit</SecondaryButton>
                      <SecondaryButton type="button" className="w-auto px-3 text-red-700" disabled={isSaving} onClick={() => void removeProduct(product)}>Delete</SecondaryButton>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-gray-600">No products have been added to this shop yet.</p>
            )}
          </section>
        )}

        {view === 'services' && (
          <section className={cardClass}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold"><Wrench className="mr-2 inline" size={19} />Services</h2>
              <PrimaryButton type="button" className="w-auto" onClick={() => { setEditingService(null); setView('add-service'); }}>Add service</PrimaryButton>
            </div>
            {servicesError && <ErrorBanner message={servicesError} />}
            {services.length ? (
              <div className="divide-y divide-[var(--hive-border)]">
                {services.map((service) => (
                  <div key={service.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div>
                      <p className="font-semibold">{service.name}</p>
                      <p className="text-sm text-gray-600">₦{Number(service.price).toLocaleString()}{service.duration ? ` · ${service.duration}` : ''}</p>
                    </div>
                    <div className="flex gap-2">
                      <SecondaryButton type="button" className="w-auto px-3" onClick={() => { setEditingService(service); setView('add-service'); }}>Edit</SecondaryButton>
                      <SecondaryButton type="button" className="w-auto px-3 text-red-700" disabled={isSaving} onClick={() => void removeService(service)}>Delete</SecondaryButton>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-gray-600">No services have been added to this shop yet.</p>
            )}
          </section>
        )}

        {view === 'add-product' && (
          <section className={`${cardClass} max-w-2xl`}>
            <div className="mb-5">
              <button type="button" onClick={() => setView('products')} className="mb-3 text-sm font-semibold text-[#008100]">← Back to products</button>
              <h2 className="text-lg font-bold">{editingProduct ? 'Edit product' : 'Add product'} · {shop.name}</h2>
            </div>
            <form className="space-y-4" onSubmit={(event) => void saveProduct(event)}>
              <div><FieldLabel>Product name</FieldLabel><TextInput name="pName" required defaultValue={editingProduct?.pName} /></div>
              <div><FieldLabel>Description</FieldLabel><textarea name="pDetail" required rows={4} defaultValue={editingProduct?.pDetail} className={`${selectClass} resize-y`} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><FieldLabel>Price (₦)</FieldLabel><TextInput name="pAmount" type="number" min="0.01" step="0.01" required defaultValue={editingProduct?.pAmount} /></div>
                <div><FieldLabel>Discount price (optional)</FieldLabel><TextInput name="pDiscount" type="number" min="0" step="0.01" defaultValue="" /></div>
                <div>
                  <FieldLabel>Condition</FieldLabel>
                  <select name="pCondition" className={selectClass} defaultValue={editingProduct?.pCondition || 'NEW'}>
                    <option value="NEW">New</option><option value="USED">Used</option>
                  </select>
                </div>
                <div><FieldLabel>Quantity</FieldLabel><TextInput name="pQuantity" type="number" min="0" step="1" required defaultValue={editingProduct?.pQuantity ?? 1} /></div>
              </div>
              <div><FieldLabel>Category</FieldLabel><TextInput name="category" required defaultValue={editingProduct?.category} /></div>
              {!editingProduct && <div><FieldLabel>Product images (optional)</FieldLabel><input name="images" type="file" accept="image/*" multiple /></div>}
              <div className="flex gap-3">
                <PrimaryButton type="submit" isLoading={isSaving}>{editingProduct ? 'Save product' : 'Add product'}</PrimaryButton>
                <SecondaryButton type="button" onClick={() => setView('products')}>Cancel</SecondaryButton>
              </div>
            </form>
          </section>
        )}

        {view === 'add-service' && (
          <section className={`${cardClass} max-w-2xl`}>
            <div className="mb-5">
              <button type="button" onClick={() => setView('services')} className="mb-3 text-sm font-semibold text-[#008100]">← Back to services</button>
              <h2 className="text-lg font-bold">{editingService ? 'Edit service' : 'Add service'} · {shop.name}</h2>
            </div>
            <form className="space-y-4" onSubmit={(event) => void saveService(event)}>
              <div><FieldLabel>Service name</FieldLabel><TextInput name="name" required defaultValue={editingService?.name} /></div>
              <div><FieldLabel>Description</FieldLabel><textarea name="description" required rows={4} defaultValue={editingService?.description} className={`${selectClass} resize-y`} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><FieldLabel>Price (₦)</FieldLabel><TextInput name="price" type="number" min="0.01" step="0.01" required defaultValue={editingService?.price} /></div>
                <div><FieldLabel>Duration (optional)</FieldLabel><TextInput name="duration" defaultValue={editingService?.duration || ''} /></div>
              </div>
              <div><FieldLabel>Availability (optional)</FieldLabel><TextInput name="availability" defaultValue={editingService?.availability || ''} /></div>
              <div className="flex gap-3">
                <PrimaryButton type="submit" isLoading={isSaving}>{editingService ? 'Save service' : 'Add service'}</PrimaryButton>
                <SecondaryButton type="button" onClick={() => setView('services')}>Cancel</SecondaryButton>
              </div>
            </form>
          </section>
        )}

        {view === 'edit-shop' && (
          <ShopEditForm
            shop={shop}
            isSaving={isSaving}
            locations={nigeriaLocations}
            locationError={locationDataError}
            onCancel={backToOverview}
            onSubmit={(event) => void saveShop(event)}
          />
        )}
      </main>
    </div>
  );
}

function ShopEditForm({
  shop,
  isSaving,
  locations,
  locationError,
  onCancel,
  onSubmit,
}: {
  shop: AdminShopDetail;
  isSaving: boolean;
  locations: Record<string, string[]> | null;
  locationError: string | null;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const initialCountry = countries.includes(shop.country || '') ? shop.country || 'Nigeria' : 'Other';
  const [countryChoice, setCountryChoice] = useState(initialCountry);
  const [otherCountry, setOtherCountry] = useState(initialCountry === 'Other' ? shop.country || '' : '');
  const [state, setState] = useState(shop.state || '');
  const [lga, setLga] = useState(shop.lga || '');

  const nigeria = (countryChoice === 'Other' ? otherCountry : countryChoice).toLowerCase() === 'nigeria';
  const lgaOptions = locations?.[state] ?? [];

  return (
    <section className={`${cardClass} max-w-2xl`}>
      <h2 className="mb-5 text-lg font-bold">Edit shop details</h2>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div><FieldLabel>Shop name</FieldLabel><TextInput name="name" required defaultValue={shop.name} /></div>
        <div><FieldLabel>Shop phone</FieldLabel><TextInput name="phone" required defaultValue={shop.phone || ''} /></div>
        <div><FieldLabel>Shop type</FieldLabel><TextInput name="shopType" defaultValue={shop.shopType || ''} disabled /></div>
        <div><FieldLabel>Specific location / address</FieldLabel><TextInput name="address" required defaultValue={shop.address || ''} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><FieldLabel>Area name</FieldLabel><TextInput name="areaName" defaultValue={shop.areaName || ''} /></div>
          <div><FieldLabel>University / region</FieldLabel><TextInput name="university" defaultValue={shop.university || ''} /></div>
        </div>
        <div>
          <FieldLabel>Country</FieldLabel>
          <select
            name="countryChoice"
            className={selectClass}
            value={countryChoice}
            onChange={(event) => {
              setCountryChoice(event.target.value);
              setOtherCountry('');
              setState('');
              setLga('');
            }}
          >
            {countries.map((country) => <option key={country}>{country}</option>)}
          </select>
        </div>
        {countryChoice === 'Other' && <div><FieldLabel>Country name</FieldLabel><TextInput name="otherCountry" value={otherCountry} onChange={(event) => setOtherCountry(event.target.value)} /></div>}
        {nigeria ? (
          <>
            {locationError && <p className="text-sm text-red-700">{locationError}</p>}
            <div>
              <FieldLabel>State / region</FieldLabel>
              <select name="state" className={selectClass} value={state} disabled={!locations} onChange={(event) => { setState(event.target.value); setLga(''); }}>
                <option value="">Select state or FCT</option>
                {Object.keys(locations ?? {}).map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>LGA</FieldLabel>
              <select name="lga" className={selectClass} value={lga} disabled={!state || !locations} onChange={(event) => setLga(event.target.value)}>
                <option value="">Select LGA</option>
                {lgaOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
          </>
        ) : (
          <>
            <div><FieldLabel>State / region</FieldLabel><TextInput name="state" value={state} onChange={(event) => { setState(event.target.value); setLga(''); }} /></div>
            <div><FieldLabel>LGA / district</FieldLabel><TextInput name="lga" value={lga} onChange={(event) => setLga(event.target.value)} /></div>
          </>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div><FieldLabel>Latitude (optional)</FieldLabel><TextInput name="latitude" inputMode="decimal" defaultValue={shop.latitude ?? ''} /></div>
          <div><FieldLabel>Longitude (optional)</FieldLabel><TextInput name="longitude" inputMode="decimal" defaultValue={shop.longitude ?? ''} /></div>
        </div>
        <div><FieldLabel>Slogan</FieldLabel><TextInput name="slogan" defaultValue={shop.slogan || ''} /></div>
        <div><FieldLabel>Website</FieldLabel><TextInput name="website" defaultValue={shop.website || ''} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><FieldLabel>Operating mode</FieldLabel><select name="operatingMode" className={selectClass} defaultValue={shop.operatingMode || 'FIXED'}><option value="FIXED">Fixed</option><option value="FLEXIBLE">Flexible</option></select></div>
          <label className="flex items-center gap-2 pt-6 text-sm"><input name="isOpen" type="checkbox" defaultChecked={shop.open} /> Shop is currently open</label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><FieldLabel>Opening time</FieldLabel><TextInput name="openTime" type="time" defaultValue={inputTime(shop.openTime)} /></div>
          <div><FieldLabel>Closing time</FieldLabel><TextInput name="closingTime" type="time" defaultValue={inputTime(shop.closingTime)} /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><FieldLabel>Replace shop image (optional)</FieldLabel><input name="image" type="file" accept="image/*" /></div>
          <div><FieldLabel>Replace shop banner (optional)</FieldLabel><input name="banner" type="file" accept="image/*" /></div>
        </div>
        <div className="flex gap-3">
          <PrimaryButton type="submit" isLoading={isSaving}>Save shop details</PrimaryButton>
          <SecondaryButton type="button" onClick={onCancel}>Cancel</SecondaryButton>
        </div>
      </form>
    </section>
  );
}
