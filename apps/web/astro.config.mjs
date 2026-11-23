// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import { load as loadYaml } from "js-yaml";

// Hosts the Google tag needs, allowed only once an ID is set in settings.yaml (googleTag).
const settings = /** @type {any} */ (
  loadYaml(
    readFileSync(
      new URL("./src/content/settings.yaml", import.meta.url),
      "utf8",
    ),
  )
);
const tagOn = Boolean(settings.googleTag?.ga4 || settings.googleTag?.ads);
const g = (/** @type {string} */ hosts) => (tagOn ? " " + hosts : "");

// SITE_URL و BASE_PATH يضبطهما سكربت النشر (scripts/deploy.mjs).
// SITE_URL and BASE_PATH are set by the deploy script (scripts/deploy.mjs).
const site = process.env.SITE_URL || "http://localhost:4321";
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  site,
  base,
  trailingSlash: "ignore",
  // Small stylesheet: inlining it removes a render-blocking request (better mobile LCP).
  build: { inlineStylesheets: "always" },
  // Start loading a page as soon as its link is hovered or touched: navigation feels instant.
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  // Content-Security-Policy as a <meta> tag on every page; Astro hashes its own inline scripts and styles.
  security: {
    csp: {
      algorithm: "SHA-256",
      directives: [
        "default-src 'self'",
        `img-src 'self' data:${g("https://*.google-analytics.com https://*.googletagmanager.com https://googleads.g.doubleclick.net https://www.google.com https://www.google.com.sa https://www.google.ae")}`,
        "font-src 'self' data:",
        `connect-src 'self'${process.env.PUBLIC_API_BASE ? " " + new URL(process.env.PUBLIC_API_BASE).origin : ""}${g("https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.google.com https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com")}`,
        "form-action 'self'",
        // Cloudflare Turnstile (contact form bot check) runs in its own frame.
        `frame-src https://challenges.cloudflare.com${g("https://td.doubleclick.net https://www.googletagmanager.com")}`,
        "base-uri 'self'",
        "object-src 'none'",
        "upgrade-insecure-requests",
      ],
      scriptDirective: {
        resources: [
          "'self'",
          "https://challenges.cloudflare.com",
          ...(tagOn
            ? [
                "https://*.googletagmanager.com",
                "https://www.googleadservices.com",
                "https://googleads.g.doubleclick.net",
                "https://www.google.com",
              ]
            : []),
        ],
      },
    },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: "ar", locales: { ar: "ar", en: "en" } },
      filter: (page) =>
        !page.includes("/404") &&
        !page.includes("/cv-print") &&
        !page.includes("/og-cards"),
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
