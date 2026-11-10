// العقد المشترك بين الواجهة والخادم: حدود الحقول وقواعد التحقق ورموز الأخطاء.
// The contract shared by the web app and the API: field limits, validation and error codes.
import { z } from 'zod';

export const CONTACT_PATH = '/api/contact';

export const CONTACT_LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 254 },
  service: { max: 64 },
  message: { min: 10, max: 5000 },
} as const;

export const contactSchema = z.object({
  name: z.string().trim().min(CONTACT_LIMITS.name.min).max(CONTACT_LIMITS.name.max),
  email: z.email().max(CONTACT_LIMITS.email.max),
  // Service ids are file names from content/services, plus "other".
  service: z.string().max(CONTACT_LIMITS.service.max).regex(/^[a-z0-9-]+$/),
  message: z.string().trim().min(CONTACT_LIMITS.message.min).max(CONTACT_LIMITS.message.max),
  lang: z.enum(['ar', 'en']),
  turnstileToken: z.string().min(1).max(2048),
  // Honeypot: hidden from people, often filled by bots.
  website: z.string().max(200).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const CONTACT_ERRORS = ['invalid', 'captcha', 'rate_limited', 'forbidden', 'unavailable'] as const;
export type ContactError = (typeof CONTACT_ERRORS)[number];

export type ContactResponse = { ok: true } | { ok: false; error: ContactError };
export * from './request';
