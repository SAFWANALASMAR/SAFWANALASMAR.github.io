import { formatProjectRequest, REQUEST_CATEGORIES, type ContactInput, type ProjectRequest } from '@safwan/shared';
import type { Env } from './index';

const RESEND_URL = 'https://api.resend.com/emails';

/** Sends the message to the site owner as plain text (no HTML, so nothing to inject). */
export async function sendContactEmail(env: Env, input: ContactInput): Promise<boolean> {
  const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();
  const text = [
    `الاسم / Name: ${oneLine(input.name)}`,
    `البريد / Email: ${input.email}`,
    `الخدمة / Service: ${input.service}`,
    `اللغة / Language: ${input.lang}`,
    '',
    input.message,
  ].join('\n');

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [env.MAIL_TO],
        reply_to: input.email,
        subject: oneLine(`رسالة من الموقع — ${input.name} (${input.service})`).slice(0, 200),
        text,
      }),
    });
    if (!res.ok) console.error('mail send failed', res.status);
    return res.ok;
  } catch {
    console.error('mail send failed', 'network');
    return false;
  }
}

/** Sends a project request as plain text, with Arabic labels, reply-to set to the client. */
export async function sendProjectRequestEmail(env: Env, input: ProjectRequest): Promise<boolean> {
  const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();
  const category = REQUEST_CATEGORIES.find((c) => c.id === input.category);
  const { turnstileToken: _t, website: _w, ...request } = input;
  return sendEmail(env, {
    subject: oneLine(`طلب مشروع — ${category?.ar ?? input.category} — ${input.name}`).slice(0, 200),
    text: formatProjectRequest(request, 'ar'),
    replyTo: input.email,
  });
}

async function sendEmail(env: Env, mail: { subject: string; text: string; replyTo: string }): Promise<boolean> {
  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_FROM, to: [env.MAIL_TO], reply_to: mail.replyTo, subject: mail.subject, text: mail.text }),
    });
    if (!res.ok) console.error('mail send failed', res.status);
    return res.ok;
  } catch {
    console.error('mail send failed', 'network');
    return false;
  }
}
