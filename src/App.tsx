import { useEffect, useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import HowItWorks from './components/HowItWorks';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import PointerExperience from './components/PointerExperience';

const WEB_BASE_URL = 'https://hivemarket.ng';
const API_BASE_URL = 'https://api.hivemarket.ng';

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

async function fetchShareData(type: 'product' | 'Shop' | 'profile', id: string) {
  const response = await fetch(`${API_BASE_URL}/api/public/share/${type}/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error('Public share data unavailable');
  }
  return response.json();
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
  return { type: 'home', id: null };
}

function SharePage({ route }: { route: { type: string; id: string | null } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!route.id) return;
    const currentType = route.type as 'product' | 'Shop' | 'profile';
    setLoading(true);
    fetchShareData(currentType, route.id)
      .then((payload) => {
        setData(payload);
        setError(null);
        const canonicalUrl = `${WEB_BASE_URL}/${currentType === 'product' ? 'product' : currentType === 'Shop' ? 'Shop' : 'profile'}/${route.id}`;
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
        setError('This public listing is not available right now.');
      })
      .finally(() => setLoading(false));
  }, [route.id, route.type]);

  const title = useMemo(() => {
    if (!data) return 'HiveMarket';
    if (route.type === 'product') return data.name || 'HiveMarket Product';
    if (route.type === 'Shop') return data.name || 'HiveMarket Shop';
    return data.displayName || 'HiveMarket Profile';
  }, [data, route.type]);

  if (loading) {
    return <div style={{ padding: 32, fontFamily: 'system-ui' }}>Loading HiveMarket preview…</div>;
  }

  if (error || !data) {
    return <div style={{ padding: 32, fontFamily: 'system-ui' }}>This page is unavailable.</div>;
  }

  return (
    <div style={{ maxWidth: 760, margin: '48px auto', padding: 24, fontFamily: 'system-ui' }}>
      <img src={data.primaryImage || data.image || data.profileImage || 'https://hivemarket.ng/logo_180x180.png'} alt={title} style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 18, marginBottom: 24 }} />
      <h1 style={{ marginBottom: 12, fontSize: 32 }}>{title}</h1>
      <p style={{ color: '#333', fontSize: 18, marginBottom: 12 }}>{route.type === 'product' ? data.description : route.type === 'Shop' ? data.description : data.bio}</p>
      {route.type === 'product' && (
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
          {data.discountPrice ? `₦${Number(data.discountPrice).toLocaleString()}` : `₦${Number(data.price || 0).toLocaleString()}`}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
        <a href={`${WEB_BASE_URL}/${route.type === 'product' ? 'product' : route.type === 'Shop' ? 'Shop' : 'profile'}/${route.id}`} style={{ background: '#008100', color: 'white', padding: '12px 18px', borderRadius: 999, textDecoration: 'none', fontWeight: 700 }}>Open in app</a>
        <a href="/" style={{ background: '#f2f2f2', color: '#111', padding: '12px 18px', borderRadius: 999, textDecoration: 'none', fontWeight: 700 }}>Back to HiveMarket</a>
      </div>
    </div>
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
  const route = getRouteInfo(window.location.pathname);

  if (route.type === 'home') {
    return <LandingPage />;
  }

  return <SharePage route={route} />;
}

export default App;