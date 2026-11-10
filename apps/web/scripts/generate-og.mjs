// Builds the site and renders link-preview cards (1200×630) to public/og/*.png.
// Run after changing page titles, descriptions or projects:  npm run og  (then commit the images).
import { execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
execSync('npx astro build', { cwd: root, stdio: 'inherit' });

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try {
    const body = await readFile(join(dist, path));
    res.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(4398);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto('http://localhost:4398/og-cards/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const cards = await page.locator('[data-og]').all();
for (const card of cards) {
  const file = await card.getAttribute('data-og');
  await card.screenshot({ path: join(root, 'public/og', `${file}.png`) });
}
console.log(`wrote ${cards.length} cards to public/og/`);
await browser.close();
server.close();
