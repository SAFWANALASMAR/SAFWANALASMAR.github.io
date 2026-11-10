// Server-side validation for the project request form. Options and formatting live in request-options.ts.
import { z } from 'zod';
import {
  REQUEST_BUDGETS,
  REQUEST_CATEGORIES,
  REQUEST_CONTACT_METHODS,
  REQUEST_STAGES,
  REQUEST_TIMELINES,
  type Option,
} from './request-options';

export * from './request-options';

const ids = <T extends readonly { id: string }[]>(list: T) => list.map((o) => o.id) as [T[number]['id'], ...T[number]['id'][]];

export const projectRequestSchema = z
  .object({
    category: z.enum(ids(REQUEST_CATEGORIES)),
    type: z.string().max(40),
    stage: z.enum(ids(REQUEST_STAGES)),
    description: z.string().trim().min(10).max(5000),
    link: z.union([z.literal(''), z.url({ protocol: /^https$/ }).max(500)]).optional(),
    features: z.array(z.string().max(40)).max(20).default([]),
    budget: z.enum(ids(REQUEST_BUDGETS)),
    timeline: z.enum(ids(REQUEST_TIMELINES)),
    name: z.string().trim().min(2).max(100),
    org: z.string().trim().max(120).optional(),
    email: z.email().max(254),
    phone: z.union([z.literal(''), z.string().regex(/^\+?[0-9 ]{8,16}$/)]).optional(),
    contactMethod: z.enum(ids(REQUEST_CONTACT_METHODS)),
    lang: z.enum(['ar', 'en']),
    turnstileToken: z.string().min(1).max(2048),
    website: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    const category = REQUEST_CATEGORIES.find((c) => c.id === data.category)!;
    const types: readonly Option[] = category.types;
    const features: readonly Option[] = category.features;
    if (!types.some((t) => t.id === data.type)) {
      ctx.addIssue({ code: 'custom', path: ['type'], message: 'unknown type' });
    }
    const allowed = new Set<string>(features.map((f) => f.id));
    if (data.features.some((f) => !allowed.has(f))) {
      ctx.addIssue({ code: 'custom', path: ['features'], message: 'unknown feature' });
    }
    if (data.contactMethod === 'whatsapp' && !data.phone) {
      ctx.addIssue({ code: 'custom', path: ['phone'], message: 'phone required for WhatsApp' });
    }
  });

export type ProjectRequest = z.infer<typeof projectRequestSchema>;

