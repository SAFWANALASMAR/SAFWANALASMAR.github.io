import { expect, test, type Page } from '@playwright/test';

const TURNSTILE = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

/** Fake Turnstile: adds the hidden token field the real widget would add. */
async function stubTurnstile(page: Page, token: string | null = 'test-token') {
  const body = `
    window.turnstile = { reset() {} };
    ${token ? `document.querySelectorAll('.cf-turnstile').forEach((el) => {
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = 'cf-turnstile-response'; input.value = ${JSON.stringify(token)};
      el.appendChild(input);
    });` : ''}`;
  await page.route(TURNSTILE, (route) =>
    route.fulfill({ contentType: 'application/javascript', body }),
  );
}

function watchCsp(page: Page) {
  const violations: string[] = [];
  page.on('console', (msg) => {
    if (/Content Security Policy|Refused to/i.test(msg.text())) violations.push(msg.text());
  });
  return violations;
}

async function fillForm(page: Page) {
  await page.getByLabel('الاسم').fill('زائر تجريبي');
  await page.getByLabel('البريد الإلكتروني').fill('visitor@example.com');
  await page.locator('#service').selectOption({ index: 1 });
  await page.getByLabel('الرسالة').fill('أرغب في أتمتة تقارير الجهات المانحة.');
}

test('Arabic home page is right-to-left with no CSP violations', async ({ page }) => {
  const violations = watchCsp(page);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(violations).toEqual([]);
});

test('pages carry the security headers', async ({ request }) => {
  const res = await request.get('/contact/');
  const headers = res.headers();
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['strict-transport-security']).toContain('max-age=');
  expect(headers['x-content-type-options']).toBe('nosniff');
});

test('the API is reached through the site and refuses other origins', async ({ request }) => {
  expect(await (await request.get('/api/health')).json()).toEqual({ ok: true });
  const res = await request.post('/api/contact', {
    headers: { origin: 'https://evil.example' },
    data: {},
  });
  expect(res.status()).toBe(403);
});

for (const path of ['/', '/en/']) {
  test(`skills strip never shows an empty gap on ${path}`, async ({ page }) => {
    await page.goto(path);
    for (let i = 0; i < 4; i++) {
      await page.waitForTimeout(500);
      const gap = await page.evaluate(() => {
        const strip = document.querySelector('.marquee')!.getBoundingClientRect();
        const items = [...document.querySelectorAll('.marquee .tag-icon')].map((e) =>
          e.getBoundingClientRect(),
        );
        const right = Math.max(...items.map((r) => r.right));
        const left = Math.min(...items.map((r) => r.left));
        return Math.max(0, strip.right - right) + Math.max(0, left - strip.left);
      });
      expect(gap).toBe(0);
    }
  });
}

test('every icon except the menu buttons is animated', async ({ page }) => {
  await page.goto('/about/');
  const still = await page.evaluate(() =>
    [...document.querySelectorAll('svg.ico')]
      .filter((i) => getComputedStyle(i).animationName === 'none')
      .filter((i) => !i.classList.contains('ico-still')).length,
  );
  expect(still).toBe(0);
});

test('English home page is left-to-right', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});

for (const path of ['/', '/about/', '/contact/', '/en/']) {
  test(`no horizontal scroll on ${path}`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('contact form sends JSON to the API and confirms', async ({ page }) => {
  const violations = watchCsp(page);
  await stubTurnstile(page);
  let sent: Record<string, unknown> | undefined;
  await page.route('**/api/contact', async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ json: { ok: true } });
  });

  await page.goto('/contact/');
  await fillForm(page);
  await page.getByRole('button', { name: 'إرسال' }).click();

  await expect(page.getByRole('status')).toContainText('وصلت رسالتك');
  expect(sent).toMatchObject({
    name: 'زائر تجريبي',
    email: 'visitor@example.com',
    lang: 'ar',
    turnstileToken: 'test-token',
    website: '',
  });
  await expect(page.getByLabel('الاسم')).toHaveValue('');
  expect(violations).toEqual([]);
});

test('contact form explains rate limiting', async ({ page }) => {
  await stubTurnstile(page);
  await page.route('**/api/contact', (route) =>
    route.fulfill({ status: 429, json: { ok: false, error: 'rate_limited' } }),
  );
  await page.goto('/contact/');
  await fillForm(page);
  await page.getByRole('button', { name: 'إرسال' }).click();
  await expect(page.getByRole('status')).toContainText('انتظر دقيقة');
});

test('contact form asks for verification before sending', async ({ page }) => {
  await stubTurnstile(page, null);
  let called = false;
  await page.route('**/api/contact', (route) => {
    called = true;
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto('/contact/');
  await fillForm(page);
  await page.getByRole('button', { name: 'إرسال' }).click();
  await expect(page.getByRole('status')).toContainText('خانة التحقق');
  expect(called).toBe(false);
});

test.describe('request a project', () => {
  test('walks through four steps and sends one request for two services', async ({ page }) => {
    const violations = watchCsp(page);
    await stubTurnstile(page);
    let sent: Record<string, unknown> | undefined;
    await page.route('**/api/project-request', async (route) => {
      sent = route.request().postDataJSON();
      await route.fulfill({ json: { ok: true } });
    });

    await page.goto('/request/');
    // Software is chosen by default; add marketing as a second service.
    await page.locator('label.req-card', { hasText: 'التسويق الرقمي' }).click();
    // Each chosen service needs at least one type before moving on.
    await page.getByRole('button', { name: 'التالي' }).click();
    await expect(page.getByRole('status')).toContainText('في كل خدمة');
    await page.locator('label.req-chip', { hasText: 'إدارة حسابات التواصل' }).click();
    await page.locator('label.req-chip', { hasText: 'متجر إلكتروني' }).first().click();
    await page.getByRole('button', { name: 'التالي' }).click();

    // Step 2 refuses to continue without a description.
    await page.getByRole('button', { name: 'التالي' }).click();
    await expect(page.locator('#req-desc')).toBeVisible();
    await page.locator('#req-desc').fill('إدارة حسابات الجمعية على إنستقرام وإكس مع خطة شهرية.');
    await page.locator('#req-link').fill('https://drive.google.com/file/d/abc');
    await page.getByRole('button', { name: 'التالي' }).click();

    // Needs of both services are offered together.
    await page.locator('label.req-chip', { hasText: 'إنستقرام' }).click();
    await page.locator('label.req-chip', { hasText: 'لوحة تحكم وإدارة' }).click();
    await page.locator('label.req-chip', { hasText: 'خلال شهر' }).click();
    await page.getByRole('button', { name: 'التالي' }).click();

    await page.locator('#req-name').fill('عميل تجريبي');
    await page.locator('#req-email').fill('client@example.com');
    // WhatsApp needs a phone number.
    await page.locator('label.req-chip:has(input[name="contactMethod"][value="whatsapp"])').click();
    await page.getByRole('button', { name: 'إرسال الطلب' }).click();
    expect(sent).toBeUndefined();
    await page.locator('#req-phone').fill('+966 500000000');
    await page.getByRole('button', { name: 'إرسال الطلب' }).click();

    await expect(page.getByRole('heading', { name: 'وصل طلبك' })).toBeVisible();
    expect(sent).toMatchObject({
      categories: ['software', 'marketing'],
      types: ['software:website', 'software:store', 'marketing:social-accounts'],
      stage: 'partial',
      features: ['software:dashboard', 'marketing:instagram'],
      timeline: 'month',
      budget: 'unsure',
      contactMethod: 'whatsapp',
      phone: '+966 500000000',
      link: 'https://drive.google.com/file/d/abc',
      lang: 'ar',
      turnstileToken: 'test-token',
    });
    expect(violations).toEqual([]);
  });

  test('preselects the request type from the services page', async ({ page }) => {
    await page.goto('/request/?service=document-automation');
    await expect(page.locator('input[value="software:automation"]')).toBeChecked();
    await expect(page.locator('input[name="type"]:checked')).toHaveCount(1);
  });

  test('refuses to continue with no service chosen', async ({ page }) => {
    await page.goto('/request/');
    await page.locator('label.req-card', { hasText: 'برمجة وتطوير' }).click();
    await page.getByRole('button', { name: 'التالي' }).click();
    await expect(page.getByRole('status')).toContainText('خدمة واحدة على الأقل');
  });

  test('the request API refuses other origins', async ({ request }) => {
    const res = await request.post('/api/project-request', { headers: { origin: 'https://evil.example' }, data: {} });
    expect(res.status()).toBe(403);
  });
});

// The request entry must be reachable at every width, including phones in "desktop site" mode (~980px).
for (const width of [390, 800, 980, 1100, 1366]) {
  test(`request button is visible at ${width}px`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    await page.goto('/');
    const entry = page.locator('.request-cta:visible, .request-fab:visible');
    await expect(entry).toHaveCount(1);
    await entry.click();
    await expect(page).toHaveURL(/\/request\/$/);
    await expect(page.locator('.request-fab')).toHaveCount(0);
    await page.close();
  });
}
