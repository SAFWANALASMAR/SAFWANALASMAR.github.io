// Builds the site and publishes dist/ to the `gh-pages` branch of the `origin` remote.
// Usage:  npm run deploy
// Override the URL for a custom domain:  SITE_URL=https://example.com npm run deploy
import { execSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const run = (cmd, cwd = root, env = {}) =>
  execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });

const git = (args) => execSync(`git ${args}`, { cwd: root }).toString().trim();
const remote = git('remote get-url origin');
const author = `-c user.name="${git('config user.name')}" -c user.email="${git('config user.email')}"`;
const site = process.env.SITE_URL || 'https://safwanalasmar.github.io';
const base = process.env.BASE_PATH || '/';

run('npm run build', root, { SITE_URL: site, BASE_PATH: base });

// Without this file GitHub Pages runs Jekyll, which drops the `_astro/` folder.
writeFileSync(join(dist, '.nojekyll'), '');

rmSync(join(dist, '.git'), { recursive: true, force: true });
run('git init -q -b gh-pages', dist);
run('git config core.autocrlf false', dist);
run('git add -A', dist);
run(`git ${author} commit -q -m "Deploy ${new Date().toISOString()}"`, dist);
run(`git push -f "${remote}" gh-pages`, dist);
rmSync(join(dist, '.git'), { recursive: true, force: true });

console.log(`\nPublished to ${site}${base}`);
