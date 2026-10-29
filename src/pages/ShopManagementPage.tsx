import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Package, Store, Wrench } from 'lucide-react';
import {
  getMyShops,
  type OwnedShopSummary,
} from '../api/accountDeletionApi';
import {
  createProduct,
  createShopService,
  deleteAdminShopProduct,
  deleteAdminShopService,
  getAdminShopProducts,
  getAdminShopServices,
  updateAdminShopProduct,
  updateAdminShopService,
  uploadProductImages,
  type AdminShopProduct,
  type AdminShopService,
  type CreateProductPayload,
  type CreateServicePayload,
} from '../api/adminApi';
import { ApiError } from '../lib/apiClient';
import { useRouter } from '../lib/router';
import {
  ErrorBanner,
  FieldLabel,
  FullPageLoader,
  PrimaryButton,
  SecondaryButton,
  SuccessBanner,
  TextInput,
} from '../components/ui';

type FormView = 'product' | 'service' | null;
type SelectableListing = AdminShopProduct | AdminShopService;

const fieldClass = 'w-full rounded-lg border border-[var(--hive-border)] bg-white px-3.5 py-2.5 text-[15px] text-[#17191c]';
const cardClass = 'rounded-xl border border-[var(--hive-border)] bg-white p-5';

export default function ShopManagementPage({
  initialShopId,
  returnToDashboard = false,
}: {
  initialShopId?: string;
  returnToDashboard?: boolean;
}) {
  const { navigate } = useRouter();
  const [shops, setShops] = useState<OwnedShopSummary[]>([]);
  const [shopId, setShopId] = useState('');
  const [shopsLoading, setShopsLoading] = useState(true);
  const [shopsError, setShopsError] = useState<string | null>(null);
  const [products, setProducts] = useState<AdminShopProduct[]>([]);
  const [services, setServices] = useState<AdminShopService[]>([]);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formView, setFormView] = useState<FormView>(null);
  const [editingProduct, setEditingProduct] = useState<AdminShopProduct | null>(null);
  const [editingService, setEditingService] = useState<AdminShopService | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyShops()
      .then((ownedShops) => {
        if (cancelled) return;
        setShops(ownedShops);
        const selectedShopId = ownedShops.find((shop) => shop.id === initialShopId)?.id
          || ownedShops[0]?.id
          || '';
        if (selectedShopId) setListingsLoading(true);
        setShopId(selectedShopId);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setShopsError(loadError instanceof ApiError ? loadError.message : 'Unable to load your shops.');
        }
      })
      .finally(() => {
        if (!cancelled) setShopsLoading(false);
      });
    return () => { cancelled = true; };
  }, [initialShopId]);

  useEffect(() => {
    if (!shopId) return;

    let cancelled = false;
    Promise.allSettled([getAdminShopProducts(shopId), getAdminShopServices(shopId)])
      .then(([productsResult, servicesResult]) => {
        if (cancelled) return;
        if (productsResult.status === 'fulfilled') {
          setProducts(productsResult.value);
        } else {
          setProductsError(productsResult.reason instanceof ApiError
            ? productsResult.reason.message
            : 'Unable to load your products.');
        }
        if (servicesResult.status === 'fulfilled') {
          setServices(servicesResult.value);
        } else {
          setServicesError(servicesResult.reason instanceof ApiError
            ? servicesResult.reason.message
            : 'Unable to load your services.');
        }
      })
      .finally(() => {
        if (!cancelled) setListingsLoading(false);
      });
    return () => { cancelled = true; };
  }, [shopId, refreshKey]);

  function startProductForm(product: AdminShopProduct | null = null) {
    setError(null);
    setNotice(null);
    setEditingProduct(product);
    setEditingService(null);
    setFormView('product');
  }

  function startServiceForm(service: AdminShopService | null = null) {
    setError(null);
    setNotice(null);
    setEditingService(service);
    setEditingProduct(null);
    setFormView('service');
  }

  function closeForm() {
    setFormView(null);
    setEditingProduct(null);
    setEditingService(null);
    setError(null);
  }

  function refreshListings() {
    if (!shopId) return;
    setListingsLoading(true);
    setProductsError(null);
    setServicesError(null);
    setRefreshKey((key) => key + 1);
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const pAmount = Number(form.get('pAmount'));
    const pQuantity = Number(form.get('pQuantity'));
    const pDiscountValue = String(form.get('pDiscount') || '').trim();
    const pDiscount = pDiscountValue ? Number(pDiscountValue) : undefined;
    const payload: CreateProductPayload = {
      pName: String(form.get('pName') || '').trim(),
      pDetail: String(form.get('pDetail') || '').trim(),
      pAmount,
      pDiscount,
      pCondition: String(form.get('pCondition') || 'NEW') as 'NEW' | 'USED',
      pQuantity,
      category: String(form.get('category') || '').trim(),
      shopId,
    };
    const imageInput = formElement.elements.namedItem('images') as HTMLInputElement | null;
    const imageFiles = Array.from(imageInput?.files ?? []).filter((image) => image.size > 0);

    if (!payload.pName || !payload.pDetail || !payload.category) {
      setError('Product name, description, and category are required.');
      return;
    }
    if (!Number.isFinite(pAmount) || pAmount <= 0
      || !Number.isInteger(pQuantity) || pQuantity < 0
      || (pDiscount !== undefined && (!Number.isFinite(pDiscount) || pDiscount < 0))) {
      setError('Enter a valid product price, discount, and non-negative whole-number quantity.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const saved = editingProduct
        ? await updateAdminShopProduct(editingProduct.id, payload)
        : await createProduct(payload);
      if (imageFiles.length) {
        try {
          await uploadProductImages(saved.id, imageFiles);
        } catch (imageError) {
          setNotice(`Product saved, but its images could not be uploaded: ${imageError instanceof Error ? imageError.message : 'Upload failed.'}`);
          closeForm();
          refreshListings();
          return;
        }
      }
      setNotice(editingProduct ? 'Product updated.' : 'Product added to your shop.');
      closeForm();
      refreshListings();
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : 'Unable to save the product.');
    } finally {
      setIsSaving(false);
    }
  }

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const price = Number(form.get('price'));
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
    if (!Number.isFinite(price) || price <= 0) {
      setError('Enter a service price greater than zero.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (editingService) {
        await updateAdminShopService(editingService.id, payload);
      } else {
        await createShopService(shopId, payload);
      }
      setNotice(editingService ? 'Service updated.' : 'Service added to your shop.');
      closeForm();
      refreshListings();
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : 'Unable to save the service.');
    } finally {
      setIsSaving(false);
    }
  }

  async function removeListing(listing: SelectableListing, kind: 'product' | 'service') {
    const name = 'pName' in listing ? listing.pName : listing.name;
    if (!window.confirm(`Delete "${name}" from your shop?`)) return;
    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (kind === 'product') await deleteAdminShopProduct(listing.id);
      else await deleteAdminShopService(listing.id);
      setNotice(`${kind === 'product' ? 'Product' : 'Service'} deleted.`);
      refreshListings();
    } catch (deleteError) {
      setError(deleteError instanceof ApiError
        ? deleteError.message
        : `Unable to delete the ${kind}.`);
    } finally {
      setIsSaving(false);
    }
  }

  const selectedShop = shops.find((shop) => shop.id === shopId);

  if (shopsLoading) return <FullPageLoader label="Loading your shops…" />;

  return (
    <main className="min-h-screen bg-[var(--hive-background)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <button type="button" onClick={() => navigate(returnToDashboard ? '/shop-owner/dashboard' : '/account')} className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#008100]">
          <ArrowLeft size={18} /> {returnToDashboard ? 'Shop owner dashboard' : 'Your account'}
        </button>
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-[#17191c]">Manage your listings</h1>
          <p className="mt-1 text-sm text-gray-600">Add and update products and services for your shop.</p>
        </header>

        <ErrorBanner message={shopsError || error} />
        <SuccessBanner message={notice} />

        {!shopsError && shops.length === 0 && (
          <section className={cardClass}>
            <h2 className="font-semibold text-[#17191c]">No shop is linked to your account</h2>
            <p className="mt-2 text-sm text-gray-600">Once your HiveMarket shop is registered to this account, you can manage its products and services here.</p>
          </section>
        )}

        {shops.length > 0 && (
          <>
            <section className={`${cardClass} mb-5`}>
              <label htmlFor="shop-selection" className="mb-1.5 block text-sm font-medium text-[#17191c]">Your shop</label>
              <select id="shop-selection" value={shopId} onChange={(event) => {
                setListingsLoading(true);
                setProductsError(null);
                setServicesError(null);
                setShopId(event.target.value);
                setFormView(null);
                setError(null);
                setNotice(null);
              }} className={fieldClass}>
                {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
              </select>
              {selectedShop && (
                <div className="mt-3 flex items-center gap-3">
                  {selectedShop.imageUrl
                    ? <img src={selectedShop.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8f5e9] text-[#008100]"><Store size={20} /></div>}
                  <p className="font-semibold text-[#17191c]">{selectedShop.name}</p>
                </div>
              )}
            </section>

            {formView === 'product' && (
              <section className={`${cardClass} mb-5 max-w-2xl`}>
                <h2 className="mb-5 text-lg font-bold">{editingProduct ? 'Edit product' : 'Add product'}</h2>
                <form className="space-y-4" onSubmit={(event) => void saveProduct(event)}>
                  <div><FieldLabel>Product name</FieldLabel><TextInput name="pName" required defaultValue={editingProduct?.pName} /></div>
                  <div><FieldLabel>Description</FieldLabel><textarea name="pDetail" required rows={4} defaultValue={editingProduct?.pDetail} className={`${fieldClass} resize-y`} /></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><FieldLabel>Price (₦)</FieldLabel><TextInput name="pAmount" type="number" min="0.01" step="0.01" required defaultValue={editingProduct?.pAmount} /></div>
                    <div><FieldLabel>Discount (optional)</FieldLabel><TextInput name="pDiscount" type="number" min="0" step="0.01" defaultValue={editingProduct?.pDiscount ?? ''} /></div>
                    <div>
                      <FieldLabel>Condition</FieldLabel>
                      <select name="pCondition" className={fieldClass} defaultValue={editingProduct?.pCondition || 'NEW'}>
                        <option value="NEW">New</option><option value="USED">Used</option>
                      </select>
                    </div>
                    <div><FieldLabel>Quantity</FieldLabel><TextInput name="pQuantity" type="number" min="0" step="1" required defaultValue={editingProduct?.pQuantity ?? 1} /></div>
                  </div>
                  <div><FieldLabel>Category</FieldLabel><TextInput name="category" required defaultValue={editingProduct?.category} /></div>
                  <div>
                    <FieldLabel>{editingProduct ? 'Add product images' : 'Product images (optional)'}</FieldLabel>
                    <input name="images" type="file" accept="image/*" multiple />
                  </div>
                  <div className="flex gap-3">
                    <PrimaryButton type="submit" isLoading={isSaving}>{editingProduct ? 'Save product' : 'Add product'}</PrimaryButton>
                    <SecondaryButton type="button" onClick={closeForm}>Cancel</SecondaryButton>
                  </div>
                </form>
              </section>
            )}

            {formView === 'service' && (
              <section className={`${cardClass} mb-5 max-w-2xl`}>
                <h2 className="mb-5 text-lg font-bold">{editingService ? 'Edit service' : 'Add service'}</h2>
                <form className="space-y-4" onSubmit={(event) => void saveService(event)}>
                  <div><FieldLabel>Service name</FieldLabel><TextInput name="name" required defaultValue={editingService?.name} /></div>
                  <div><FieldLabel>Description</FieldLabel><textarea name="description" required rows={4} defaultValue={editingService?.description} className={`${fieldClass} resize-y`} /></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><FieldLabel>Price (₦)</FieldLabel><TextInput name="price" type="number" min="0.01" step="0.01" required defaultValue={editingService?.price} /></div>
                    <div><FieldLabel>Duration (optional)</FieldLabel><TextInput name="duration" defaultValue={editingService?.duration || ''} /></div>
                  </div>
                  <div><FieldLabel>Availability (optional)</FieldLabel><TextInput name="availability" defaultValue={editingService?.availability || ''} /></div>
                  <div className="flex gap-3">
                    <PrimaryButton type="submit" isLoading={isSaving}>{editingService ? 'Save service' : 'Add service'}</PrimaryButton>
                    <SecondaryButton type="button" onClick={closeForm}>Cancel</SecondaryButton>
                  </div>
                </form>
              </section>
            )}

            <div className="mb-5 flex flex-wrap gap-2">
              <PrimaryButton type="button" className="w-auto" onClick={() => startProductForm()}>Add product</PrimaryButton>
              <PrimaryButton type="button" className="w-auto" onClick={() => startServiceForm()}>Add service</PrimaryButton>
              <SecondaryButton type="button" className="w-auto" disabled={listingsLoading} onClick={refreshListings}>Refresh listings</SecondaryButton>
            </div>

            <section className={`${cardClass} mb-5`}>
              <h2 className="mb-4 text-lg font-bold"><Package className="mr-2 inline" size={19} />Products</h2>
              <ErrorBanner message={productsError} />
              {listingsLoading ? <p className="py-4 text-sm text-gray-600">Loading products…</p>
                : products.length ? (
                  <div className="divide-y divide-[var(--hive-border)]">
                    {products.map((product) => (
                      <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                        <div>
                          <p className="font-semibold">{product.pName}</p>
                          <p className="text-sm text-gray-600">{product.category} · ₦{Number(product.pAmount).toLocaleString()} · Qty {product.pQuantity}</p>
                        </div>
                        <div className="flex gap-2">
                          <SecondaryButton type="button" className="w-auto px-3" disabled={isSaving} onClick={() => startProductForm(product)}>Edit</SecondaryButton>
                          <SecondaryButton type="button" className="w-auto px-3 text-red-700" disabled={isSaving} onClick={() => void removeListing(product, 'product')}>Delete</SecondaryButton>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="py-4 text-sm text-gray-600">No products have been added to this shop yet.</p>}
            </section>

            <section className={cardClass}>
              <h2 className="mb-4 text-lg font-bold"><Wrench className="mr-2 inline" size={19} />Services</h2>
              <ErrorBanner message={servicesError} />
              {listingsLoading ? <p className="py-4 text-sm text-gray-600">Loading services…</p>
                : services.length ? (
                  <div className="divide-y divide-[var(--hive-border)]">
                    {services.map((service) => (
                      <div key={service.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                        <div>
                          <p className="font-semibold">{service.name}</p>
                          <p className="text-sm text-gray-600">₦{Number(service.price).toLocaleString()}{service.duration ? ` · ${service.duration}` : ''}</p>
                        </div>
                        <div className="flex gap-2">
                          <SecondaryButton type="button" className="w-auto px-3" disabled={isSaving} onClick={() => startServiceForm(service)}>Edit</SecondaryButton>
                          <SecondaryButton type="button" className="w-auto px-3 text-red-700" disabled={isSaving} onClick={() => void removeListing(service, 'service')}>Delete</SecondaryButton>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="py-4 text-sm text-gray-600">No services have been added to this shop yet.</p>}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
