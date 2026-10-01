import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getCollection, getEntry } from 'astro:content';

export const langs = ['ar', 'en'] as const;
export type Lang = (typeof langs)[number];

export const otherLang = (lang: Lang): Lang => (lang === 'ar' ? 'en' : 'ar');
export const dirOf = (lang: Lang) => (lang === 'ar' ? 'rtl' : 'ltr');

/** Prefixes the deploy base path (e.g. `/repo/` on GitHub Pages project sites). */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Logical path (`/services/`) → URL for a language (`/en/services/`), base included. */
export function localePath(lang: Lang, path = '/'): string {
  return url(lang === 'ar' ? path : `/en${path}`);
}

/** Values wrapped in 【】 are placeholders the site owner has not filled in yet. */
export const isPlaceholder = (value: string) => value.includes('【');

/** Tag class: Arabic tags use the body font instead of the monospace one. */
export const tagClass = (value: string) => (/\p{Script=Arabic}/u.test(value) ? 'tag tag-ar' : 'tag');

export const publicFileExists = (relPath: string) =>
  existsSync(join(process.cwd(), 'public', relPath));

export const toList = (value: string | string[] | undefined) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

export async function getSite(lang: Lang) {
  const entry = await getEntry('site', lang);
  if (!entry) throw new Error(`Missing src/content/site/${lang}.yaml`);
  return entry.data;
}

export async function getSettings() {
  const entry = await getEntry('settings', 'settings');
  if (!entry) throw new Error('Missing src/content/settings.yaml');
  return entry.data;
}

export async function getServices() {
  return (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);
}

export async function getProjects() {
  return (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
}
