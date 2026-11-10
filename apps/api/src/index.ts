import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { secureHeaders } from 'hono/secure-headers';
import { contactSchema, projectRequestSchema, type ContactError, type ContactResponse } from '@safwan/shared';
import { verifyTurnstile } from './turnstile';
import { sendContactEmail, sendProjectRequestEmail } from './mail';

export type Env = {
  TURNSTILE_SECRET: string;
  RESEND_API_KEY: string;
  MAIL_TO: string;
  MAIL_FROM: string;
  CONTACT_LIMITER: RateLimit;
};

type AppContext = Context<{ Bindings: Env }>;

const fail = (c: AppContext, error: ContactError, status: 400 | 403 | 413 | 415 | 429 | 502) =>
  c.json<ContactResponse>({ ok: false, error }, status);

const app = new Hono<{ Bindings: Env }>().basePath('/api');

app.use(secureHeaders({ xFrameOptions: 'DENY', crossOriginResourcePolicy: 'same-origin' }));
app.use(async (c, next) => {
  await next();
  c.header('Cache-Control', 'no-store');
});

app.get('/health', (c) => c.json({ ok: true }));

/**
 * Shared guard for public form endpoints: same origin, JSON only, per-IP rate limit,
 * schema validation, server-side Turnstile check and honeypot. Returns the parsed input or a response.
 */
async function guard<T extends { turnstileToken: string; website?: string | undefined }>(
  c: AppContext,
  schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } },
): Promise<{ input: T } | { response: Response }> {
  // Same-origin only: the form lives on the same host that forwards to this API.
  const origin = c.req.header('origin');
  if (!origin || safeHost(origin) !== new URL(c.req.url).host) return { response: fail(c, 'forbidden', 403) };

  if (!c.req.header('content-type')?.startsWith('application/json')) return { response: fail(c, 'invalid', 415) };

  const ip = c.req.header('cf-connecting-ip') ?? 'unknown';
  const { success: allowed } = await c.env.CONTACT_LIMITER.limit({ key: ip });
  if (!allowed) return { response: fail(c, 'rate_limited', 429) };

  const parsed = schema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return { response: fail(c, 'invalid', 400) };

  const human = await verifyTurnstile(c.env.TURNSTILE_SECRET, parsed.data.turnstileToken, ip);
  if (!human) return { response: fail(c, 'captcha', 403) };

  // A filled honeypot means a bot: answer as if it worked, send nothing.
  if (parsed.data.website) return { response: c.json<ContactResponse>({ ok: true }) };

  return { input: parsed.data };
}

const limitBody = (kb: number) => bodyLimit({ maxSize: kb * 1024, onError: (c) => fail(c, 'invalid', 413) });

app.post('/contact', limitBody(16), async (c) => {
  const result = await guard(c, contactSchema);
  if ('response' in result) return result.response;
  if (!(await sendContactEmail(c.env, result.input))) return fail(c, 'unavailable', 502);
  return c.json<ContactResponse>({ ok: true });
});

app.post('/project-request', limitBody(24), async (c) => {
  const result = await guard(c, projectRequestSchema);
  if ('response' in result) return result.response;
  if (!(await sendProjectRequestEmail(c.env, result.input))) return fail(c, 'unavailable', 502);
  return c.json<ContactResponse>({ ok: true });
});

app.notFound((c) => c.json({ ok: false, error: 'not_found' }, 404));
app.onError((err, c) => {
  console.error('unhandled', err.name);
  return c.json<ContactResponse>({ ok: false, error: 'unavailable' }, 500);
});

function safeHost(value: string): string | null {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

export default app;
