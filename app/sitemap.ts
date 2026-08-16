import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/urls';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();
  const routes = ['', '/services', '/packages', '/hair-removal', '/about', '/gallery', '/faq', '/contact', '/book'];
  return routes.map((r) => ({
    url: `${base}${r}`,
    changeFrequency: 'monthly',
    priority: r === '' ? 1 : 0.7,
  }));
}
