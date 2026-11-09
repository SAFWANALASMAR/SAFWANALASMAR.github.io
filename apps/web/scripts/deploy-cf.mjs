// Builds the site for its real address and deploys it to Cloudflare Workers.
// Usage:  SITE_URL=https://safwan-web.<subdomain>.workers.dev npm run deploy:web
// Deploy the API first (npm run deploy:api): the web Worker binds to it by name.
import { execSync } from 'node:child_process';

const site = process.env.SITE_URL;
if (!site?.startsWith('https://')) {
  console.error('SITE_URL is required, e.g. SITE_URL=https://safwan-web.example.workers.dev');
  process.exit(1);
}

const run = (cmd) => execSync(cmd, { stdio: 'inherit', env: { ...process.env, SITE_URL: site } });
run('astro check');
run('astro build');
run('wrangler deploy');
