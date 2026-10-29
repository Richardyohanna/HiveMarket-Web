import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  ClipboardList,
  Clock3,
  Heart,
  MapPin,
  MessageCircle,
  Package,
  Search,
  ShieldAlert,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  UserRound,
  UsersRound,
  Bell,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/router';
import ShareActions from '../components/ShareActions';
import ShopMap from '../components/ShopMap';
import { ApiError } from '../lib/apiClient';
import {
  createUserShoppingRequest,
  getBuyerShops,
  getSavedShops,
  getShopProfile,
  getShopRating,
  getShopReviews,
  getShopCatalog,
  getShopServices,
  removeSavedShop,
  reportShop,
  saveShop,
  searchDiscovery,
  submitShopReview,
  toggleShopFollow,
  type DiscoveryResponse,
  type PublicShop,
  type SavedShop,
  type ShopProfile,
  type ShopRating,
  type ShopReview,
  type ShopServiceItem,
} from '../api/shoppingApi';
import type { AdminShopProduct } from '../api/adminApi';
import {
  ShoppingMessagesSection,
  ShoppingNotificationsSection,
  ShoppingRequestsSection,
} from './ShoppingAccountSections';
import { getProductShareUrl, getShopShareUrl } from '../utils/shareLinks';
import { getShopOpenStatus } from '../utils/shopStatus';

type ShoppingSection =
  | 'home'
  | 'shops'
  | 'products'
  | 'cart'
  | 'search'
  | 'map'
  | 'messages'
  | 'subscriptions'
  | 'saved'
  | 'requests'
  | 'notifications';

type CartProduct = Pick<AdminShopProduct, 'id' | 'pName' | 'pDetail' | 'pAmount' | 'pQuantity' | 'category'> & {
  imageUrls?: string[];
};
type CartLine = { product: CartProduct; quantity: number };

const sections: Array<{
  id: ShoppingSection | 'account';
  label: string;
  path: string;
  icon: typeof Store;
}> = [
  { id: 'home', label: 'Home / Discover', path: '/shopping', icon: Store },
  { id: 'shops', label: 'Shops', path: '/shopping/shops', icon: ShoppingBag },
  { id: 'products', label: 'Products', path: '/shopping/products', icon: Package },
  { id: 'cart', label: 'Cart', path: '/shopping/cart', icon: ShoppingCart },
  { id: 'search', label: 'Search', path: '/shopping/search', icon: Search },
  { id: 'map', label: 'Map', path: '/shopping/map', icon: MapPin },
  { id: 'messages', label: 'Messages', path: '/shopping/messages', icon: MessageCircle },
  { id: 'subscriptions', label: 'Subscriptions', path: '/shopping/subscriptions', icon: UsersRound },
  { id: 'saved', label: 'Saved shops', path: '/shopping/saved', icon: Bookmark },
  { id: 'requests', label: 'Shopping lists / requests', path: '/shopping/requests', icon: ClipboardList },
  { id: 'notifications', label: 'Notifications', path: '/shopping/notifications', icon: Bell },
  { id: 'account', label: 'Profile / Account', path: '/account', icon: UserRound },
];

// Sections where picking a shop opens the dedicated shop page
const shopDetailSections: ShoppingSection[] = ['home', 'shops', 'products', 'search', 'map'];

function isShoppingSection(value: string): value is ShoppingSection {
  return value !== 'account' && sections.some((section) => section.id === value);
}

function getShopId(value: string) {
  const input = value.trim();
  const match = input.match(/\/Shop\/([^/?#]+)/i);
  return match?.[1] || input;
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function getWebUrl(value: unknown) {
  const text = getString(value);
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function getShopImage(shop: PublicShop) {
  return getString(shop.primaryImage)
    || getString(shop.image)
    || getString(shop.imageUrl)
    || getString(shop.banner);
}

function getShopLocation(shop: ShopProfile) {
  const rawLatitude = shop.location?.latitude ?? null;
  const rawLongitude = shop.location?.longitude ?? null;
  const latitude = rawLatitude != null && Number.isFinite(rawLatitude) && rawLatitude >= -90 && rawLatitude <= 90 ? rawLatitude : null;
  const longitude = rawLongitude != null && Number.isFinite(rawLongitude) && rawLongitude >= -180 && rawLongitude <= 180 ? rawLongitude : null;
  const address = [
    getString(shop.location?.address),
    getString(shop.areaName),
    getString(shop.lga),
    getString(shop.state),
    getString(shop.country),
  ].filter((part): part is string => Boolean(part))
    .filter((part, index, parts) => parts.findIndex((value) => value.toLowerCase() === part.toLowerCase()) === index)
    .join(', ');
  return { latitude, longitude, address };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 401) return 'Your sign-in has expired. Sign in again to continue.';
  if (error instanceof ApiError && error.status === 403) return 'Your account is not authorized to perform this action.';
  return error instanceof Error ? error.message : fallback;
}

function ShopRatingBadge({ shopId }: { shopId: string }) {
  const [rating, setRating] = useState<ShopRating | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getShopRating(shopId)
      .then((result) => { if (!cancelled) setRating(result); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [shopId]);

  if (failed) return <span className="text-xs text-gray-500">Rating unavailable</span>;
  if (!rating || !rating.totalRating) return null;
  return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700"><Star size={13} fill="currentColor" />{Number(rating.AverageRating).toFixed(1)} ({rating.totalRating})</span>;
}

function ShopSummaryCard({
  shop,
  onExplore,
  onAction,
  actionLabel,
  actionBusy = false,
}: {
  shop: ShopProfile;
  onExplore: (shopId: string) => void;
  onAction?: () => void;
  actionLabel?: string;
  actionBusy?: boolean;
}) {
  const location = getShopLocation(shop);
  const image = getShopImage(shop);
  const categories = [shop.shopType, ...(shop.categories || [])].filter((value): value is string => Boolean(value));
  const isOpen = getShopOpenStatus(shop);
  const hasDistance = typeof shop.distanceMeters === 'number' && Number.isFinite(shop.distanceMeters) && shop.distanceMeters >= 0;
  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--hive-border)] bg-white">
      {image
        ? <img src={image} alt="" className="h-40 w-full object-cover" />
        : <div className="flex h-40 items-center justify-center bg-green-50 text-[#008100]"><Store size={38} /></div>}
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-[#17191c]">{shop.name}</h3>
            <p className="mt-1 truncate text-xs text-gray-500">{categories.join(' · ') || 'Shop'}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isOpen == null ? 'bg-gray-100 text-gray-600' : isOpen ? 'bg-green-50 text-[#006d24]' : 'bg-red-50 text-red-700'}`}>
            {isOpen == null ? 'Status unavailable' : isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-gray-600">{location.address || 'Location unavailable'}</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ShopRatingBadge shopId={shop.id} />
          {hasDistance && <span className="text-xs text-gray-500">{shop.distanceMeters! < 1000 ? `${Math.round(shop.distanceMeters!)} m away` : `${(shop.distanceMeters! / 1000).toFixed(1)} km away`}</span>}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <ShareActions compact url={getShopShareUrl(shop.id)} title={shop.name} text={`Check out ${shop.name} on HiveMarket`} />
          <div className="flex gap-2">
            {onAction && <button type="button" disabled={actionBusy} onClick={onAction} className="rounded-lg border border-[var(--hive-border)] px-3 py-2 text-xs font-semibold text-[#17191c] disabled:opacity-50">{actionBusy ? 'Updating…' : actionLabel}</button>}
            <button type="button" onClick={() => onExplore(shop.id)} className="rounded-lg bg-green-50 px-3 py-2 text-sm font-bold text-[#006d24] hover:bg-green-100">Explore</button>
          </div>
        </div>
      </div>
    </article>
  );
}

function savedShopProfile(saved: SavedShop, distanceMeters?: number | null): ShopProfile {
  return {
    id: saved.id,
    name: saved.name,
    imageUrl: saved.banner,
    banner: saved.banner,
    location: saved.location,
    areaName: saved.areaName,
    shopType: saved.shopType,
    operatingMode: saved.operatingMode,
    isOpen: saved.isOpen,
    openTime: saved.openTime,
    closingTime: saved.closingTime,
    country: saved.country,
    state: saved.state,
    lga: saved.lga,
    distanceMeters,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value);
}

export default function ShoppingPage({ section: sectionParam, initialShopId }: { section: string; initialShopId?: string }) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const userId = user?.userId;
  const section: ShoppingSection = isShoppingSection(sectionParam) && sectionParam !== 'home'
    ? sectionParam
    : 'home';
  const [shopInput, setShopInput] = useState('');
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [shopId, setShopId] = useState('');
  const [shopViewOpen, setShopViewOpen] = useState(false);
  const [catalog, setCatalog] = useState<AdminShopProduct[]>([]);
  const [services, setServices] = useState<ShopServiceItem[]>([]);
  const [loadingShop, setLoadingShop] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [shopError, setShopError] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [servicesRetryKey, setServicesRetryKey] = useState(0);
  const [productQuery, setProductQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<CartProduct | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [discovery, setDiscovery] = useState<DiscoveryResponse | null>(null);
  const [loadingDiscovery, setLoadingDiscovery] = useState(true);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [mapViewMode, setMapViewMode] = useState<'map' | 'list'>('map');
  const [directoryShops, setDirectoryShops] = useState<ShopProfile[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [directoryRetryKey, setDirectoryRetryKey] = useState(0);
  const [savedShops, setSavedShops] = useState<SavedShop[]>([]);
  const [loadingSavedShops, setLoadingSavedShops] = useState(false);
  const [savedShopsError, setSavedShopsError] = useState<string | null>(null);
  const [savedRetryKey, setSavedRetryKey] = useState(0);
  const [shopActionError, setShopActionError] = useState<string | null>(null);
  const [shopActionNotice, setShopActionNotice] = useState<string | null>(null);
  const [busyShopAction, setBusyShopAction] = useState(false);
  const [busyDirectoryShopId, setBusyDirectoryShopId] = useState<string | null>(null);
  const [busySavedShopId, setBusySavedShopId] = useState<string | null>(null);
  const [shopRating, setShopRating] = useState<ShopRating | null>(null);
  const [shopReviews, setShopReviews] = useState<ShopReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewsRetryKey, setReviewsRetryKey] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportNotice, setReportNotice] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestNotice, setRequestNotice] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const catalogRef = useRef<HTMLElement | null>(null);
  const initialShopOpenedRef = useRef(false);

  // The shop page is only shown within discovery sections. Leaving for another workspace closes it.
  const showShopDetail = shopViewOpen && shopDetailSections.includes(section);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoadingDiscovery(true);
      try {
        const result = await searchDiscovery('', 20, userId, userLocation || undefined);
        if (!cancelled) {
          setDiscovery(result);
          setDiscoveryError(null);
        }
      } catch (error: unknown) {
        if (!cancelled) setDiscoveryError(getErrorMessage(error, 'Unable to load HiveMarket discovery.'));
      } finally {
        if (!cancelled) setLoadingDiscovery(false);
      }
    });
    return () => { cancelled = true; };
  }, [userId, userLocation]);

  useEffect(() => {
    if (!userId || (section !== 'map' && section !== 'subscriptions' && section !== 'saved')) return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoadingDirectory(true);
      setDirectoryError(null);
      try {
        const result = await getBuyerShops(userId, section === 'map' || section === 'saved' ? userLocation || undefined : undefined);
        if (!cancelled) setDirectoryShops(result);
      } catch (error: unknown) {
        if (!cancelled) setDirectoryError(getErrorMessage(error, 'Unable to load shops.'));
      } finally {
        if (!cancelled) setLoadingDirectory(false);
      }
    });
    return () => { cancelled = true; };
  }, [section, userId, userLocation, directoryRetryKey]);

  useEffect(() => {
    if (!userId || section !== 'saved') return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoadingSavedShops(true);
      setSavedShopsError(null);
      try {
        const result = await getSavedShops(userId);
        if (!cancelled) setSavedShops(result);
      } catch (error: unknown) {
        if (!cancelled) setSavedShopsError(getErrorMessage(error, 'Unable to load saved shops.'));
      } finally {
        if (!cancelled) setLoadingSavedShops(false);
      }
    });
    return () => { cancelled = true; };
  }, [section, userId, savedRetryKey]);

  useEffect(() => {
    if (!shopId || !userId) return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoadingReviews(true);
      setReviewsError(null);
      try {
        const [rating, reviews] = await Promise.all([getShopRating(shopId, userId), getShopReviews(shopId)]);
        if (!cancelled) {
          setShopRating(rating);
          setShopReviews(reviews);
        }
      } catch (error: unknown) {
        if (!cancelled) setReviewsError(getErrorMessage(error, 'Unable to load shop reviews.'));
      } finally {
        if (!cancelled) setLoadingReviews(false);
      }
    });
    return () => { cancelled = true; };
  }, [shopId, userId, reviewsRetryKey]);

  useEffect(() => {
    if (!shopId) return;
    let cancelled = false;
    getShopCatalog(shopId)
      .then((products) => {
        if (!cancelled) setCatalog(products);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setCatalogError(error instanceof Error ? error.message : 'Unable to load this shop catalog.');
          setCatalog([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false);
      });
    return () => { cancelled = true; };
  }, [shopId]);

  useEffect(() => {
    if (!shopId) return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoadingServices(true);
      setServicesError(null);
      try {
        const result = await getShopServices(shopId);
        if (!cancelled) setServices(result);
      } catch (error: unknown) {
        if (!cancelled) setServicesError(getErrorMessage(error, 'Unable to load this shop’s services.'));
      } finally {
        if (!cancelled) setLoadingServices(false);
      }
    });
    return () => { cancelled = true; };
  }, [shopId, servicesRetryKey]);

  const shopName = getString(shop?.name) || 'Shop';
  const shopImage = shop ? getShopImage(shop) : null;
  const shopWebsite = shop ? getWebUrl(shop.website) : null;
  const location = shop ? getShopLocation(shop) : null;
  const shopAddress = location?.address || 'Location not provided';
  const directionsUrl = location && location.latitude != null && location.longitude != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`
    : location?.address
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`
      : null;
  const mapShops = useMemo(() => {
    if (!shop || directoryShops.some((item) => item.id === shop.id)) return directoryShops;
    return [...directoryShops, shop];
  }, [directoryShops, shop]);
  const filteredProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    if (!query) return catalog;
    return catalog.filter((product) =>
      `${product.pName} ${product.category} ${product.pDetail}`.toLowerCase().includes(query));
  }, [catalog, productQuery]);
  const cartTotal = cart.reduce((total, line) => total + Number(line.product.pAmount) * line.quantity, 0);
  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);

  async function findShop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = getShopId(shopInput);
    if (!id) {
      setShopError('Enter a shop ID or a HiveMarket shop link.');
      return;
    }
    await openShop(id);
  }

  function addToCart(product: CartProduct) {
    if (product.pQuantity <= 0) {
      setCartNotice('This product is currently out of stock.');
      return;
    }
    const existing = cart.find((line) => line.product.id === product.id);
    if (existing && existing.quantity >= product.pQuantity) {
      setCartNotice('The cart quantity cannot exceed the available stock.');
      return;
    }
    setCart((current) => {
      const currentLine = current.find((line) => line.product.id === product.id);
      return currentLine
        ? current.map((line) => line.product.id === product.id ? { ...line, quantity: Math.min(line.quantity + 1, product.pQuantity) } : line)
        : [...current, { product, quantity: 1 }];
    });
    setCartNotice(`${product.pName} added to your cart.`);
  }

  function updateCartQuantity(productId: string, quantity: number) {
    setCart((current) => quantity <= 0
      ? current.filter((line) => line.product.id !== productId)
      : current.map((line) => line.product.id === productId
        ? { ...line, quantity: Math.min(quantity, line.product.pQuantity) }
        : line));
  }

  async function submitShoppingRequest() {
    if (!shopId || !cart.length) return;
    setSubmittingRequest(true);
    setRequestError(null);
    setRequestNotice(null);
    try {
      await createUserShoppingRequest(shopId, cart.map(({ product, quantity }) => ({
        productId: product.id,
        quantity,
      })));
      setCart([]);
      setRequestNotice('Your shopping request was sent to the shop.');
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to send your shopping request.');
    } finally {
      setSubmittingRequest(false);
    }
  }

  async function searchHiveMarket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingDiscovery(true);
    setDiscoveryError(null);
    try {
      setDiscovery(await searchDiscovery(discoveryQuery.trim(), 20, user?.userId, userLocation || undefined));
    } catch (error) {
      setDiscoveryError(getErrorMessage(error, 'Unable to search HiveMarket.'));
    } finally {
      setLoadingDiscovery(false);
    }
  }

  const openShop = useCallback(async (id: string) => {
    setShopInput(id);
    setShopError(null);
    setLoadingShop(true);
    setCatalog([]);
    setServices([]);
    setCatalogError(null);
    setServicesError(null);
    setProductQuery('');
    setShop(null);
    setShopId('');
    setLoadingCatalog(false);
    setCart([]);
    setCartNotice(null);
    setShopActionError(null);
    setShopActionNotice(null);
    setReportOpen(false);
    // Open the dedicated shop page (the map section has its own display)
    if (shopDetailSections.includes(section)) {
      setShopViewOpen(true);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    try {
      if (!userId) throw new Error('Sign in to view shop details.');
      const result = await getShopProfile(getShopId(id), userId, userLocation || undefined);
      if (typeof result !== 'object' || result === null) {
        throw new Error('The shop response was not in a supported format.');
      }
      setShop(result);
      setShopId(getString(result.id) || getShopId(id));
      setLoadingCatalog(true);
    } catch (error) {
      setShopError(getErrorMessage(error, 'Unable to find this shop.'));
    } finally {
      setLoadingShop(false);
    }
  }, [section, userId, userLocation]);

  useEffect(() => {
    if (!initialShopId || initialShopOpenedRef.current) return;
    initialShopOpenedRef.current = true;
    void openShop(initialShopId);
  }, [initialShopId, openShop]);

  function closeShop() {
    setShopViewOpen(false);
    setShopError(null);
    setProductQuery('');
    setCartNotice(null);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function scrollToCatalog() {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function locateUser() {
    if (!navigator.geolocation) {
      setLocationError('This browser does not support device location.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
            || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
            || (latitude === 0 && longitude === 0)) {
          setLocationError('Your browser returned an invalid location.');
        } else {
          setUserLocation({ latitude, longitude });
        }
        setLocating(false);
      },
      (error) => {
        setLocationError(error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Shop addresses and map markers remain available.'
          : 'Unable to determine your location. You can try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }

  async function toggleSubscription(targetShop: ShopProfile) {
    if (!user?.userId) return;
    setBusyShopAction(targetShop.id === shop?.id);
    setBusyDirectoryShopId(targetShop.id);
    setShopActionError(null);
    setShopActionNotice(null);
    const following = Boolean(targetShop.isFollowing);
    try {
      await toggleShopFollow(user.userId, targetShop.id);
      setShop((current) => current?.id === targetShop.id ? { ...current, isFollowing: !following } : current);
      setDirectoryShops((current) => current.map((item) => item.id === targetShop.id ? { ...item, isFollowing: !following } : item));
      setShopActionNotice(following ? 'You unsubscribed from this shop.' : 'You subscribed to this shop.');
    } catch (error) {
      setShopActionError(getErrorMessage(error, 'Unable to update this subscription.'));
    } finally {
      if (targetShop.id === shop?.id) setBusyShopAction(false);
      setBusyDirectoryShopId(null);
    }
  }

  async function removeSavedShopFromList(shopIdToRemove: string) {
    if (!user?.userId) return;
    setBusySavedShopId(shopIdToRemove);
    setSavedShopsError(null);
    try {
      await removeSavedShop(user.userId, shopIdToRemove);
      setSavedShops((current) => current.filter((item) => item.id !== shopIdToRemove));
      setShop((current) => current?.id === shopIdToRemove ? { ...current, isShopSaved: false } : current);
      setDirectoryShops((current) => current.map((item) => item.id === shopIdToRemove ? { ...item, isShopSaved: false } : item));
    } catch (error) {
      setSavedShopsError(getErrorMessage(error, 'Unable to remove this saved shop.'));
    } finally {
      setBusySavedShopId(null);
    }
  }

  async function toggleSavedShop() {
    if (!shop || !user?.userId) return;
    setBusyShopAction(true);
    setShopActionError(null);
    setShopActionNotice(null);
    const saved = Boolean(shop.isShopSaved);
    try {
      if (saved) {
        await removeSavedShop(user.userId, shop.id);
        setSavedShops((current) => current.filter((item) => item.id !== shop.id));
      } else {
        await saveShop(user.userId, shop.id);
      }
      setShop((current) => current ? { ...current, isShopSaved: !saved } : current);
      setDirectoryShops((current) => current.map((item) => item.id === shop.id ? { ...item, isShopSaved: !saved } : item));
      setShopActionNotice(saved ? 'Shop removed from saved shops.' : 'Shop added to saved shops.');
    } catch (error) {
      setShopActionError(getErrorMessage(error, 'Unable to update saved shops.'));
    } finally {
      setBusyShopAction(false);
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shop || !user?.userId || !reviewComment.trim()) return;
    setSubmittingReview(true);
    setReviewNotice(null);
    setReviewsError(null);
    try {
      const saved = await submitShopReview(user.userId, shop.id, reviewRating, reviewComment.trim());
      setShopReviews((current) => [saved, ...current.filter((review) => review.id !== saved.id)]);
      setReviewComment('');
      setReviewNotice('Your review was saved.');
      try {
        const [rating, reviews] = await Promise.all([getShopRating(shop.id, user.userId), getShopReviews(shop.id)]);
        setShopRating(rating);
        setShopReviews(reviews);
      } catch (error) {
        setReviewsError(getErrorMessage(error, 'Your review was saved, but the latest review list could not be refreshed.'));
      }
    } catch (error) {
      setReviewsError(getErrorMessage(error, 'Unable to submit your review.'));
    } finally {
      setSubmittingReview(false);
    }
  }

  async function submitShopReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shop || !user?.userId || !reportReason.trim()) return;
    setSubmittingReport(true);
    setReportError(null);
    setReportNotice(null);
    try {
      await reportShop(user.userId, shop.id, reportReason.trim(), reportDetails.trim());
      setReportNotice('Your report was sent to HiveMarket for review.');
      setReportOpen(false);
      setReportReason('');
      setReportDetails('');
    } catch (error) {
      setReportError(getErrorMessage(error, 'Unable to submit this report.'));
    } finally {
      setSubmittingReport(false);
    }
  }

  const lookup = (
    <form onSubmit={(event) => void findShop(event)} className="flex flex-col gap-2  mt-10  sm:flex-row">
      <label className="sr-only" htmlFor="shop-lookup">Shop ID or public HiveMarket shop link</label>
      <input
        id="shop-lookup"
        value={shopInput}
        onChange={(event) => setShopInput(event.target.value)}
        placeholder="Enter a shop ID or paste a public shop link"
        className="min-w-0 flex-1 rounded-xl border border-[var(--hive-border)] bg-white px-4 py-3 text-sm text-[#17191c] outline-none focus:border-[#008100] focus:ring-2 focus:ring-green-100"
      />
      <button type="submit" disabled={loadingShop} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#008100] px-5 py-3 text-sm font-bold text-white hover:bg-[#006d24] disabled:opacity-60">
        <Search size={17} />{loadingShop ? 'Finding shop…' : 'Find shop'}
      </button>
    </form>
  );

  function renderShopCard(showCatalogButton = true) {
    if (!shop) return null;
    const description = getString(shop.description) || getString(shop.slogan);
    const categories = Array.isArray(shop.categories)
      ? shop.categories.filter((category): category is string => typeof category === 'string')
      : [];
    const isOpen = getShopOpenStatus(shop);
    const statusClass = isOpen == null
      ? 'bg-gray-100 text-gray-700'
      : isOpen
        ? 'bg-green-50 text-[#006d24]'
        : 'bg-red-50 text-red-700';
    const hours = shop.openTime && shop.closingTime ? `${shop.openTime} – ${shop.closingTime}` : null;
    return (
      <article className="overflow-hidden rounded-2xl border border-[var(--hive-border)] bg-white">
        {shopImage
          ? <img src={shopImage} alt="" className="h-48 w-full object-cover sm:h-56" />
          : <div className="flex h-40 items-center justify-center bg-green-50 text-[#008100]"><Store size={42} /></div>}
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-[#008100]">Shop profile</p>
              <h2 className="mt-1 text-2xl font-bold text-[#17191c]">{shopName}</h2>
              {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">{description}</p>}
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}>
                {isOpen == null ? 'Status unavailable' : isOpen ? 'Open' : 'Closed'}
              </span>
              {shopRating && shopRating.totalRating > 0 && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                  <Star size={15} fill="currentColor" />{Number(shopRating.AverageRating).toFixed(1)}
                  <span className="font-normal text-gray-500">({shopRating.totalRating} reviews)</span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <ShareActions
                compact
                url={getShopShareUrl(shopId)}
                title={shopName}
                text={`Check out ${shopName} on HiveMarket`}
              />
              {showCatalogButton && (
                <button type="button" onClick={scrollToCatalog} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#008100] px-4 py-2.5 text-sm font-bold text-white">
                  Browse products <ChevronRight size={16} />
                </button>
              )}
              <button type="button" onClick={() => navigate(`/shopping/messages?shopId=${encodeURIComponent(shopId)}`)} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#008100] px-4 py-2.5 text-sm font-bold text-[#008100]">
                <MessageCircle size={16} /> Message shop
              </button>
              <button type="button" disabled={busyShopAction} onClick={() => void toggleSubscription(shop)} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[var(--hive-border)] px-4 py-2.5 text-sm font-bold text-[#17191c] disabled:opacity-50">
                <UsersRound size={16} />{shop.isFollowing ? 'Unsubscribe' : 'Subscribe'}
              </button>
              <button type="button" disabled={busyShopAction} onClick={() => void toggleSavedShop()} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[var(--hive-border)] px-4 py-2.5 text-sm font-bold text-[#17191c] disabled:opacity-50">
                <Heart size={16} fill={shop.isShopSaved ? 'currentColor' : 'none'} />{shop.isShopSaved ? 'Saved' : 'Save shop'}
              </button>
              <button type="button" onClick={() => setReportOpen((current) => !current)} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[var(--hive-border)] px-4 py-2.5 text-sm font-bold text-gray-700">
                <ShieldAlert size={16} />Report shop
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{shopAddress}</span>
            {typeof shop.distanceMeters === 'number' && Number.isFinite(shop.distanceMeters) && shop.distanceMeters >= 0 && (
              <span>{shop.distanceMeters < 1000 ? `${Math.round(shop.distanceMeters)} m` : `${(shop.distanceMeters / 1000).toFixed(1)} km`} away</span>
            )}
            {hours && <span className="inline-flex items-center gap-1.5"><Clock3 size={15} />{hours}</span>}
            {typeof shop.followers === 'number' && <span>{shop.followers} subscribers</span>}
            {typeof shop.productCount === 'number' && <span>{shop.productCount} products</span>}
            {typeof shop.serviceCount === 'number' && <span>{shop.serviceCount} services</span>}
            {shopWebsite && <a className="text-[#008100] underline" href={shopWebsite} target="_blank" rel="noreferrer">Website</a>}
            {categories.map((category) => <span key={category} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs">{category}</span>)}
          </div>
          {(shopActionError || shopActionNotice) && (
            <p role={shopActionError ? 'alert' : 'status'} className={`mt-3 text-sm ${shopActionError ? 'text-red-700' : 'text-[#006d24]'}`}>{shopActionError || shopActionNotice}</p>
          )}
          {reportError && <p role="alert" className="mt-3 text-sm text-red-700">{reportError}</p>}
          {reportNotice && <p role="status" className="mt-3 text-sm text-[#006d24]">{reportNotice}</p>}
          {reportOpen && (
            <form onSubmit={(event) => void submitShopReport(event)} className="mt-4 space-y-3 rounded-xl border border-[var(--hive-border)] bg-gray-50 p-4">
              <label className="block text-sm font-semibold text-[#17191c]">Reason
                <select required value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="mt-1 block w-full rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2">
                  <option value="">Select a reason</option>
                  <option>Inaccurate shop information</option>
                  <option>Inappropriate content</option>
                  <option>Shop is closed or unavailable</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-[#17191c]">Details (optional)
                <textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} rows={3} maxLength={1000} className="mt-1 block w-full rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2 font-normal" />
              </label>
              <div className="flex gap-2">
                <button type="submit" disabled={submittingReport || !reportReason} className="rounded-lg bg-[#008100] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{submittingReport ? 'Sending…' : 'Send report'}</button>
                <button type="button" onClick={() => setReportOpen(false)} className="rounded-lg border border-[var(--hive-border)] px-4 py-2 text-sm font-semibold">Cancel</button>
              </div>
            </form>
          )}
        </div>
      </article>
    );
  }

  function renderShopMapPreview() {
    if (!shop) return null;
    if (location?.latitude == null || location.longitude == null) {
      return <p className="rounded-xl border border-[var(--hive-border)] bg-white p-4 text-sm text-gray-600">This shop has no saved map coordinates. Its address remains available above.</p>;
    }
    return (
      <section className="rounded-2xl border border-[var(--hive-border)] bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div><h3 className="font-bold text-[#17191c]">Shop location</h3><p className="text-sm text-gray-600">{shopAddress}</p></div>
          {directionsUrl && <a href={directionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--hive-border)] px-3 py-2 text-sm font-semibold text-[#008100]">Directions <ArrowUpRight size={15} /></a>}
        </div>
        <ShopMap shops={[shop]} userLocation={userLocation} onOpenShop={(id) => void openShop(id)} className="h-72" />
      </section>
    );
  }

  function renderShopReviews() {
    if (!shop) return null;
    return (
      <section className="rounded-2xl border border-[var(--hive-border)] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#17191c]">Shop reviews</h3>
            {shopRating && shopRating.totalRating > 0 && <p className="mt-1 text-sm text-gray-600">{Number(shopRating.AverageRating).toFixed(1)} out of 5 · {shopRating.totalRating} reviews</p>}
          </div>
          {reviewsError && <button type="button" onClick={() => setReviewsRetryKey((key) => key + 1)} className="text-sm font-semibold text-[#008100] underline">Retry</button>}
        </div>
        {reviewsError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{reviewsError}</p>}
        {loadingReviews ? <p className="mt-4 text-sm text-gray-600">Loading reviews…</p>
          : shopReviews.length === 0 ? <p className="mt-4 text-sm text-gray-600">No reviews have been submitted for this shop yet.</p>
            : <ul className="mt-4 divide-y divide-gray-100">{shopReviews.map((review) => (
              <li key={review.id} className="py-4">
                <div className="flex items-start gap-3">
                  {review.userAvatar ? <img src={review.userAvatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                    : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-sm font-bold text-[#008100]">{review.userName.slice(0, 1) || '?'}</div>}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-[#17191c]">{review.userName}</span><time className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</time></div>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-amber-700"><Star size={13} fill="currentColor" />{review.rating}/5</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{review.comment}</p>
                    {review.replies.map((reply) => <p key={reply.id} className="mt-2 border-l-2 border-green-200 pl-3 text-sm text-gray-600"><span className="font-semibold">{reply.authorName}{reply.isOwner ? ' · Shop owner' : ''}:</span> {reply.text}</p>)}
                  </div>
                </div>
              </li>
            ))}</ul>}
        <form onSubmit={(event) => void submitReview(event)} className="mt-5 space-y-3 border-t border-gray-100 pt-4">
          <h4 className="font-semibold text-[#17191c]">Write a review</h4>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-semibold text-[#17191c]">Rating
              <select value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))} className="mt-1 block rounded-lg border border-[var(--hive-border)] bg-white px-3 py-2">
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} {rating === 1 ? 'star' : 'stars'}</option>)}
              </select>
            </label>
            <button type="submit" disabled={submittingReview || !reviewComment.trim()} className="rounded-lg bg-[#008100] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{submittingReview ? 'Saving…' : 'Submit review'}</button>
          </div>
          <label className="block text-sm font-semibold text-[#17191c]">Comment
            <textarea required value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} rows={3} maxLength={2000} className="mt-1 block w-full rounded-lg border border-[var(--hive-border)] px-3 py-2 font-normal" />
          </label>
          {reviewNotice && <p role="status" className="text-sm text-[#006d24]">{reviewNotice}</p>}
        </form>
      </section>
    );
  }

  function renderProducts(limit?: number) {
    if (loadingCatalog) return <p className="rounded-xl border border-[var(--hive-border)] bg-white p-5 text-sm text-gray-600">Loading catalog…</p>;
    if (catalogError) return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{catalogError}</p>;
    if (!shop) return (
      <div className="rounded-2xl border border-dashed border-[var(--hive-border)] bg-white p-6 text-sm text-gray-600">
        Find a shop first to load its available products.
        <button type="button" onClick={() => navigate('/shopping/shops')} className="ml-1 font-semibold text-[#008100] underline">Find a shop</button>
      </div>
    );
    if (!filteredProducts.length) return <p className="rounded-xl border border-[var(--hive-border)] bg-white p-5 text-sm text-gray-600">{productQuery ? 'No catalog products match your search.' : 'This shop has no products in its catalog.'}</p>;
    const visibleProducts = limit ? filteredProducts.slice(0, limit) : filteredProducts;
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleProducts.map((product) => (
          <article key={product.id} className="overflow-hidden rounded-2xl border border-[var(--hive-border)] bg-white">
            <button type="button" onClick={() => setSelectedProduct(product)} aria-label={`View ${product.pName} details`} className="block h-44 w-full">
              {product.imageUrls?.[0]
                ? <img src={product.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                : <span className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-400"><Package size={38} /></span>}
            </button>
            <div className="p-4">
              <button type="button" onClick={() => setSelectedProduct(product)} className="text-left font-bold text-[#17191c] hover:text-[#008100]">{product.pName}</button>
              <p className="mt-1 line-clamp-2 min-h-10 text-sm text-gray-600">{product.pDetail}</p>
              <p className="mt-3 font-bold text-[#008100]">{formatCurrency(Number(product.pAmount) || 0)}</p>
              <p className="mt-1 text-xs text-gray-500">{product.category} · {product.pQuantity > 0 ? `${product.pQuantity} available` : 'Out of stock'}</p>
              <ShareActions
                compact
                url={getProductShareUrl(product.id)}
                title={product.pName}
                text={`Check out ${product.pName} at ${shopName} on HiveMarket`}
              />
              <button type="button" onClick={() => addToCart(product)} disabled={product.pQuantity <= 0} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#008100] px-3 py-2 text-sm font-semibold text-[#008100] hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50">
                <ShoppingCart size={16} /> Add to cart
              </button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  function renderShopServices() {
    if (loadingServices) return <p role="status" className="rounded-xl border border-[var(--hive-border)] bg-white p-5 text-sm text-gray-600">Loading services…</p>;
    if (servicesError) return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {servicesError}<button type="button" onClick={() => setServicesRetryKey((key) => key + 1)} className="ml-2 font-semibold underline">Retry</button>
      </div>
    );
    if (services.length === 0) return <p className="rounded-xl border border-[var(--hive-border)] bg-white p-5 text-sm text-gray-600">This shop has no listed services.</p>;
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <article key={service.id} className="overflow-hidden rounded-2xl border border-[var(--hive-border)] bg-white">
            {service.image && <img src={service.image} alt="" className="h-40 w-full object-cover" />}
            <div className="p-4">
              <h3 className="font-bold text-[#17191c]">{service.name}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{service.description}</p>
              <p className="mt-3 text-lg font-bold text-[#008100]">{formatCurrency(Number(service.discountedPrice ?? service.price))}</p>
              {service.hasActiveDiscount && service.originalPrice != null && <p className="text-xs text-gray-500 line-through">{formatCurrency(Number(service.originalPrice))}</p>}
              <p className="mt-1 text-xs text-gray-500">{[service.duration, service.availability].filter(Boolean).join(' · ')}</p>
            </div>
          </article>
        ))}
      </div>
    );
  }

  // Dedicated shop page: replaces the discovery list, with a back button
  function renderShopDetail() {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={closeShop}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--hive-border)] bg-white px-4 py-2 text-sm font-semibold text-[#17191c] hover:bg-gray-50"
          >
            <ArrowLeft size={16} /> Back
          </button>
          {cartCount > 0 && (
            <button
              type="button"
              onClick={() => navigate('/shopping/cart')}
              className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-[#006d24] hover:bg-green-100"
            >
              <ShoppingCart size={16} /> View cart ({cartCount})
            </button>
          )}
        </div>

        {loadingShop && (
          <p role="status" className="rounded-2xl border border-[var(--hive-border)] bg-white p-6 text-sm text-gray-600">Loading shop…</p>
        )}

        {shopError && !loadingShop && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <p>{shopError}</p>
            <button type="button" onClick={closeShop} className="mt-3 font-semibold underline">Go back to shops</button>
          </div>
        )}

        {shop && (
          <>
            {renderShopCard()}
            {renderShopMapPreview()}
            <section ref={catalogRef} className="scroll-mt-24 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#17191c]">Products</h2>
                <p className="text-sm text-gray-500">Catalog: {shopName}</p>
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-[var(--hive-border)] bg-white px-3 py-2.5">
                <Search size={17} className="text-gray-500" />
                <span className="sr-only">Search products in this shop</span>
                <input
                  value={productQuery}
                  onChange={(event) => setProductQuery(event.target.value)}
                  placeholder="Search products in this catalog"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>
              {renderProducts()}
              {cartNotice && <p role="status" className="text-sm font-medium text-[#006d24]">{cartNotice}</p>}
            </section>
            <section className="space-y-4">
              <div><h2 className="text-lg font-bold text-[#17191c]">Services</h2><p className="text-sm text-gray-500">Services offered by {shopName}.</p></div>
              {renderShopServices()}
            </section>
            {renderShopReviews()}
          </>
        )}
      </div>
    );
  }

  function renderDiscoveryResults() {
    if (loadingDiscovery) return <p className="rounded-xl border border-[var(--hive-border)] bg-white p-5 text-sm text-gray-600">Loading shops and products…</p>;
    if (discoveryError) return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{discoveryError}</p>;
    const shops = discovery?.relatedShops || [];
    const products = discovery?.products || [];
    if (!shops.length && !products.length) return <p className="rounded-xl border border-[var(--hive-border)] bg-white p-5 text-sm text-gray-600">No matching shops or products were found.</p>;
    return (
      <div className="space-y-5">
        {shops.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold text-[#17191c]">Shops to explore</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {shops.map((item) => (
                <ShopSummaryCard key={item.id} shop={item} onExplore={(id) => void openShop(id)} />
              ))}
            </div>
          </section>
        )}
        {products.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold text-[#17191c]">Products</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <article key={product.id} className="flex flex-wrap gap-3 rounded-xl border border-[var(--hive-border)] bg-white p-3">
                  {product.imageUrls?.[0]
                    ? <img src={product.imageUrls[0]} alt="" className="h-20 w-20 rounded-lg object-cover" />
                    : <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-50 text-gray-400"><Package size={25} /></div>}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-[#17191c]">{product.pName}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-600">{product.pDetail}</p>
                    <p className="mt-2 text-sm font-bold text-[#008100]">{formatCurrency(Number(product.pAmount) || 0)}</p>
                    <ShareActions compact url={getProductShareUrl(product.id)} title={product.pName} text={`Check out ${product.pName} on HiveMarket`} />
                    {product.shopId && <button type="button" onClick={() => void openShop(product.shopId || '')} className="mt-2 text-xs font-semibold text-[#008100] underline">View shop and buy</button>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  const subscribedShops = directoryShops.filter((item) => item.isFollowing);

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-20 lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-[var(--hive-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[90rem] items-center gap-3 px-4 py-3 sm:px-6">
          <button type="button" onClick={() => navigate('/shopping')} className="flex shrink-0 items-center gap-2 text-lg font-black tracking-tight text-[#008100]" aria-label="HiveMarket home">
            <img src="/logo_180x180.png" alt="" className="h-9 w-9 object-contain" />
            <span className="hidden sm:inline">HiveMarket</span>
          </button>
          <div className="hidden min-w-0 flex-1 md:block">
            <button type="button" onClick={() => navigate('/shopping/search')} className="flex w-full max-w-xl items-center gap-2 rounded-full bg-gray-100 px-4 py-2.5 text-left text-sm text-gray-500 hover:bg-gray-200">
              <Search size={17} /> Search within a shop catalog
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => navigate('/shopping/cart')} className="relative rounded-full p-2.5 text-gray-700 hover:bg-gray-100" aria-label={`Cart, ${cartCount} items`}>
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#008100] px-1 text-center text-[11px] font-bold text-white">{cartCount}</span>}
            </button>
            <button type="button" onClick={() => navigate('/shop-owner/dashboard')} className="hidden items-center gap-2 rounded-lg border border-[var(--hive-border)] px-3 py-2 text-sm font-semibold text-[#17191c] hover:bg-gray-50 sm:inline-flex">
              <BriefcaseBusiness size={16} /> Shop Owner Dashboard
            </button>
            <button type="button" onClick={() => navigate('/shop-owner/dashboard')} className="rounded-full p-2.5 text-gray-700 hover:bg-gray-100 sm:hidden" aria-label="Shop Owner Dashboard"><BriefcaseBusiness size={19} /></button>
            <button type="button" onClick={() => navigate('/account')} className="rounded-full bg-green-50 p-2.5 text-[#008100]" aria-label="Account"><UserRound size={19} /></button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[90rem] gap-6 px-3 py-5 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)_17rem]">
        <aside className="hidden lg:block">
          <nav aria-label="Shopping navigation" className="sticky top-20 space-y-1">
            {sections.map((item) => {
              const Icon = item.icon;
              const active = item.id === section;
              return (
                <button key={item.id} type="button" onClick={() => navigate(item.path)} aria-current={active ? 'page' : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold ${active ? 'bg-green-50 text-[#006d24]' : 'text-gray-700 hover:bg-white'}`}>
                  <Icon size={19} /><span className="flex-1">{item.label}</span>
                </button>
              );
            })}
            <div className="my-3 border-t border-gray-200" />
            <button type="button" onClick={() => navigate('/shop-owner/dashboard')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-white">
              <BriefcaseBusiness size={19} /> Shop Owner Dashboard
            </button>
          </nav>
        </aside>

        <main className="min-w-0 space-y-5">
          {showShopDetail ? renderShopDetail() : (
            <>
              <section className="rounded-2xl bg-gradient-to-br from-[#006d24] to-[#008100] p-5 text-white sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-100">HiveMarket shopping</p>
                <h1 className="mt-2 text-2xl font-black sm:text-3xl">{section === 'home' ? `Discover, ${user?.fullName?.split(' ')[0] || 'shopper'}` : sections.find((item) => item.id === section)?.label}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-green-50">Explore a shop catalog, find products, and keep a cart while you browse. Shop lookup currently works with a public shop link or ID.</p>
              </section>

              {(section === 'home' || section === 'shops' || section === 'search' || section === 'products') && (
                <section className="rounded-2xl border border-[var(--hive-border)] bg-white p-4 sm:p-5">
                  <h2 className="mb-3 font-bold text-[#17191c]">{section === 'search' ? 'Search shops and products' : 'Find a HiveMarket shop'}</h2>
                  <form onSubmit={(event) => void searchHiveMarket(event)} className="flex flex-col gap-2 sm:flex-row">
                    <label className="sr-only" htmlFor="discovery-search">Search HiveMarket shops and products</label>
                    <input id="discovery-search" value={discoveryQuery} onChange={(event) => setDiscoveryQuery(event.target.value)} placeholder="Search shops and products" className="min-w-0 flex-1 rounded-xl border border-[var(--hive-border)] px-4 py-3 text-sm outline-none focus:border-[#008100]" />
                    <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#008100] px-5 py-3 text-sm font-bold text-white"><Search size={16} />Search</button>
                  </form>
                  {lookup}
                  {shopError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{shopError}</p>}
                </section>
              )}

              {(section === 'home' || section === 'shops' || section === 'products' || section === 'search') && renderDiscoveryResults()}

              {section === 'cart' && (
                <section className="rounded-2xl border border-[var(--hive-border)] bg-white p-5">
                  <h2 className="text-2xl font-black text-[#17191c]">Shopping cart</h2>
                  <p className="mt-1 text-sm text-gray-600">Review products you added from the selected shop.</p>
                  {!cart.length ? <p className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">Your cart is empty. Browse a shop catalog to add products.</p> : (
                    <>
                      <ul className="mt-4 divide-y divide-gray-100">
                        {cart.map((line) => <li key={line.product.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                          <div className="min-w-0"><h3 className="font-bold text-[#17191c]">{line.product.pName}</h3><p className="text-sm text-gray-500">{formatCurrency(Number(line.product.pAmount))} each · {line.product.category}</p></div>
                          <div className="flex items-center gap-2">
                            <button type="button" aria-label={`Decrease ${line.product.pName} quantity`} onClick={() => updateCartQuantity(line.product.id, line.quantity - 1)} className="h-8 w-8 rounded-full border">−</button>
                            <span className="min-w-6 text-center text-sm font-semibold">{line.quantity}</span>
                            <button type="button" aria-label={`Increase ${line.product.pName} quantity`} onClick={() => updateCartQuantity(line.product.id, line.quantity + 1)} disabled={line.quantity >= line.product.pQuantity} className="h-8 w-8 rounded-full border disabled:opacity-40">+</button>
                            <button type="button" onClick={() => updateCartQuantity(line.product.id, 0)} className="ml-2 text-sm font-semibold text-red-700 underline">Remove</button>
                          </div>
                        </li>)}
                      </ul>
                      <p className="border-t border-gray-100 pt-4 text-right text-lg font-black">Subtotal: {formatCurrency(cartTotal)}</p>
                      <p className="mt-3 text-sm text-gray-600">Send this list to {shop ? shopName : 'the selected shop'} to ask about availability. Checkout and payment are not available on the web.</p>
                      {requestError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{requestError}</p>}
                      {requestNotice && <p role="status" className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">{requestNotice}</p>}
                      <button type="button" onClick={() => void submitShoppingRequest()} disabled={!shopId || submittingRequest} className="mt-4 rounded-lg bg-[#008100] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                        {submittingRequest ? 'Sending request…' : 'Send shopping request'}
                      </button>
                      {!shopId && <p className="mt-2 text-xs text-amber-800">Open a shop and add products from its catalog before sending a request.</p>}
                    </>
                  )}
                </section>
              )}

              {section === 'map' && (
                <>
                  {shop && <>{renderShopCard(false)}{renderShopMapPreview()}{renderShopReviews()}</>}
                  <section className="space-y-4 rounded-2xl border border-[var(--hive-border)] bg-white p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-[#17191c]">Explore shops on the map</h2>
                        <p className="mt-1 text-sm text-gray-600">Shop markers use saved coordinates. Distance is shown only when your current device location is available.</p>
                      </div>
                      <button type="button" onClick={locateUser} disabled={locating} className="rounded-lg bg-[#008100] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                        {locating ? 'Finding location…' : userLocation ? 'Refresh my location' : 'Use my location'}
                      </button>
                    </div>
                    <div className="flex gap-2" role="group" aria-label="Map or list view">
                      {(['map', 'list'] as const).map((view) => <button key={view} type="button" onClick={() => setMapViewMode(view)} aria-pressed={mapViewMode === view} className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${mapViewMode === view ? 'bg-green-50 text-[#006d24]' : 'border border-[var(--hive-border)] text-gray-600'}`}>{view} view</button>)}
                    </div>
                    {locationError && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{locationError}</p>}
                    {directoryError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{directoryError}<button type="button" onClick={() => setDirectoryRetryKey((key) => key + 1)} className="ml-2 font-semibold underline">Retry</button></div>}
                    {loadingDirectory && <p role="status" className="text-sm text-gray-600">Loading shop locations…</p>}
                    {mapViewMode === 'map' && <ShopMap shops={mapShops} userLocation={userLocation} onOpenShop={(id) => void openShop(id)} className="h-[24rem] sm:h-[30rem]" />}
                    {mapViewMode === 'map' && !loadingDirectory && !directoryError && !mapShops.some((item) => getShopLocation(item).latitude != null && getShopLocation(item).longitude != null) && (
                      <p className="text-sm text-gray-600">No shops currently have map coordinates. Their saved addresses are still shown in list view.</p>
                    )}
                    {mapViewMode === 'list' && !loadingDirectory && !directoryError && (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {directoryShops.map((item) => <ShopSummaryCard key={item.id} shop={item} onExplore={(id) => void openShop(id)} />)}
                      </div>
                    )}
                    {!loadingDirectory && !directoryError && directoryShops.length === 0 && <p className="text-sm text-gray-600">No shops are available to show.</p>}
                  </section>
                </>
              )}

              {section === 'messages' && user && <ShoppingMessagesSection user={user} />}
              {section === 'requests' && <ShoppingRequestsSection />}
              {section === 'notifications' && user?.userId && <ShoppingNotificationsSection userId={user.userId} />}
              {section === 'subscriptions' && (
                <section className="space-y-4 rounded-2xl border border-[var(--hive-border)] bg-white p-5">
                  <div><h2 className="text-xl font-bold text-[#17191c]">Your shop subscriptions</h2><p className="mt-1 text-sm text-gray-600">Followed shops are loaded from your authenticated HiveMarket account.</p></div>
                  {directoryError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{directoryError}<button type="button" onClick={() => setDirectoryRetryKey((key) => key + 1)} className="ml-2 font-semibold underline">Retry</button></div>}
                  {shopActionError && <p role="alert" className="text-sm text-red-700">{shopActionError}</p>}
                  {shopActionNotice && <p role="status" className="text-sm text-[#006d24]">{shopActionNotice}</p>}
                  {loadingDirectory ? <p role="status" className="text-sm text-gray-600">Loading subscriptions…</p>
                    : !directoryError && subscribedShops.length === 0 ? <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">You are not subscribed to any shops yet.</p>
                      : <div className="grid gap-4 sm:grid-cols-2">{subscribedShops.map((item) => (
                        <ShopSummaryCard key={item.id} shop={item} onExplore={(id) => void openShop(id)} onAction={() => void toggleSubscription(item)} actionLabel="Unsubscribe" actionBusy={busyDirectoryShopId === item.id} />
                      ))}</div>}
                </section>
              )}
              {section === 'saved' && (
                <section className="space-y-4 rounded-2xl border border-[var(--hive-border)] bg-white p-5">
                  <div><h2 className="text-xl font-bold text-[#17191c]">Saved shops</h2><p className="mt-1 text-sm text-gray-600">Your saved shop list is loaded from the authenticated account.</p></div>
                  {savedShopsError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{savedShopsError}<button type="button" onClick={() => setSavedRetryKey((key) => key + 1)} className="ml-2 font-semibold underline">Retry</button></div>}
                  {loadingSavedShops ? <p role="status" className="text-sm text-gray-600">Loading saved shops…</p>
                    : !savedShopsError && savedShops.length === 0 ? <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">No saved shops yet. Save a shop profile to find it here.</p>
                      : <div className="grid gap-4 sm:grid-cols-2">{savedShops.map((item) => (
                        <ShopSummaryCard key={item.id} shop={savedShopProfile(item, directoryShops.find((directoryShop) => directoryShop.id === item.id)?.distanceMeters)} onExplore={(id) => void openShop(id)} onAction={() => void removeSavedShopFromList(item.id)} actionLabel="Remove" actionBusy={busySavedShopId === item.id} />
                      ))}</div>}
                </section>
              )}
            </>
          )}
        </main>

        <aside className="hidden space-y-4 lg:block">
          <section className="sticky top-20 rounded-2xl border border-[var(--hive-border)] bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#17191c]">Your cart</h2>
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-[#008100]">{cartCount} items</span>
            </div>
            {cart.length ? (
              <>
                <ul className="mt-3 divide-y divide-gray-100">
                  {cart.slice(0, 3).map((line) => <li key={line.product.id} className="flex items-start justify-between gap-2 py-3 text-sm">
                    <span className="min-w-0"><span className="block truncate font-semibold">{line.product.pName}</span><span className="text-xs text-gray-500">Qty {line.quantity}</span></span>
                    <span className="shrink-0">{formatCurrency(Number(line.product.pAmount) * line.quantity)}</span>
                  </li>)}
                </ul>
                <p className="mt-2 border-t border-gray-100 pt-3 text-sm font-bold">Subtotal <span className="float-right">{formatCurrency(cartTotal)}</span></p>
                <button type="button" onClick={() => navigate('/shopping/cart')} className="mt-3 w-full rounded-lg bg-[#008100] px-3 py-2.5 text-sm font-bold text-white">Review cart</button>
              </>
            ) : <p className="mt-3 text-sm text-gray-500">Add products from a shop catalog to build your cart.</p>}
            <p className="mt-3 text-xs leading-5 text-gray-500">Cart contents are kept in this page session. Checkout and payment are not available on the web.</p>
          </section>
          <section className="rounded-2xl border border-[var(--hive-border)] bg-white p-4">
            <h2 className="font-bold text-[#17191c]">Switch workspace</h2>
            <p className="mt-1 text-sm text-gray-500">Keep the same account and session.</p>
            <button type="button" onClick={() => navigate('/shop-owner/dashboard')} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--hive-border)] px-3 py-2.5 text-sm font-semibold text-[#17191c] hover:bg-gray-50">
              <BriefcaseBusiness size={16} /> Shop Owner Dashboard
            </button>
          </section>
        </aside>
      </div>

      <nav aria-label="Mobile shopping navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--hive-border)] bg-white px-1 pb-[env(safe-area-inset-bottom)] pt-1 lg:hidden">
        {[
          { label: 'Home', path: '/shopping', icon: Store },
          { label: 'Shops', path: '/shopping/shops', icon: ShoppingBag },
          { label: 'Map', path: '/shopping/map', icon: MapPin },
          { label: 'Messages', path: '/shopping/messages', icon: MessageCircle },
          { label: 'Account', path: '/account', icon: UserRound },
        ].map((item) => {
          const Icon = item.icon;
          return <button key={item.label} type="button" onClick={() => navigate(item.path)} className="flex min-w-0 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold text-gray-600"><Icon size={19} /><span className="truncate">{item.label}</span></button>;
        })}
      </nav>

      {selectedProduct && (
        <div role="presentation" onClick={() => setSelectedProduct(null)} className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
            {selectedProduct.imageUrls?.[0] && <img src={selectedProduct.imageUrls[0]} alt="" className="max-h-80 w-full object-cover" />}
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-[#008100]">{shopName}</p>
              <h2 id="product-dialog-title" className="mt-1 text-xl font-bold text-[#17191c]">{selectedProduct.pName}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">{selectedProduct.pDetail}</p>
              <p className="mt-4 text-lg font-bold text-[#008100]">{formatCurrency(Number(selectedProduct.pAmount) || 0)}</p>
              <p className="mt-1 text-xs text-gray-500">{selectedProduct.category} · {selectedProduct.pQuantity} available</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => addToCart(selectedProduct)} disabled={selectedProduct.pQuantity <= 0} className="rounded-lg bg-[#008100] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><ShoppingCart className="mr-2 inline" size={16} />Add to cart</button>
                <ShareActions
                  url={getProductShareUrl(selectedProduct.id)}
                  title={selectedProduct.pName}
                  text={`Check out ${selectedProduct.pName}${shopName ? ` at ${shopName}` : ''} on HiveMarket`}
                />
                <button type="button" onClick={() => setSelectedProduct(null)} className="rounded-lg border border-[var(--hive-border)] px-4 py-2.5 text-sm font-semibold text-gray-700">Close</button>
              </div>
              {cartNotice && <p role="status" className="mt-3 flex items-center gap-1 text-sm text-[#006d24]"><Check size={15} />{cartNotice}</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}