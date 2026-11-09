// Builds the site, prints the CV pages to public/cv/*.pdf (Arabic and English).
// Run after changing experience, education or skills:  npm run cv  (then commit the PDFs).
import { execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
execSync('npx astro build', { cwd: root, stdio: 'inherit', env: { ...process.env, SITE_URL: 'https://safwanalasmar.github.io' } });

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.woff': 'font/woff' };
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
}).listen(4399);

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [path, file] of [['/cv-print/', 'Safwan-Alasmar-CV-ar.pdf'], ['/en/cv-print/', 'Safwan-Alasmar-CV-en.pdf']]) {
  await page.goto(`http://localhost:4399${path}`, { waitUntil: 'networkidle' });
  await page.pdf({ path: join(root, 'public/cv', file), format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log('wrote public/cv/' + file);
}
await browser.close();
server.close();
