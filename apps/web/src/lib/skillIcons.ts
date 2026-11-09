import type { IconName } from '../components/Icon.astro';

// Generic, meaningful icons for skills and tools (not the vendors' trademarked logos).
const rules: [RegExp, IconName][] = [
  [/identity|rbac|صلاحيات/i, 'key'],
  [/encrypt|تشفير/i, 'lock'],
  [/sql|database|supabase|entity framework|ef core|قاعدة/i, 'database'],
  [/asp\.net|\.net|mvc|bootstrap|framework/i, 'layers'],
  [/c#|python|ooxml|code|توليد/i, 'code'],
  [/javascript|typescript/i, 'braces'],
  [/react|component/i, 'component'],
  [/html|web portal|بوابة/i, 'layout'],
  [/css/i, 'palette'],
  [/powershell|terminal|edge functions/i, 'terminal'],
  [/git/i, 'branch'],
  [/devops|workflow|سير عمل|مسارات|إجراءات/i, 'flow'],
  [/azure|cloud|hostinger|drive|سحاب/i, 'cloud'],
  [/server|خادم/i, 'server'],
  [/ai|ذكاء|lovable/i, 'sparkles'],
  [/bot|telegram/i, 'send'],
  [/google workspace|workspace/i, 'grid'],
  [/salla|سلة|متجر/i, 'cart'],
  [/jisr|جسر|hr/i, 'users'],
  [/donor|مانحة/i, 'heart'],
  [/excel|metricool|financial|مالية|chart/i, 'chart'],
  [/word|libreoffice|document|متطلبات|وثائق/i, 'document'],
  [/analysis|تحليل/i, 'analysis'],
  [/arabic|english|العربية|الإنجليزية/i, 'globe'],
];

export function skillIcon(name: string): IconName {
  for (const [pattern, icon] of rules) if (pattern.test(name)) return icon;
  return 'check';
}
