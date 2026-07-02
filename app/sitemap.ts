import type { MetadataRoute } from 'next';

const BASE = 'https://nommar.gr';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/services', '/packages', '/about', '/contact', '/book'];
  return routes.map((r) => ({
    url: `${BASE}${r}`,
    changeFrequency: 'monthly',
    priority: r === '' ? 1 : 0.7,
  }));
}
