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
    }),
    stats: z.object({
      label: z.string(),
      items: z.array(z.object({ value: z.string(), label: z.string() })),
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
      timeline: z.array(z.object({ period: z.string(), org: z.string(), role: z.string() })),
      educationTitle: z.string(),
      education: z.array(
        z.object({ title: z.string(), org: z.string().optional(), date: z.string() }),
      ),
      skillsTitle: z.string(),
      skills: z.array(z.object({ category: z.string(), items: z.array(z.string()) })),
      volunteerTitle: z.string(),
      volunteer: z.string(),
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
    formspreeId: z.string(),
    cv: z.string(),
    photo: z.string(),
  }),
});

export const collections = { services, projects, site, settings };
