import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import app, { type Env } from '../src/index';

const ORIGIN = 'https://site.example';

const valid = {
  name: 'صفوان',
  email: 'visitor@example.com',
  service: 'web-systems',
  message: 'أرغب في نظام لأرشفة المعاملات.',
  lang: 'ar',
  turnstileToken: 'token',
};

let allowRate = true;
let turnstile = { success: true, action: 'contact' };
let resendStatus = 200;
let fetchMock: ReturnType<typeof vi.fn>;

const env = (): Env => ({
  TURNSTILE_SECRET: 'secret',
  RESEND_API_KEY: 're_key',
  MAIL_TO: 'owner@example.com',
  MAIL_FROM: 'Site <onboarding@resend.dev>',
  CONTACT_LIMITER: { limit: async () => ({ success: allowRate }) } as RateLimit,
});

const post = (body: unknown, headers: Record<string, string> = {}) =>
  app.request(
    `${ORIGIN}/api/contact`,
    {
      method: 'POST',
      headers: {
        origin: ORIGIN,
        'content-type': 'application/json',
        'cf-connecting-ip': '203.0.113.7',
        ...headers,
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    },
    env(),
  );

const resendCalls = () =>
  fetchMock.mock.calls.filter(([url]) => String(url).startsWith('https://api.resend.com'));

beforeEach(() => {
  allowRate = true;
  turnstile = { success: true, action: 'contact' };
  resendStatus = 200;
  fetchMock = vi.fn(async (url: string) =>
    String(url).includes('turnstile')
      ? Response.json(turnstile)
      : new Response('{}', { status: resendStatus }),
  );
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => vi.unstubAllGlobals());

describe('POST /api/contact', () => {
  it('sends a plain-text email with reply-to set to the visitor', async () => {
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const [[, init]] = resendCalls() as [[string, RequestInit]];
    const payload = JSON.parse(String(init.body));
    expect(payload.to).toEqual(['owner@example.com']);
    expect(payload.reply_to).toBe('visitor@example.com');
    expect(payload.text).toContain('أرغب في نظام');
    expect(payload).not.toHaveProperty('html');
  });

  it('rejects requests from another origin', async () => {
    const res = await post(valid, { origin: 'https://evil.example' });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ ok: false, error: 'forbidden' });
  });

  it('rejects requests with no origin', async () => {
    const res = await app.request(`${ORIGIN}/api/contact`, { method: 'POST', body: '{}' }, env());
    expect(res.status).toBe(403);
  });

  it('rejects non-JSON bodies', async () => {
    const res = await post('name=x', { 'content-type': 'application/x-www-form-urlencoded' });
    expect(res.status).toBe(415);
  });

  it('rejects invalid fields', async () => {
    const res = await post({ ...valid, email: 'not-an-email', message: 'short' });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: 'invalid' });
  });

  it('rejects malformed JSON', async () => {
    const res = await post('{not json');
    expect(res.status).toBe(400);
  });

  it('rejects oversized bodies', async () => {
    const res = await post({ ...valid, message: 'x'.repeat(20_000) });
    expect(res.status).toBe(413);
  });

  it('limits repeated requests', async () => {
    allowRate = false;
    const res = await post(valid);
    expect(res.status).toBe(429);
    expect(resendCalls()).toHaveLength(0);
  });

  it('rejects a failed Turnstile check', async () => {
    turnstile = { success: false, action: 'contact' };
    const res = await post(valid);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ ok: false, error: 'captcha' });
    expect(resendCalls()).toHaveLength(0);
  });

  it('rejects a Turnstile token issued for another action', async () => {
    turnstile = { success: true, action: 'login' };
    expect((await post(valid)).status).toBe(403);
  });

  it('pretends success for bots that fill the honeypot, without sending', async () => {
    const res = await post({ ...valid, website: 'http://spam.example' });
    expect(res.status).toBe(200);
    expect(resendCalls()).toHaveLength(0);
  });

  it('strips line breaks from the subject', async () => {
    await post({ ...valid, name: 'Ali\r\nBcc: x@evil.example' });
    const [[, init]] = resendCalls() as [[string, RequestInit]];
    expect(JSON.parse(String(init.body)).subject).not.toMatch(/[\r\n]/);
  });

  it('reports the mail provider being down', async () => {
    resendStatus = 500;
    const res = await post(valid);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ ok: false, error: 'unavailable' });
  });

  it('never caches responses and sends security headers', async () => {
    const res = await post(valid);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
  });
});

describe('other routes', () => {
  it('answers health checks', async () => {
    const res = await app.request('/api/health', {}, env());
    expect(await res.json()).toEqual({ ok: true });
  });

  it('returns JSON 404 for unknown paths', async () => {
    const res = await app.request('/api/nope', {}, env());
    expect(res.status).toBe(404);
  });
});

describe('POST /api/project-request', () => {
  const request = {
    categories: ['software', 'marketing'],
    types: ['software:system', 'marketing:social-accounts'],
    stage: 'partial',
    description: 'نظام لإدارة طلبات المستفيدين مع لوحة تحكم.',
    link: 'https://drive.google.com/file/d/abc',
    features: ['software:accounts', 'software:dashboard', 'marketing:instagram'],
    budget: '15-40k',
    timeline: 'quarter',
    name: 'عميل',
    org: 'جمعية',
    email: 'client@example.com',
    phone: '',
    contactMethod: 'email',
    lang: 'ar',
    turnstileToken: 'token',
  };
  const send = (body: unknown, headers: Record<string, string> = {}) =>
    app.request(
      `${ORIGIN}/api/project-request`,
      {
        method: 'POST',
        headers: { origin: ORIGIN, 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.7', ...headers },
        body: JSON.stringify(body),
      },
      env(),
    );

  it('emails a readable Arabic summary', async () => {
    const res = await send(request);
    expect(res.status).toBe(200);
    const [[, init]] = resendCalls() as [[string, RequestInit]];
    const payload = JSON.parse(String(init.body));
    expect(payload.subject).toContain('برمجة وتطوير');
    expect(payload.subject).toContain('التسويق الرقمي');
    expect(payload.text).toContain('إدارة حسابات التواصل');
    expect(payload.text).toContain('إنستقرام');
    expect(payload.text).toContain('نظام إداري أو بوابة خدمات');
    expect(payload.text).toContain('لوحة تحكم وإدارة');
    expect(payload.text).toContain('15,000 – 40,000 ريال');
    expect(payload.reply_to).toBe('client@example.com');
  });

  it('rejects a type from a service that was not chosen', async () => {
    expect((await send({ ...request, types: [...request.types, 'media:writing'] })).status).toBe(400);
  });

  it('requires at least one type for every chosen service', async () => {
    expect((await send({ ...request, types: ['software:system'] })).status).toBe(400);
  });

  it('rejects unknown or foreign features', async () => {
    expect((await send({ ...request, features: ['software:hack'] })).status).toBe(400);
    expect((await send({ ...request, features: ['media:video'] })).status).toBe(400);
  });

  it('rejects an empty service list', async () => {
    expect((await send({ ...request, categories: [], types: [] })).status).toBe(400);
  });

  it('rejects non-https links', async () => {
    expect((await send({ ...request, link: 'javascript:alert(1)' })).status).toBe(400);
    expect((await send({ ...request, link: 'http://example.com' })).status).toBe(400);
  });

  it('requires a phone number when WhatsApp is preferred', async () => {
    expect((await send({ ...request, contactMethod: 'whatsapp' })).status).toBe(400);
    expect((await send({ ...request, contactMethod: 'whatsapp', phone: '+966 500000000' })).status).toBe(200);
  });

  it('keeps the same protections as the contact form', async () => {
    expect((await send(request, { origin: 'https://evil.example' })).status).toBe(403);
    allowRate = false;
    expect((await send(request)).status).toBe(429);
  });
});
