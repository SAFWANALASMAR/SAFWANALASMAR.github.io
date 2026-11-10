// No dependencies: safe to import in browser code.
// خيارات نموذج «اطلب مشروعك»: مصدر واحد للواجهة (العرض باللغتين) وللخادم (التحقق وصياغة البريد).
// Options for the project request form: one source for the web app (labels) and the API (validation, email).

type Label = { ar: string; en: string };
export type Option = Label & { id: string };

export const REQUEST_PATH = '/api/project-request';

export const REQUEST_CATEGORIES = [
  {
    id: 'software',
    icon: 'code',
    ar: 'برمجة وتطوير',
    en: 'Software development',
    descAr: 'مواقع، تطبيقات، أنظمة إدارية، متاجر، أتمتة',
    descEn: 'Websites, apps, management systems, stores, automation',
    types: [
      { id: 'website', ar: 'موقع إلكتروني', en: 'Website' },
      { id: 'mobile-app', ar: 'تطبيق جوال', en: 'Mobile app' },
      { id: 'system', ar: 'نظام إداري أو بوابة خدمات', en: 'Management system or service portal' },
      { id: 'store', ar: 'متجر إلكتروني', en: 'Online store' },
      { id: 'automation', ar: 'أتمتة تقارير ومستندات', en: 'Report and document automation' },
      { id: 'other', ar: 'غير ذلك', en: 'Other' },
    ],
    features: [
      { id: 'accounts', ar: 'تسجيل دخول وحسابات مستخدمين', en: 'User accounts and sign-in' },
      { id: 'dashboard', ar: 'لوحة تحكم وإدارة', en: 'Admin dashboard' },
      { id: 'roles', ar: 'صلاحيات متدرجة', en: 'Role-based permissions' },
      { id: 'payments', ar: 'دفع إلكتروني', en: 'Online payments' },
      { id: 'bilingual', ar: 'عربي وإنجليزي', en: 'Arabic and English' },
      { id: 'reports', ar: 'تقارير وإحصاءات', en: 'Reports and analytics' },
      { id: 'notifications', ar: 'إشعارات (بريد أو رسائل)', en: 'Notifications (email or SMS)' },
      { id: 'integrations', ar: 'ربط بأنظمة أخرى', en: 'Integrations with other systems' },
      { id: 'ai', ar: 'أدوات ذكاء اصطناعي', en: 'AI features' },
    ],
  },
  {
    id: 'marketing',
    icon: 'chart',
    ar: 'التسويق الرقمي',
    en: 'Digital marketing',
    descAr: 'إدارة الحسابات، الخطط التسويقية، الحملات',
    descEn: 'Account management, marketing plans, campaigns',
    types: [
      { id: 'social-accounts', ar: 'إدارة حسابات التواصل', en: 'Social media management' },
      { id: 'marketing-plan', ar: 'خطة تسويقية', en: 'Marketing plan' },
      { id: 'campaigns', ar: 'حملات إعلانية', en: 'Ad campaigns' },
      { id: 'store-marketing', ar: 'تسويق متجر إلكتروني', en: 'Online store marketing' },
      { id: 'search', ar: 'الظهور في محركات البحث', en: 'Search visibility' },
      { id: 'other', ar: 'غير ذلك', en: 'Other' },
    ],
    features: [
      { id: 'x', ar: 'إكس', en: 'X' },
      { id: 'instagram', ar: 'إنستقرام', en: 'Instagram' },
      { id: 'tiktok', ar: 'تيك توك', en: 'TikTok' },
      { id: 'snapchat', ar: 'سناب شات', en: 'Snapchat' },
      { id: 'linkedin', ar: 'لينكدإن', en: 'LinkedIn' },
      { id: 'youtube', ar: 'يوتيوب', en: 'YouTube' },
      { id: 'whatsapp', ar: 'واتساب وتلقرام', en: 'WhatsApp and Telegram' },
    ],
  },
  {
    id: 'media',
    icon: 'send',
    ar: 'الإعلام والمحتوى',
    en: 'Media and content',
    descAr: 'خطط المحتوى، الكتابة والنشر، التقارير',
    descEn: 'Content plans, writing and publishing, reports',
    types: [
      { id: 'content-plan', ar: 'خطة محتوى ونشر', en: 'Content and publishing plan' },
      { id: 'writing', ar: 'كتابة المحتوى والأخبار', en: 'Content and news writing' },
      { id: 'reports', ar: 'تقارير للجهات المانحة', en: 'Reports for donors' },
      { id: 'media-dept', ar: 'تأسيس قسم إعلامي أو حضور رقمي', en: 'Setting up a media team or digital presence' },
      { id: 'other', ar: 'غير ذلك', en: 'Other' },
    ],
    features: [
      { id: 'calendar', ar: 'تقويم نشر شهري', en: 'Monthly publishing calendar' },
      { id: 'design', ar: 'تصاميم للمنشورات', en: 'Post designs' },
      { id: 'video', ar: 'مقاطع قصيرة', en: 'Short videos' },
      { id: 'coverage', ar: 'تغطية فعالية', en: 'Event coverage' },
      { id: 'identity', ar: 'هوية موحدة على المنصات', en: 'One identity across platforms' },
    ],
  },
  {
    id: 'other',
    icon: 'sparkles',
    ar: 'خدمات أخرى',
    en: 'Other services',
    descAr: 'تحليل أعمال، تحول رقمي، تدريس',
    descEn: 'Business analysis, digital transformation, teaching',
    types: [
      { id: 'analysis', ar: 'تحليل أعمال ودراسات', en: 'Business analysis and studies' },
      { id: 'transformation', ar: 'تحول رقمي لجهة أو جمعية', en: 'Digital transformation for an organization' },
      { id: 'archive', ar: 'تنظيم أرشيف رقمي', en: 'Digital archive organization' },
      { id: 'teaching', ar: 'تدريس العربية والقرآن', en: 'Arabic and Quran teaching' },
      { id: 'other', ar: 'غير ذلك', en: 'Other' },
    ],
    features: [],
  },
] as const satisfies readonly (Label & {
  id: string;
  icon: string;
  descAr: string;
  descEn: string;
  types: readonly Option[];
  features: readonly Option[];
})[];

export const REQUEST_STAGES = [
  { id: 'idea', ar: 'فكرة فقط', en: 'Just an idea', descAr: 'عندي فكرة عامة وأحتاج من يساعدني أبلورها', descEn: 'A general idea I need help shaping' },
  { id: 'partial', ar: 'وصف جزئي', en: 'Partial description', descAr: 'أعرف أهم ما أريده وبعض التفاصيل ناقصة', descEn: 'I know the main needs; some details are open' },
  { id: 'full', ar: 'متطلبات كاملة', en: 'Full requirements', descAr: 'عندي وصف أو وثيقة متطلبات جاهزة', descEn: 'I have a ready description or requirements document' },
] as const;

export const REQUEST_BUDGETS = [
  { id: 'lt5k', ar: 'أقل من 5,000 ريال', en: 'Under SAR 5,000' },
  { id: '5-15k', ar: '5,000 – 15,000 ريال', en: 'SAR 5,000 – 15,000' },
  { id: '15-40k', ar: '15,000 – 40,000 ريال', en: 'SAR 15,000 – 40,000' },
  { id: 'gt40k', ar: 'أكثر من 40,000 ريال', en: 'Over SAR 40,000' },
  { id: 'unsure', ar: 'لم أحدد بعد', en: 'Not decided yet' },
] as const;

export const REQUEST_TIMELINES = [
  { id: 'urgent', ar: 'عاجل (خلال أسبوعين)', en: 'Urgent (within two weeks)' },
  { id: 'month', ar: 'خلال شهر', en: 'Within a month' },
  { id: 'quarter', ar: 'خلال 1 – 3 أشهر', en: 'Within 1–3 months' },
  { id: 'flexible', ar: 'مرن', en: 'Flexible' },
] as const;

export const REQUEST_CONTACT_METHODS = [
  { id: 'email', ar: 'البريد الإلكتروني', en: 'Email' },
  { id: 'whatsapp', ar: 'واتساب', en: 'WhatsApp' },
  { id: 'meeting', ar: 'اجتماع مرئي', en: 'Video meeting' },
] as const;

/** Plain-text summary used by the email (API) and the mailto fallback (web). Arabic labels with English ids. */
/** Types and features are "<category>:<id>" so one request can span several services. */
export type RequestSummary = {
  categories: string[];
  types: string[];
  stage: string;
  description: string;
  link?: string | undefined;
  features: string[];
  budget: string;
  timeline: string;
  name: string;
  org?: string | undefined;
  email: string;
  phone?: string | undefined;
  contactMethod: string;
};

export function formatProjectRequest(r: RequestSummary, lang: 'ar' | 'en' = 'ar'): string {
  const L = (list: readonly Option[], id: string): string => list.find((o) => o.id === id)?.[lang] ?? id;
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const sep = lang === 'ar' ? '، ' : ', ';
  const pick = (values: string[], cat: string) => values.filter((v) => v.startsWith(`${cat}:`)).map((v) => v.slice(cat.length + 1));
  const services = REQUEST_CATEGORIES.filter((c) => r.categories.includes(c.id)).flatMap((c) => {
    const types = pick(r.types, c.id).map((id) => L(c.types, id));
    const needs = pick(r.features, c.id).map((id) => L(c.features, id));
    return [
      `• ${c[lang]}: ${types.join(sep)}`,
      needs.length ? `  ${t('المطلوب', 'Needs')}: ${needs.join(sep)}` : '',
    ].filter(Boolean);
  });
  const lines = [
    `${t('الخدمات المطلوبة', 'Services requested')}:`,
    ...services,
    '',
    `${t('مرحلة الفكرة', 'Stage')}: ${L(REQUEST_STAGES, r.stage)}`,
    `${t('الميزانية', 'Budget')}: ${L(REQUEST_BUDGETS, r.budget)}`,
    `${t('المدة', 'Timeline')}: ${L(REQUEST_TIMELINES, r.timeline)}`,
    r.link ? `${t('رابط ملف', 'File link')}: ${r.link}` : null,
    '',
    `${t('الاسم', 'Name')}: ${r.name}`,
    r.org ? `${t('الجهة', 'Organization')}: ${r.org}` : null,
    `${t('البريد', 'Email')}: ${r.email}`,
    r.phone ? `${t('الجوال', 'Phone')}: ${r.phone}` : null,
    `${t('التواصل المفضل', 'Preferred contact')}: ${L(REQUEST_CONTACT_METHODS, r.contactMethod)}`,
    '',
    `${t('الوصف', 'Description')}:`,
    r.description,
  ];
  // null = optional line left out; '' = a deliberate blank line between sections.
  return lines.filter((line) => line !== null).join('\n');
}
