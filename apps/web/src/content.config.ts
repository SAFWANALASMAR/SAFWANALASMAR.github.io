import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const textOrList = z.union([z.string(), z.array(z.string())]);

const serviceText = z.object({
  title: z.string(),
  audience: z.string(),
  summary: z.string(),
  includes: z.array(z.string()),
});

const services = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/services' }),
  schema: z.object({
    order: z.number(),
    icon: z.enum(['web', 'document', 'archive', 'nonprofit', 'analysis']),
    ar: serviceText,
    en: serviceText,
  }),
});

const projectText = z.object({
  title: z.string(),
  summary: z.string(),
  org: z.string().optional(),
  challenge: textOrList.optional(),
  solution: textOrList.optional(),
  role: textOrList.optional(),
  tools: z.array(z.string()).optional(),
  result: textOrList.optional(),
  availability: z.string().optional(),
});

export const projectTypes = [
  'web-system',
  'automation',
  'web-app',
  'digital-transformation',
  'business-analysis',
] as const;

const projects = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/projects' }),
  schema: z.object({
    order: z.number(),
    featured: z.boolean().default(false),
    year: z.number(),
    type: z.enum(projectTypes),
    status: z.enum(['in-progress']).optional(),
    tags: z.array(z.string()),
    link: z.url().optional(),
    ar: projectText,
    en: projectText,
  }),
});

const pageMeta = z.object({ title: z.string(), description: z.string() });

const site = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/site' }),
  schema: z.object({
    meta: z.object({
      siteName: z.string(),
      pages: z.object({
        home: pageMeta,
        services: pageMeta,
        projects: pageMeta,
        about: pageMeta,
        contact: pageMeta,
        notFound: pageMeta,
      }),
    }),
    nav: z.object({
      home: z.string(),
      services: z.string(),
      projects: z.string(),
      about: z.string(),
      contact: z.string(),
      switchLang: z.string(),
      switchLangLabel: z.string(),
      themeToggle: z.string(),
      menu: z.string(),
      skip: z.string(),
      primary: z.string(),
    }),
    hero: z.object({
      name: z.string(),
      title: z.string(),
      value: z.string(),
      support: z.string(),
      ctaPrimary: z.string(),
      ctaSecondary: z.string(),
      codeLabel: z.string(),
      rotatingLead: z.string(),
      rotating: z.array(z.string()),
      chips: z
        .array(z.object({ icon: z.enum(['star', 'users', 'archive', 'document']), value: z.string(), label: z.string() }))
        .max(2),
      stackLabel: z.string(),
    }),
    stats: z.object({
      label: z.string(),
      items: z.array(
        z.object({
          value: z.string(),
          label: z.string(),
          icon: z.enum(['archive', 'document', 'users', 'star', 'web', 'shield', 'files', 'folder', 'award']).optional(),
        }),
      ),
    }),
    home: z.object({
      servicesTitle: z.string(),
      servicesIntro: z.string(),
      servicesMore: z.string(),
      projectsTitle: z.string(),
      projectsIntro: z.string(),
      projectsMore: z.string(),
      processTitle: z.string(),
      process: z.array(z.object({ title: z.string(), text: z.string() })),
      cta: z.string(),
      ctaButton: z.string(),
    }),
    services: z.object({
      title: z.string(),
      intro: z.string(),
      audienceLabel: z.string(),
      includesLabel: z.string(),
      request: z.string(),
      pricing: z.string(),
    }),
    projects: z.object({
      title: z.string(),
      intro: z.string(),
      filterLabel: z.string(),
      all: z.string(),
      viewCase: z.string(),
      inProgress: z.string(),
      back: z.string(),
      types: z.record(z.enum(projectTypes), z.string()),
      labels: z.object({
        year: z.string(),
        type: z.string(),
        org: z.string(),
        tags: z.string(),
        challenge: z.string(),
        solution: z.string(),
        role: z.string(),
        tools: z.string(),
        result: z.string(),
        availability: z.string(),
        link: z.string(),
      }),
    }),
    about: z.object({
      title: z.string(),
      photoAlt: z.string(),
      initials: z.string(),
      bio: z.string(),
      timelineTitle: z.string(),
      timeline: z.array(
        z.object({
          period: z.string(),
          org: z.string(),
          role: z.string(),
          icon: z.enum(['briefcase', 'web', 'teach', 'analysis', 'nonprofit', 'cart', 'send', 'book', 'utensils', 'cake', 'car', 'code']).optional(),
          points: z.array(z.string()).optional(),
          link: z.url().optional(),
          linkLabel: z.string().optional(),
        }),
      ),
      educationTitle: z.string(),
      education: z.array(
        z.object({
          title: z.string(),
          org: z.string().optional(),
          date: z.string(),
          icon: z.enum(['cap', 'briefcase', 'sparkles', 'cart', 'chart', 'star', 'book', 'award', 'code']).optional(),
          image: z.string().optional(),
        }),
      ),
      marketing: z.object({
        title: z.string(),
        intro: z.string(),
        projects: z.array(
          z.object({
            icon: z.enum(['cart', 'chart', 'sparkles', 'send', 'heart']),
            name: z.string(),
            period: z.string(),
            role: z.string(),
            points: z.array(z.string()),
          }),
        ),
        certsTitle: z.string(),
        certs: z.array(z.object({ title: z.string(), org: z.string(), date: z.string(), note: z.string().optional() })),
      }),
      showMore: z.string(),
      certificateView: z.string(),
      certificateClose: z.string(),
      reviews: z.object({
        title: z.string(),
        intro: z.string(),
        stats: z.array(z.object({ value: z.string(), label: z.string() })),
        items: z.array(z.object({ name: z.string(), date: z.string(), text: z.string() })),
        more: z.string(),
        link: z.url(),
        note: z.string(),
      }),
      skillsTitle: z.string(),
      skills: z.array(z.object({ category: z.string(), items: z.array(z.string()) })),
      volunteerTitle: z.string(),
      volunteer: z.array(z.object({ icon: z.enum(['mosque', 'droplet', 'heart']), title: z.string(), period: z.string() })),
      languagesTitle: z.string(),
      languages: z.array(z.object({ name: z.string(), level: z.string() })),
    }),
    contact: z.object({
      title: z.string(),
      intro: z.string(),
      formTitle: z.string(),
      name: z.string(),
      email: z.string(),
      service: z.string(),
      servicePlaceholder: z.string(),
      serviceOther: z.string(),
      message: z.string(),
      submit: z.string(),
      formMailto: z.string(),
      formNotReady: z.string(),
      extraServices: z.array(z.object({ id: z.string().regex(/^[a-z0-9-]+$/), label: z.string() })),
      status: z.object({
        sending: z.string(),
        sent: z.string(),
        invalid: z.string(),
        captcha: z.string(),
        rate_limited: z.string(),
        forbidden: z.string(),
        unavailable: z.string(),
      }),
      directTitle: z.string(),
      emailLabel: z.string(),
      linkedinLabel: z.string(),
      githubLabel: z.string(),
      cv: z.string(),
      cvPending: z.string(),
      subject: z.string(),
    }),
    footer: z.object({ tagline: z.string(), rights: z.string() }),
    notFound: z.object({ title: z.string(), text: z.string(), back: z.string() }),
  }),
});

const settings = defineCollection({
  loader: glob({ pattern: 'settings.yaml', base: './src/content' }),
  schema: z.object({
    email: z.string(),
    linkedin: z.string(),
    github: z.string(),
    turnstileSiteKey: z.string(),
    cv: z.object({ ar: z.string(), en: z.string() }),
    photo: z.string(),
  }),
});

export const collections = { services, projects, site, settings };
