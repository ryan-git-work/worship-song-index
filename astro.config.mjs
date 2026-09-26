// @ts-check
import fs from 'node:fs';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

const catalogIntegrity = JSON.parse(
  fs.readFileSync(new URL('./src/data/catalogIntegrity.json', import.meta.url), 'utf8')
);
// Static hosting cannot send 301s, so retired song slugs (songRedirects.json)
// are emitted as Astro redirect pages: a small HTML file at the old URL with a
// canonical link and an immediate meta refresh to the canonical song. Added
// 2026-09-26 so the 27 slugs retired by 1b6fa7e / 08-30 do not become 404s.
const songRedirects = JSON.parse(
  fs.readFileSync(new URL('./src/data/songRedirects.json', import.meta.url), 'utf8')
);
const songRedirectRoutes = Object.fromEntries(
  Object.entries(songRedirects).map(([from, to]) => [`/songs/${from}`, `/songs/${to}/`])
);
const sitemapLastmod = JSON.parse(
  fs.readFileSync(new URL('./src/data/sitemapLastmod.json', import.meta.url), 'utf8')
);
const sitemapExcludedSongSlugs = new Set([
  ...catalogIntegrity.deleted,
  ...catalogIntegrity.quarantined,
  'grande-y-fuerte-miel-san-marcos',
]);

// https://astro.build/config
export default defineConfig({
  redirects: songRedirectRoutes,
  site: 'https://worshipsongindex.com',
  output: 'static',
  build: {
    format: 'directory'
  },
  integrations: [
    sitemap({
      filter(page) {
        const songMatch = page.match(/^https:\/\/worshipsongindex\.com\/songs\/([^/]+)\/$/);
        if (songMatch && sitemapExcludedSongSlugs.has(songMatch[1])) return false;
        if (songMatch && Object.hasOwn(songRedirects, songMatch[1])) return false;
        return true;
      },
      serialize(item) {
        const url = item.url;
        const pathname = new URL(url).pathname;
        const prefix = Object.keys(sitemapLastmod.prefixes).find((candidate) => pathname.startsWith(candidate));
        const lastmod = sitemapLastmod.routes[pathname]
          ?? (prefix ? sitemapLastmod.prefixes[prefix] : sitemapLastmod.default);

        if (url.includes('/worship-team-devotionals/')) {
          const parts = url.replace('https://worshipsongindex.com/worship-team-devotionals/', '').split('/').filter(Boolean);
          return { ...item, lastmod, changefreq: 'monthly', priority: parts.length === 2 ? 0.8 : 0.7 };
        }

        if (url.includes('/songs/')) return { ...item, lastmod, changefreq: 'monthly', priority: 0.7 };
        if (url.includes('/browse/')) return { ...item, lastmod, changefreq: 'weekly', priority: 0.6 };
        return { ...item, lastmod, changefreq: 'weekly', priority: 0.9 };
      }
    }),
    mdx()
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: ['**/.local/**'],
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true
  }
});
