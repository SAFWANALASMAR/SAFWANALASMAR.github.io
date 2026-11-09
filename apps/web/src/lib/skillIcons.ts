import type { IconName } from '../components/Icon.astro';

// Generic, meaningful icons for skills and tools (not the vendors' trademarked logos).
// First match wins, so specific names come before broad ones.
const rules: [RegExp, IconName][] = [
  [/asp\.net identity/i, 'user-check'],
  [/rbac|صلاحيات|permissions/i, 'key'],
  [/encrypt|تشفير/i, 'lock'],
  [/supabase/i, 'bolt'],
  [/sql server/i, 'server'],
  [/sql|database|entity framework|ef core|قاعدة/i, 'database'],
  [/bootstrap/i, 'columns'],
  [/asp\.net|\.net|mvc|framework/i, 'layers'],
  [/c#/i, 'hash'],
  [/ooxml|توليد/i, 'file-code'],
  [/python|code/i, 'code'],
  [/typescript/i, 'type'],
  [/javascript/i, 'braces'],
  [/react|component/i, 'component'],
  [/web portal|بوابة/i, 'web'],
  [/html/i, 'layout'],
  [/css/i, 'palette'],
  [/powershell|terminal|edge functions/i, 'terminal'],
  [/git/i, 'branch'],
  [/devops|workflow|process|سير عمل|مسارات|إجراءات/i, 'flow'],
  [/drive/i, 'folder'],
  [/azure|cloud|hostinger|سحاب/i, 'cloud'],
  [/server|خادم/i, 'server'],
  [/ai|ذكاء|lovable/i, 'sparkles'],
  [/bot|telegram/i, 'send'],
  [/google workspace|workspace/i, 'grid'],
  [/salla|سلة|متجر/i, 'cart'],
  [/jisr|جسر|hr/i, 'users'],
  [/donor|مانحة/i, 'heart'],
  [/excel/i, 'table'],
  [/metricool/i, 'trend'],
  [/financial|مالية|chart/i, 'chart'],
  [/word|libreoffice|document|متطلبات|وثائق/i, 'document'],
  [/analysis|تحليل/i, 'analysis'],
  [/arabic|english|العربية|الإنجليزية/i, 'globe'],
];

export function skillIcon(name: string): IconName {
  for (const [pattern, icon] of rules) if (pattern.test(name)) return icon;
  return 'check';
}
