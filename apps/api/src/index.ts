import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { secureHeaders } from 'hono/secure-headers';
import { contactSchema, type ContactError, type ContactResponse } from '@safwan/shared';
import { verifyTurnstile } from './turnstile';
import { sendContactEmail } from './mail';

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

app.post(
  '/contact',
  bodyLimit({ maxSize: 16 * 1024, onError: (c) => fail(c, 'invalid', 413) }),
  async (c) => {
    // Same-origin only: the form lives on the same host that forwards to this API.
    const origin = c.req.header('origin');
    if (!origin || safeHost(origin) !== new URL(c.req.url).host) return fail(c, 'forbidden', 403);

    if (!c.req.header('content-type')?.startsWith('application/json')) return fail(c, 'invalid', 415);

    const ip = c.req.header('cf-connecting-ip') ?? 'unknown';
    const { success: allowed } = await c.env.CONTACT_LIMITER.limit({ key: ip });
    if (!allowed) return fail(c, 'rate_limited', 429);

    const parsed = contactSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return fail(c, 'invalid', 400);
    const input = parsed.data;

    const human = await verifyTurnstile(c.env.TURNSTILE_SECRET, input.turnstileToken, ip);
    if (!human) return fail(c, 'captcha', 403);

    // A filled honeypot means a bot: answer as if it worked, send nothing.
    if (input.website) return c.json<ContactResponse>({ ok: true });

    const sent = await sendContactEmail(c.env, input);
    if (!sent) return fail(c, 'unavailable', 502);

    return c.json<ContactResponse>({ ok: true });
  },
);

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
