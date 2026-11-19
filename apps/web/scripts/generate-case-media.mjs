// Builds a case-study PDF and a short video for every project, in Arabic and English,
// from the project files in src/content/projects. Output: public/cases/<id>-<lang>.pdf|.mp4
// Optional screenshots: scripts/case-shots/<id>/*.png (shown in the PDF and the video).
// Run:  npm run cases   (needs ffmpeg). Draft fields written as 【…】 are left out.
import { readFile, readdir, mkdir, rm, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { load } from 'js-yaml';
const yaml = { load };
import { chromium } from '@playwright/test';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'public/cases');
const tmp = join(root, '.case-tmp');
const only = process.argv.slice(2);
const font = (f) => pathToFileURL(join(root, '../../node_modules/@fontsource/ibm-plex-sans-arabic/files', f)).href;
const site = {
  ar: yaml.load(await readFile(join(root, 'src/content/site/ar.yaml'), 'utf8')),
  en: yaml.load(await readFile(join(root, 'src/content/site/en.yaml'), 'utf8')),
};
const W = 1280, H = 720, FPS = 30;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const draft = (s) => typeof s === 'string' && s.includes('【');
const list = (v) => (v == null ? [] : (Array.isArray(v) ? v : [v]).filter((x) => !draft(x)));

const css = `
@font-face{font-family:P;font-weight:400;src:url(${font('ibm-plex-sans-arabic-arabic-400-normal.woff2')})}
@font-face{font-family:P;font-weight:700;src:url(${font('ibm-plex-sans-arabic-arabic-700-normal.woff2')})}
@font-face{font-family:P;font-weight:400;src:url(${font('ibm-plex-sans-arabic-latin-400-normal.woff2')});unicode-range:U+0000-00FF,U+2013-2014,U+2019-201D}
@font-face{font-family:P;font-weight:700;src:url(${font('ibm-plex-sans-arabic-latin-700-normal.woff2')});unicode-range:U+0000-00FF,U+2013-2014,U+2019-201D}
:root{--bg:#f5fafc;--text:#10232a;--muted:#46606a;--accent:#0b7285;--soft:#e1f3f6;--gold:#8a6a0c;--goldsoft:#fbf4dc;--border:#d6e6ec}
*{box-sizing:border-box}html,body{margin:0;font-family:P,system-ui,sans-serif;color:var(--text)}
.chip{display:inline-block;border:1px solid var(--border);background:#fff;border-radius:999px;padding:.15em .8em;margin:0 0 .4em .4em;font-size:.8em}
[dir=ltr] .chip{margin:0 .4em .4em 0}
.badge{display:inline-block;background:var(--soft);color:var(--accent);border-radius:999px;padding:.2em .9em;font-weight:700;font-size:.8em}
.badge.gold{background:var(--goldsoft);color:var(--gold)}
`;

// ---------- PDF ----------
function pdfHtml(p, lang) {
  const d = p.data[lang], L = site[lang].projects.labels, t = site[lang].projects;
  const sec = (label, v) => {
    const items = list(v);
    if (!items.length) return '';
    const body = items.length > 1 ? `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p>${esc(items[0])}</p>`;
    return `<section><h2>${esc(label)}</h2>${body}</section>`;
  };
  const shots = p.shots.map((s) => `<figure><img src="${s}"></figure>`).join('');
  const tools = list(d.tools);
  return `<!doctype html><html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><style>${css}
@page{size:A4;margin:16mm 16mm 18mm}
body{font-size:10.5pt;line-height:1.7;background:#fff}
header{border-bottom:3px solid var(--accent);padding-bottom:10px;margin-bottom:14px}
.kicker{color:var(--accent);font-weight:700;font-size:9pt;letter-spacing:.02em}
h1{font-size:21pt;line-height:1.35;margin:4px 0 6px}
.meta{color:var(--muted);font-size:9.5pt}.meta b{color:var(--text)}
.summary{background:var(--soft);border-radius:10px;padding:10px 14px;margin:12px 0}
h2{font-size:12.5pt;color:var(--accent);margin:14px 0 4px;break-after:avoid}
section{break-inside:avoid}ul{margin:0;padding-inline-start:1.2em}li{margin:2px 0}p{margin:0}
figure{margin:12px 0;break-inside:avoid}img{width:100%;border:1px solid var(--border);border-radius:8px}
footer{margin-top:18px;border-top:1px solid var(--border);padding-top:8px;font-size:8.5pt;color:var(--muted);display:flex;justify-content:space-between;break-inside:avoid}
</style></head><body>
<header><div class="kicker">${esc(lang === 'ar' ? 'دراسة حالة' : 'Case study')} · ${esc(t.types[p.type])} · ${p.year}${p.status ? ` · ${esc(t.inProgress)}` : ''}</div>
<h1>${esc(d.title)}</h1>
<div class="meta">${d.org ? `<b>${esc(L.org)}:</b> ${esc(d.org)} · ` : ''}<b>${esc(L.tags)}:</b> ${p.tags.map(esc).join(' · ')}${p.link ? ` · <b>${esc(L.link)}:</b> ${esc(p.link.replace(/^https?:\/\//, '').replace(/\/$/, ''))}` : ''}</div></header>
<div class="summary">${esc(d.summary)}</div>
${sec(L.challenge, d.challenge)}${sec(L.solution, d.solution)}${shots}${sec(L.role, d.role)}
${tools.length ? `<section><h2>${esc(L.tools)}</h2><div>${tools.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div></section>` : ''}
${sec(L.result, d.result)}
<footer><span>${esc(lang === 'ar' ? 'صفوان الأسمر' : 'Safwan Alasmar')}</span><span dir="ltr">safwanalasmar.github.io${lang === 'en' ? '/en' : ''}/projects/${p.id}/</span></footer>
</body></html>`;
}

// ---------- video scenes ----------
function frame(lang, inner) {
  return `<!doctype html><html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><style>${css}
body{width:${W}px;height:${H}px;overflow:hidden;background:var(--bg);position:relative}
body::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgb(11 114 133/.06) 1px,transparent 1px),linear-gradient(90deg,rgb(11 114 133/.06) 1px,transparent 1px);background-size:40px 40px}
.wrap{position:absolute;inset:64px 88px 84px;display:flex;flex-direction:column;justify-content:center}
.foot{position:absolute;bottom:30px;inset-inline:88px;display:flex;justify-content:space-between;color:var(--muted);font-size:18px}
.bar{position:absolute;top:0;inset-inline:0;height:8px;background:var(--accent)}
h1{font-size:54px;line-height:1.3;margin:18px 0 14px}
h2{font-size:40px;color:var(--accent);margin:0 0 22px;display:flex;align-items:center;gap:16px}
h2 i{display:inline-block;width:12px;height:40px;border-radius:6px;background:var(--accent)}
.lead{font-size:28px;line-height:1.65;color:var(--muted)}
.big{font-size:32px;line-height:1.7}
ul{list-style:none;margin:0;padding:0}li{font-size:27px;line-height:1.55;margin:0 0 16px;padding-inline-start:40px;position:relative}
li::before{content:"";position:absolute;inset-inline-start:0;top:.55em;width:16px;height:16px;border-radius:4px;background:var(--accent)}
li.off{opacity:0}.chips .chip{font-size:24px}
.card{background:#fff;border:1px solid var(--border);border-radius:20px;padding:30px 36px;box-shadow:0 16px 36px -16px rgb(10 40 50/.24)}
.shot{position:absolute;inset:70px 88px 90px;display:flex;align-items:center;justify-content:center}
.shot img{max-width:100%;max-height:100%;border-radius:14px;border:1px solid var(--border);box-shadow:0 20px 40px -18px rgb(10 40 50/.35)}
</style></head><body><div class="bar"></div>${inner}</body></html>`;
}

function scenes(p, lang) {
  const d = p.data[lang], L = site[lang].projects.labels, t = site[lang].projects;
  const foot = `<div class="foot"><span>${esc(lang === 'ar' ? 'صفوان الأسمر' : 'Safwan Alasmar')}</span><span>${esc(d.title)}</span></div>`;
  const s = [];
  s.push({ dur: 5, html: frame(lang, `<div class="wrap"><div><span class="badge">${esc(t.types[p.type])} · ${p.year}</span>${p.status ? ` <span class="badge gold">${esc(t.inProgress)}</span>` : ''}</div><h1>${esc(d.title)}</h1>${d.org ? `<div class="lead" style="font-weight:700;color:var(--text)">${esc(d.org)}</div>` : ''}<div class="lead">${esc(d.summary)}</div></div>`) });
  const textScene = (label, v) => {
    const items = list(v);
    if (!items.length) return;
    if (items.length === 1) { s.push({ dur: 6, html: frame(lang, `<div class="wrap"><h2><i></i>${esc(label)}</h2><div class="card big">${esc(items[0])}</div></div>${foot}`) }); return; }
    const shown = items.slice(0, 6);
    for (let k = 1; k <= shown.length; k++) {
      const lis = shown.map((x, j) => `<li class="${j < k ? '' : 'off'}">${esc(x)}</li>`).join('');
      s.push({ fadeIn: k === 1, fadeOut: k === shown.length, dur: k === shown.length ? 3.5 : 2.4, html: frame(lang, `<div class="wrap"><h2><i></i>${esc(label)}</h2><ul>${lis}</ul></div>${foot}`) });
    }
  };
  textScene(L.challenge, d.challenge);
  textScene(L.solution, d.solution);
  for (const shot of p.shots) s.push({ dur: 5, html: frame(lang, `<div class="shot"><img src="${shot}"></div>${foot}`) });
  textScene(L.role, d.role);
  const tools = list(d.tools), result = list(d.result);
  if (tools.length || result.length) {
    s.push({ dur: 6, html: frame(lang, `<div class="wrap">${tools.length ? `<h2><i></i>${esc(L.tools)}</h2><div class="chips" style="margin-bottom:30px">${tools.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : ''}${result.length ? `<h2><i></i>${esc(L.result)}</h2><div class="card big">${result.map(esc).join('<br>')}</div>` : ''}</div>${foot}`) });
  }
  s.push({ dur: 4, html: frame(lang, `<div class="wrap" style="align-items:center;text-align:center"><h1 style="margin:0">${esc(lang === 'ar' ? 'صفوان الأسمر' : 'Safwan Alasmar')}</h1><div class="lead">${esc(site[lang].hero?.title ?? '')}</div><div class="badge" style="font-size:26px;margin-top:22px" dir="ltr">safwanalasmar.github.io${lang === 'en' ? '/en' : ''}/projects/${p.id}/</div></div>`) });
  return s;
}

// ---------- run ----------
await mkdir(out, { recursive: true });
await rm(tmp, { recursive: true, force: true });
await mkdir(tmp, { recursive: true });
const dir = join(root, 'src/content/projects');
const files = (await readdir(dir)).filter((f) => f.endsWith('.yaml'));
const browser = await chromium.launch();
for (const f of files) {
  const id = f.replace(/\.yaml$/, '');
  if (only.length && !only.includes(id)) continue;
  const p = yaml.load(await readFile(join(dir, f), 'utf8'));
  p.id = id;
  p.data = { ar: p.ar, en: p.en };
  const shotDir = join(root, 'scripts/case-shots', id);
  p.shots = existsSync(shotDir) ? (await readdir(shotDir)).filter((x) => /\.(png|jpe?g|webp)$/i.test(x)).sort().map((x) => join(shotDir, x)) : [];
  if (!p.shots.length && p.image) p.shots = [join(root, 'public', p.image)];
  const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
  p.shots = await Promise.all(p.shots.map(async (x) => `data:${mime[x.split('.').pop().toLowerCase()]};base64,${(await readFile(x)).toString('base64')}`));
  for (const lang of ['ar', 'en']) {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    // PDF
    await page.setContent(pdfHtml(p, lang), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: join(out, `${id}-${lang}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true });
    // Video: one encoded file per scene, then join
    const parts = [];
    const sc = scenes(p, lang);
    for (let i = 0; i < sc.length; i++) {
      await page.setContent(sc[i].html, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const png = join(tmp, `${id}-${lang}-${i}.png`), seg = join(tmp, `${id}-${lang}-${i}.mp4`);
      await page.screenshot({ path: png });
      const d = sc[i].dur, fo = Math.max(0, d - 0.35).toFixed(2);
      const fades = [sc[i].fadeIn !== false && 'fade=t=in:st=0:d=0.35:color=0xf5fafc', sc[i].fadeOut !== false && `fade=t=out:st=${fo}:d=0.35:color=0xf5fafc`].filter(Boolean);
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', png, '-vf',
        ['format=yuv420p', 'loop=-1:1', `trim=duration=${d}`, ...fades].join(','),
        '-c:v', 'libx264', '-crf', '24', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', String(FPS), seg]);
      parts.push(seg);
      if (i === 0) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-q:v', '4', join(out, `${id}-${lang}.jpg`)]);
    }
    const listFile = join(tmp, `${id}-${lang}.txt`);
    await writeFile(listFile, parts.map((x) => `file '${x}'`).join('\n'));
    const tmpOut = join(tmp, `${id}-${lang}-final.mp4`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', '-movflags', '+faststart', tmpOut]);
    await rename(tmpOut, join(out, `${id}-${lang}.mp4`));
    await page.close();
    console.log('wrote', `${id}-${lang}.pdf`, `${id}-${lang}.mp4`);
  }
}
await browser.close();
await rm(tmp, { recursive: true, force: true });
