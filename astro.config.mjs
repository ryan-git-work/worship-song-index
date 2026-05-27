// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://worshipsongindex.com',
  output: 'static',
  build: {
    format: 'directory'
  },
  integrations: [
    sitemap({
      serialize(item) {
        const url = item.url;

        if (url.includes('/worship-team-devotionals/')) {
          const parts = url.replace('https://worshipsongindex.com/worship-team-devotionals/', '').split('/').filter(Boolean);
          if (parts.length === 2) {
            return { ...item, lastmod: '2026-03-20', changefreq: 'monthly', priority: 0.8 };
          }
          if (parts.length === 1) {
            return { ...item, lastmod: '2026-03-20', changefreq: 'monthly', priority: 0.7 };
          }
          return { ...item, lastmod: '2026-03-20', changefreq: 'monthly', priority: 0.7 };
        }

        if (url.includes('/songs/')) {
          return { ...item, lastmod: '2026-03-03', changefreq: 'monthly', priority: 0.7 };
        }

        if (url.includes('/browse/')) {
          return { ...item, lastmod: '2026-03-03', changefreq: 'weekly', priority: 0.6 };
        }

        return { ...item, lastmod: '2026-03-03', changefreq: 'weekly', priority: 0.9 };
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
