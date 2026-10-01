// Generates the Open Graph images (public/og/{ar,en}.png) and PNG icons from public/favicon.svg.
// Run after changing the name, title or value line:  npm run images
// Needs Chrome or Edge installed. Set CHROME_PATH if it isn't found automatically.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { load as loadYaml } from 'js-yaml';

const root = resolve(import.meta.dirname, '..');
const fontUrl = (p) => pathToFileURL(join(root, 'node_modules', p)).href;

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chrome = chromeCandidates.find((p) => existsSync(p));
if (!chrome) throw new Error('Chrome/Edge not found — set CHROME_PATH.');

const fonts = `
@font-face { font-family: Plex; font-weight: 500; src: url(${fontUrl('@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-500-normal.woff2')}); }
@font-face { font-family: Plex; font-weight: 700; src: url(${fontUrl('@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-700-normal.woff2')}); }
@font-face { font-family: Inter; font-weight: 100 900; src: url(${fontUrl('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')}); }
@font-face { font-family: Mono; src: url(${fontUrl('@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2')}); }`;

function ogHtml(lang) {
  const t = loadYaml(readFileSync(join(root, `src/content/site/${lang}.yaml`), 'utf8'));
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const font = lang === 'ar' ? 'Plex, Inter' : 'Inter, Plex';
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><style>
${fonts}
* { margin: 0; box-sizing: border-box; }
html, body { width: 1200px; height: 630px; overflow: hidden; }
body { font-family: ${font}; background: #fbfcfb; color: #15201b; position: relative; }
.grid { position: absolute; inset: 0;
  background-image: linear-gradient(rgb(31 107 78 / .08) 1px, transparent 1px), linear-gradient(90deg, rgb(31 107 78 / .08) 1px, transparent 1px);
  background-size: 40px 40px; }
.bar { position: absolute; inset-block: 0; inset-inline-start: 0; width: 18px; background: #1f6b4e; }
.wrap { position: relative; padding: 80px 96px; height: 100%; display: flex; flex-direction: column; justify-content: center; gap: 22px; }
.logo { display: inline-grid; place-items: center; width: 84px; height: 84px; border-radius: 20px; background: #1f6b4e; color: #fff; font: 32px Mono; direction: ltr; }
h1 { font-size: 84px; font-weight: 700; line-height: 1.15; }
.title { font-size: 38px; font-weight: 500; color: #1f6b4e; }
.value { font-size: 30px; font-weight: 500; color: #4a5a53; max-width: 960px; line-height: 1.6; }
</style></head><body><div class="grid"></div><div class="bar"></div><div class="wrap">
<div class="logo">&lt;/&gt;</div>
<h1>${t.hero.name}</h1>
<div class="title">${t.hero.title}</div>
<div class="value">${t.hero.value}</div>
</div></body></html>`;
}

const tmp = join(tmpdir(), 'og-gen');
mkdirSync(tmp, { recursive: true });
mkdirSync(join(root, 'public/og'), { recursive: true });

for (const lang of ['ar', 'en']) {
  const htmlPath = join(tmp, `${lang}.html`);
  writeFileSync(htmlPath, ogHtml(lang));
  const out = join(root, `public/og/${lang}.png`);
  execFileSync(chrome, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--allow-file-access-from-files',
    '--force-device-scale-factor=1',
    '--virtual-time-budget=3000',
    '--window-size=1200,630',
    `--screenshot=${out}`,
    pathToFileURL(htmlPath).href,
  ]);
  console.log('wrote', out);
}
rmSync(tmp, { recursive: true, force: true });

const svg = readFileSync(join(root, 'public/favicon.svg'));
await sharp(svg, { density: 300 }).resize(32, 32).png().toFile(join(root, 'public/favicon-32.png'));
await sharp(svg, { density: 300 }).resize(180, 180).png().toFile(join(root, 'public/apple-touch-icon.png'));
console.log('wrote favicon-32.png, apple-touch-icon.png');
