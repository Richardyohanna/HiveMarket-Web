import { useEffect, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import HowItWorks from './components/HowItWorks';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import PointerExperience from './components/PointerExperience';
import { useRouter } from './lib/router';
import { RequireAdmin, RequireAuth } from './components/RouteGuards';
import LoginPage from './pages/LoginPage';
import AccountPage from './pages/AccountPage';
import PasswordChangePage from './pages/PasswordChangePage';
import DeleteAccountPage from './pages/DeleteAccountPage';
import DeleteAccountConfirmPage from './pages/DeleteAccountConfirmPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRegisterShopWizard from './pages/admin/AdminRegisterShopWizard';
import AdminShopManagementPage from './pages/admin/AdminShopManagementPage';
import ShopManagementPage from './pages/ShopManagementPage';
import ShopOwnerDashboardPage from './pages/ShopOwnerDashboardPage';
import ShoppingPage from './pages/ShoppingPage';
import ShareActions from './components/ShareActions';
import { API_BASE_URL } from './lib/config';
import { getProductShareUrl, getShopShareUrl, getShareUrl } from './utils/shareLinks';

const WEB_BASE_URL = 'https://hivemarket.ng';

function setMetaTag(property: string, content: string, isProperty = true) {
  const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    if (isProperty) tag.setAttribute('property', property);
    else tag.setAttribute('name', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function applyShareMeta(title: string, description: string, image: string, url: string, type: 'website' | 'product' | 'profile' | 'shop' = 'website') {
  document.title = title;
  setMetaTag('og:title', title);
  setMetaTag('og:description', description);
  setMetaTag('og:image', image);
  setMetaTag('og:url', url);
  setMetaTag('og:type', type);
  setMetaTag('twitter:card', 'summary_large_image', false);
  setMetaTag('twitter:title', title, false);
  setMetaTag('twitter:description', description, false);
  setMetaTag('twitter:image', image, false);
  let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.href = url;
}

type PublicShareData = {
  id?: string;
  name?: string;
  description?: string;
  image?: string;
  address?: string | null;
  canonicalUrl?: string;
  price?: number | string | null;
  discountPrice?: number | string | null;
  discountPercentage?: number | string | null;
  discountEndsAt?: string | null;
  primaryImage?: string | null;
  shopId?: string | null;
  shopName?: string | null;
  displayName?: string;
  profileImage?: string;
  bio?: string;
};

async function fetchShareData(type: 'product' | 'Shop' | 'profile', id: string): Promise<PublicShareData> {
  const response = await fetch(`${API_BASE_URL}/api/public/share/${type}/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error('Public share data unavailable');
  }
  return response.json() as Promise<PublicShareData>;
}

function getRouteInfo(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] === 'product' && segments[1]) {
    return { type: 'product', id: segments[1] };
  }
  if (segments[0] === 'Shop' && segments[1]) {
    return { type: 'Shop', id: segments[1] };
  }
  if (segments[0] === 'profile' && segments[1]) {
    return { type: 'profile', id: segments[1] };
  }
  if (segments[0] === 'login') return { type: 'login', id: null };
  if (segments[0] === 'account') return { type: 'account', id: null };
  if (segments[0] === 'shopping') {
    if (segments[1] === 'shop' && segments[2]) {
      return { type: 'shopping-shop', id: segments[2] };
    }
    return { type: 'shopping', id: null, section: segments[1] || 'home' };
  }
  if (segments[0] === 'shop-owner') {
    return { type: 'shop-owner-dashboard', id: null, section: segments[1] || 'dashboard' };
  }
  if (segments[0] === 'shop-management') return { type: 'shop-management', id: null };
  if (segments[0] === 'password-change') return { type: 'password-change', id: null };
  if ((segments[0] === 'account-deletion' || segments[0] === 'delete-account')
      && segments[1] === 'confirm') {
    return { type: 'account-deletion-confirm', id: null };
  }
  if (segments[0] === 'shop-deletion' && segments[1] === 'confirm') {
    return { type: 'shop-deletion-confirm', id: null };
  }
  if (segments[0] === 'account-deletion' || segments[0] === 'shop-deletion'
      || segments[0] === 'delete-account') {
    return { type: 'delete-account', id: null };
  }
  if (segments[0] === 'admin' && segments[1] === 'register-shop') {
    return { type: 'admin-register-shop', id: null };
  }
  if (segments[0] === 'admin' && segments[1] === 'shops' && segments[2]) {
    return { type: 'admin-shop', id: segments[2] };
  }
  if (segments[0] === 'admin') {
    return { type: 'admin', id: null, section: segments[1] || 'overview' };
  }
  return { type: 'home', id: null };
}

function SharePage({ route }: { route: { type: string; id: string | null } }) {
  const [data, setData] = useState<PublicShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedRoute, setLoadedRoute] = useState<string | null>(null);
  const routeKey = `${route.type}:${route.id || ''}`;

  useEffect(() => {
    const shareId = route.id;
    if (!shareId) return;
    const currentType = route.type as 'product' | 'Shop' | 'profile';
    let cancelled = false;
    fetchShareData(currentType, shareId)
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setError(null);
        const canonicalUrl = currentType === 'product'
          ? getProductShareUrl(shareId)
          : currentType === 'Shop'
            ? getShopShareUrl(shareId)
            : getShareUrl('profile', shareId);
        const title = currentType === 'product'
          ? `${payload.name || 'Product'} | HiveMarket`
          : currentType === 'Shop'
            ? `${payload.name || 'Shop'} | HiveMarket`
            : `${payload.displayName || 'Profile'} | HiveMarket`;
        const description = currentType === 'product'
          ? `${payload.description || 'Available on HiveMarket'} • ${payload.discountPrice ? `₦${Number(payload.discountPrice).toLocaleString()} ` : ''}${payload.shopName ? `at ${payload.shopName}` : ''}`.trim()
          : currentType === 'Shop'
            ? `${payload.description || 'Discover this shop on HiveMarket'}`
            : `${payload.bio || 'View this HiveMarket profile'}`;
        applyShareMeta(title, description, payload.primaryImage || payload.image || payload.profileImage || 'https://hivemarket.ng/logo_180x180.png', canonicalUrl, currentType === 'product' ? 'product' : currentType === 'Shop' ? 'shop' : 'profile');
      })
      .catch(() => {
        if (!cancelled) setError('This public listing is not available right now.');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setLoadedRoute(routeKey);
        }
      });
    return () => { cancelled = true; };
  }, [route.id, route.type, routeKey]);

  const title = useMemo(() => {
    if (!data) return 'HiveMarket';
    if (route.type === 'product') return data.name || 'HiveMarket Product';
    if (route.type === 'Shop') return data.name || 'HiveMarket Shop';
    return data.displayName || 'HiveMarket Profile';
  }, [data, route.type]);
  const image = data?.primaryImage || data?.image || data?.profileImage || `${WEB_BASE_URL}/logo_180x180.png`;
  const isShop = route.type === 'Shop';
  const isProduct = route.type === 'product';
  const shareUrl = route.id
    ? isProduct ? getProductShareUrl(route.id) : isShop ? getShopShareUrl(route.id) : getShareUrl('profile', route.id)
    : WEB_BASE_URL;
  const numericPrice = Number(data?.discountPrice || data?.price || 0);

  if (loading || loadedRoute !== routeKey) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-gray-600">Loading HiveMarket listing…</main>;
  }

  if (error || !data) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="text-xl font-bold text-[#17191c]">This HiveMarket listing is unavailable</h1><p className="mt-2 text-sm text-gray-600">It may have been removed or the link may be incorrect.</p><a href="/" className="mt-5 inline-block rounded-lg bg-[#008100] px-4 py-2.5 text-sm font-bold text-white">Back to HiveMarket</a></main>;
  }

  return (
    <main className="min-h-screen bg-[#f5f7f5] px-4 py-8 sm:py-14">
      <article className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[var(--hive-border)] bg-white shadow-sm">
        <img src={image} alt="" className="max-h-[28rem] w-full object-cover" />
        <div className="space-y-4 p-5 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-[#008100]">{isShop ? 'HiveMarket shop' : isProduct ? 'HiveMarket product' : 'HiveMarket profile'}</p>
          <h1 className="text-2xl font-black text-[#17191c] sm:text-3xl">{title}</h1>
          {(data.description || data.bio) && <p className="whitespace-pre-line text-base leading-7 text-gray-600">{data.description || data.bio}</p>}
          {isShop && data.address && <p className="inline-flex items-center gap-2 text-sm text-gray-600"><MapPin size={16} className="text-[#008100]" />{data.address}</p>}
          {isProduct && (
            <div className="space-y-1">
              <p className="text-xl font-black text-[#008100]">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(numericPrice)}</p>
              {data.discountPrice && data.price && Number(data.discountPrice) < Number(data.price) && <p className="text-sm text-gray-500 line-through">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(data.price))}</p>}
              {data.shopId && <a href={getShopShareUrl(data.shopId)} className="inline-block text-sm font-semibold text-[#008100] underline">From {data.shopName || 'this shop'}</a>}
            </div>
          )}
          <ShareActions
            url={shareUrl}
            title={title}
            text={isShop ? `Check out ${title} on HiveMarket` : `Check out ${title} on HiveMarket`}
          />
          <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
            {isShop && route.id && <a href={`/shopping/shop/${encodeURIComponent(route.id)}`} className="rounded-lg bg-[#008100] px-4 py-2.5 text-sm font-bold text-white">Browse shop catalog</a>}
            {isProduct && data.shopId && <a href={getShopShareUrl(data.shopId)} className="rounded-lg bg-[#008100] px-4 py-2.5 text-sm font-bold text-white">Visit {data.shopName || 'shop'}</a>}
            <a href="/hivemarket.apk" className="rounded-lg border border-[var(--hive-border)] px-4 py-2.5 text-sm font-semibold text-[#17191c]">Download app</a>
            <a href="/" className="rounded-lg border border-[var(--hive-border)] px-4 py-2.5 text-sm font-semibold text-[#17191c]">Back to HiveMarket</a>
          </div>
          {isShop && <p className="text-xs leading-5 text-gray-500">The shop profile is public. Sign in to browse the full catalog and use shopping features.</p>}
        </div>
      </article>
    </main>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PointerExperience />
      <Navbar />

      <main>
       <Hero />
       <About />
       <HowItWorks />
       <FAQ />
       <Footer />
      </main>
    </div>
  );
}

function App() {
  const { pathname } = useRouter();
  const route = getRouteInfo(pathname);

  switch (route.type) {
    case 'home':
      return <LandingPage />;
    case 'login':
      return <LoginPage />;
    case 'account':
      return (
        <RequireAuth>
          <AccountPage />
        </RequireAuth>
      );
    case 'shopping':
      return (
        <RequireAuth>
          <ShoppingPage key={route.section || 'home'} section={route.section || 'home'} />
        </RequireAuth>
      );
    case 'shopping-shop':
      return (
        <RequireAuth>
          <ShoppingPage section="shops" initialShopId={route.id || undefined} />
        </RequireAuth>
      );
    case 'shop-management':
      return (
        <RequireAuth>
          <ShopManagementPage />
        </RequireAuth>
      );
    case 'shop-owner-dashboard':
      return (
        <RequireAuth>
          <ShopOwnerDashboardPage section={route.section} />
        </RequireAuth>
      );
    case 'password-change':
      return (
        <RequireAuth>
          <PasswordChangePage />
        </RequireAuth>
      );
    case 'delete-account':
      return (
        <RequireAuth>
          <DeleteAccountPage />
        </RequireAuth>
      );
    case 'account-deletion-confirm':
    case 'shop-deletion-confirm':
      return <DeleteAccountConfirmPage />;
    case 'admin':
      return (
        <RequireAdmin>
          <AdminDashboard key={route.section} initialSection={route.section} />
        </RequireAdmin>
      );
    case 'admin-register-shop':
      return (
        <RequireAdmin>
          <AdminRegisterShopWizard />
        </RequireAdmin>
      );
    case 'admin-shop':
      return (
        <RequireAdmin>
          <AdminShopManagementPage shopId={route.id ?? ''} />
        </RequireAdmin>
      );
    default:
      return <SharePage route={route} />;
  }
}

export default App;