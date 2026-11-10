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

const CATEGORY_IDS = ids(REQUEST_CATEGORIES);
const pair = z.string().max(60).regex(/^[a-z]+:[a-z0-9-]+$/);

export const projectRequestSchema = z
  .object({
    categories: z.array(z.enum(CATEGORY_IDS)).min(1).max(CATEGORY_IDS.length),
    types: z.array(pair).min(1).max(30),
    stage: z.enum(ids(REQUEST_STAGES)),
    description: z.string().trim().min(10).max(5000),
    link: z.union([z.literal(''), z.url({ protocol: /^https$/ }).max(500)]).optional(),
    features: z.array(pair).max(40).default([]),
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
    if (new Set(data.categories).size !== data.categories.length) {
      ctx.addIssue({ code: 'custom', path: ['categories'], message: 'duplicate service' });
    }
    // Every type and feature must belong to one of the chosen services, and each service needs a type.
    const chosen = REQUEST_CATEGORIES.filter((c) => data.categories.includes(c.id));
    const known = (field: 'types' | 'features', value: string) => {
      const [cat, id] = value.split(':');
      const category = chosen.find((c) => c.id === cat);
      const list: readonly Option[] | undefined = category?.[field];
      return !!list?.some((o) => o.id === id);
    };
    if (data.types.some((v) => !known('types', v))) ctx.addIssue({ code: 'custom', path: ['types'], message: 'unknown type' });
    if (data.features.some((v) => !known('features', v))) {
      ctx.addIssue({ code: 'custom', path: ['features'], message: 'unknown feature' });
    }
    for (const c of chosen) {
      if (!data.types.some((v) => v.startsWith(`${c.id}:`))) {
        ctx.addIssue({ code: 'custom', path: ['types'], message: `no type for ${c.id}` });
      }
    }
    if (data.contactMethod === 'whatsapp' && !data.phone) {
      ctx.addIssue({ code: 'custom', path: ['phone'], message: 'phone required for WhatsApp' });
    }
  });

export type ProjectRequest = z.infer<typeof projectRequestSchema>;

