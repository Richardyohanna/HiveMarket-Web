import express from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 4173;
const WEB_BASE_URL = 'https://hivemarket.ng';
const API_BASE_URL = 'https://api.hivemarket.ng';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const indexHtml = readFileSync(path.join(distDir, 'index.html'), 'utf8');

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]);

const isValidHttpsUrl = (value) => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

const getPublicImageUrl = (...candidates) => {
  const image = candidates.find((candidate) => typeof candidate === 'string' && isValidHttpsUrl(candidate));
  return image || `${WEB_BASE_URL}/logo_180x180.svg`;
};

const replaceMetaTag = (html, attribute, name, content) => {
  const tag = `<meta ${attribute}="${name}" content="${escapeHtml(content)}" />`;
  const matcher = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${name}["'])[^>]*>`, 'i');
  return matcher.test(html) ? html.replace(matcher, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
};

const buildMeta = (title, description, image, url, type = 'website') => {
  let html = indexHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i, `<link rel="canonical" href="${escapeHtml(url)}" />`);
  html = replaceMetaTag(html, 'property', 'og:type', type);
  html = replaceMetaTag(html, 'property', 'og:title', title);
  html = replaceMetaTag(html, 'property', 'og:description', description);
  html = replaceMetaTag(html, 'property', 'og:url', url);
  html = replaceMetaTag(html, 'property', 'og:image', image);
  html = replaceMetaTag(html, 'name', 'twitter:card', 'summary_large_image');
  html = replaceMetaTag(html, 'name', 'twitter:title', title);
  html = replaceMetaTag(html, 'name', 'twitter:description', description);
  return replaceMetaTag(html, 'name', 'twitter:image', image);
};

app.use('/assets', express.static(path.join(distDir, 'assets')));
app.use(express.static(distDir));

app.get('/product/:id', async (req, res) => {
  const url = `${WEB_BASE_URL}/product/${req.params.id}`;
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/share/product/${encodeURIComponent(req.params.id)}`);
    if (!response.ok) throw new Error('not found');
    const data = await response.json();
    const title = `${data.name || 'Product'} | HiveMarket`;
    const description = `${data.description || 'Available on HiveMarket'} • ${data.discountPrice ? `₦${Number(data.discountPrice).toLocaleString()}` : `₦${Number(data.price || 0).toLocaleString()}`} ${data.shopName ? `at ${data.shopName}` : ''}`;
    res.send(buildMeta(title, description, getPublicImageUrl(data.primaryImage, data.image), url, 'product'));
  } catch {
    res.send(buildMeta('HiveMarket Product | HiveMarket', 'Discover this product on HiveMarket', getPublicImageUrl(), url, 'product'));
  }
});

app.get('/Shop/:id', async (req, res) => {
  const url = `${WEB_BASE_URL}/Shop/${req.params.id}`;
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/share/Shop/${encodeURIComponent(req.params.id)}`);
    if (!response.ok) throw new Error('not found');
    const data = await response.json();
    const title = `${data.name || 'Shop'} | HiveMarket`;
    const description = data.description || 'Discover this shop on HiveMarket';
    res.send(buildMeta(title, description, getPublicImageUrl(data.image), url, 'shop'));
  } catch {
    res.send(buildMeta('HiveMarket Shop | HiveMarket', 'Discover this shop on HiveMarket', getPublicImageUrl(), url, 'shop'));
  }
});

app.get('/profile/:id', async (req, res) => {
  const url = `${WEB_BASE_URL}/profile/${req.params.id}`;
  try {
    const response = await fetch(`${API_BASE_URL}/api/public/share/profile/${encodeURIComponent(req.params.id)}`);
    if (!response.ok) throw new Error('not found');
    const data = await response.json();
    const title = `${data.displayName || 'Profile'} | HiveMarket`;
    const description = data.bio || 'View this HiveMarket profile';
    res.send(buildMeta(title, description, getPublicImageUrl(data.profileImage), url, 'profile'));
  } catch {
    res.send(buildMeta('HiveMarket Profile | HiveMarket', 'View this HiveMarket profile', getPublicImageUrl(), url, 'profile'));
  }
});

app.use((req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HiveMarket web preview server running on port ${PORT}`);
});
