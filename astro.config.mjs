// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// SITE_URL و BASE_PATH يضبطهما سير عمل GitHub Pages تلقائياً عند النشر.
// SITE_URL and BASE_PATH are set automatically by the GitHub Pages workflow.
const site = process.env.SITE_URL || 'http://localhost:4321';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  // Small stylesheet: inlining it removes a render-blocking request (better mobile LCP).
  build: { inlineStylesheets: 'always' },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'ar', locales: { ar: 'ar', en: 'en' } },
      filter: (page) => !page.includes('/404'),
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
