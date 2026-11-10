// Weekly health check of the published site (run by .github/workflows/monitor.yml).
//   1) every page listed in the live sitemap answers 200, and so do the CV files;
//   2) Lighthouse (mobile) on the home and About pages stays above the thresholds below.
// Writes an Arabic report to monitor-report.md (and the run summary); exits 1 when something needs attention.
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const SITE = (process.env.SITE || 'https://safwanalasmar.github.io').replace(/\/$/, '');
// Shared runners are slower and noisier than a real phone test, so the speed floor is deliberately loose.
const THRESHOLDS = { performance: 70, accessibility: 95, 'best-practices': 90, seo: 95 };
const LABELS = { performance: 'السرعة', accessibility: 'سهولة الوصول', 'best-practices': 'أفضل الممارسات', seo: 'الظهور في البحث' };
const problems = [];
const lines = [];

const get = async (url) => {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    return { status: res.status, text: await res.text() };
  } catch {
    return { status: 0, text: '' };
  }
};
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => SITE + new URL(m[1]).pathname);

// 1) Pages and files
const index = await get(`${SITE}/sitemap-index.xml`);
const pages = [];
if (index.status !== 200) problems.push(`خريطة الموقع لا تفتح (الحالة ${index.status || 'لا اتصال'})`);
else for (const map of locs(index.text)) pages.push(...locs((await get(map)).text));
if (index.status === 200 && pages.length === 0) problems.push('خريطة الموقع فارغة');

const files = ['/cv/Safwan-Alasmar-CV-ar.pdf', '/cv/Safwan-Alasmar-CV-en.pdf', '/robots.txt'].map((p) => SITE + p);
let ok = 0;
for (const url of [...pages, ...files]) {
  const { status } = await get(url);
  if (status === 200) ok += 1;
  else problems.push(`لا يفتح (الحالة ${status || 'لا اتصال'}): ${url}`);
}
lines.push(`- الصفحات والملفات: ${ok} من ${pages.length + files.length} تعمل.`);

// 2) Lighthouse scores
const measure = (path) => {
  const out = `lighthouse${path.replace(/\W+/g, '-')}.json`;
  execFileSync(
    'npx',
    ['-y', 'lighthouse@12', SITE + path, '--quiet', '--chrome-flags=--headless=new --no-sandbox',
      `--only-categories=${Object.keys(THRESHOLDS).join(',')}`, '--output=json', `--output-path=${out}`],
    { stdio: ['ignore', 'ignore', 'inherit'], timeout: 300_000 },
  );
  const { categories } = JSON.parse(readFileSync(out, 'utf8'));
  return Object.fromEntries(Object.keys(THRESHOLDS).map((k) => [k, Math.round((categories[k]?.score ?? 0) * 100)]));
};
const below = (scores) => Object.keys(THRESHOLDS).filter((k) => scores[k] < THRESHOLDS[k]);

for (const path of ['/', '/about/']) {
  try {
    let scores = measure(path);
    // One noisy run should not raise an alarm: measure again and keep the better result.
    if (below(scores).length) {
      const again = measure(path);
      if (below(again).length < below(scores).length) scores = again;
    }
    lines.push(`- قياس الصفحة ${path} — ${Object.keys(THRESHOLDS).map((k) => `${LABELS[k]}: ${scores[k]}`).join('، ')}`);
    for (const k of below(scores)) problems.push(`${LABELS[k]} في الصفحة ${path} = ${scores[k]} (الحد الأدنى ${THRESHOLDS[k]})`);
  } catch (error) {
    problems.push(`تعذّر قياس الصفحة ${path}: ${String(error.message || error).split('\n')[0]}`);
  }
}

const report = [
  `## فحص الموقع — ${new Date().toISOString().slice(0, 10)}`,
  '',
  `الموقع: ${SITE}`,
  '',
  ...lines,
  '',
  problems.length ? '### يحتاج نظرة' : '### كل شيء سليم',
  ...problems.map((p) => `- ${p}`),
  '',
].join('\n');
writeFileSync('monitor-report.md', report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
console.log(report);
process.exit(problems.length ? 1 : 0);
