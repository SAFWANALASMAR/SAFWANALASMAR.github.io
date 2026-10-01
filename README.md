# موقع صفوان الأسمر الشخصي

موقع شخصي ثنائي اللغة (عربي RTL افتراضي على `/`، وإنجليزي LTR على `/en/`) مبني بـ **Astro** و**Tailwind CSS** و**TypeScript**، ثابت بالكامل ومنشور على **GitHub Pages**: https://safwanalasmar.github.io

A bilingual (Arabic RTL default, English LTR at `/en/`) static personal site built with Astro, Tailwind CSS and TypeScript, deployed to GitHub Pages.

---

## التشغيل المحلي

يتطلب Node.js 22 أو أحدث.

```bash
npm install
npm run dev       # خادم تطوير على http://localhost:4321
npm run build     # فحص الأنواع ثم بناء الموقع في dist/
npm run preview   # معاينة نسخة البناء
npm run images    # إعادة توليد صور Open Graph والأيقونات (يحتاج Chrome أو Edge)
npm run deploy    # بناء الموقع ونشره على GitHub Pages
```

## هيكل المشروع

```
src/
  content/               ← كل النصوص هنا — عدّلها دون لمس الكود
    settings.yaml        ← البريد، لينكدإن، جت هب، معرّف نموذج Formspree، مسار السيرة والصورة
    site/ar.yaml         ← نصوص الموقع بالعربية (المقدمة، الأرقام، من أنا، الخط الزمني، المهارات...)
    site/en.yaml         ← نفس الملف بالإنجليزية
    services/*.yaml      ← ملف لكل خدمة (باللغتين)
    projects/*.yaml      ← ملف لكل مشروع / دراسة حالة (باللغتين)
  content.config.ts      ← مخطط التحقق من المحتوى (يمنع البناء إن نقص حقل)
  views/                 ← قوالب الصفحات، مشتركة بين اللغتين
  pages/                 ← المسارات: pages/ للعربية و pages/en/ للإنجليزية
  components/            ← الرأس والتذييل والبطاقات والأيقونات
  layouts/Base.astro     ← الوسوم الوصفية، hreflang، Open Graph، الوضع الداكن
  styles/global.css      ← الألوان والخطوط والمكونات العامة
public/
  og/                    ← صور Open Graph (تُولَّد بـ npm run images)
  cv/                    ← ضع هنا Safwan-Alasmar-CV.pdf
  images/                ← ضع هنا profile.jpg
```

## أين يُعدَّل المحتوى

| ماذا تريد أن تعدّل | الملف |
| --- | --- |
| البريد، الروابط، نموذج التواصل | `src/content/settings.yaml` |
| المقدمة، الأرقام، «كيف أعمل»، «من أنا»، الخط الزمني، المهارات، عناوين الصفحات ووصفها | `src/content/site/ar.yaml` و `src/content/site/en.yaml` |
| خدمة | `src/content/services/<اسم-الخدمة>.yaml` |
| مشروع | `src/content/projects/<اسم-المشروع>.yaml` |
| الصورة الشخصية | `public/images/profile.jpg` — إن لم توجد يظهر الحرفان «ص أ» تلقائياً |
| السيرة الذاتية | `public/cv/Safwan-Alasmar-CV.pdf` — يتفعّل زر التنزيل تلقائياً عند وجود الملف |

> أي قيمة بين 【】 هي خانة لم تُملأ بعد، وتظهر على الموقع كما هي حتى تُستبدل.
> إن احتوت قيمة YAML على نقطتين متبوعتين بمسافة (`: `) فضعها بين علامتي تنصيص `"..."`.

بعد تعديل الاسم أو المسمى أو سطر القيمة، شغّل `npm run images` لتحديث صور المشاركة.

## إضافة خدمة جديدة

1. انسخ أي ملف في `src/content/services/` باسم جديد بالإنجليزية، مثل `training.yaml` (الاسم يصبح رابط الخدمة ومعرّفها في نموذج التواصل).
2. عدّل `order` (ترتيب الظهور) و`icon` (واحدة من: `web`، `document`، `archive`، `nonprofit`، `analysis` — أو أضف أيقونة في `src/components/Icon.astro` ثم أضف اسمها إلى المخطط في `src/content.config.ts`).
3. املأ الحقول تحت `ar:` و`en:`: `title`، `audience`، `summary`، `includes`.

تظهر الخدمة تلقائياً في الرئيسية وصفحة الخدمات وقائمة نموذج التواصل.

## إضافة مشروع جديد

1. أنشئ ملفاً في `src/content/projects/` مثل `my-project.yaml` (الاسم يصبح الرابط `/projects/my-project/`).
2. الحقول العامة:
   - `order`: الترتيب · `featured: true` للظهور في الرئيسية (تُعرض أول ثلاثة)
   - `year` · `type`: واحد من `web-system`، `automation`، `web-app`، `digital-transformation`، `business-analysis`
   - `tags`: الوسوم التقنية على البطاقة · `status: in-progress` (اختياري) · `link` (اختياري، رابط كامل)
3. تحت `ar:` و`en:`: `title` و`summary` (إلزاميان)، ثم اختيارياً: `org`، `challenge`، `solution`، `role`، `tools`، `result`، `availability`. الحقول النصية تقبل سطراً واحداً أو قائمة بنود، وما يُترك فارغاً لا يظهر.

لإضافة نوع مشروع جديد: أضفه إلى `projectTypes` في `src/content.config.ts` وإلى `projects.types` في ملفي اللغة.

## تفعيل نموذج التواصل (Formspree)

1. أنشئ حساباً مجانياً على [formspree.io](https://formspree.io) وأنشئ نموذجاً جديداً.
2. انسخ المعرّف من رابط النموذج (`https://formspree.io/f/XXXXXXX` ← `XXXXXXX`).
3. ضعه في `formspreeId` داخل `src/content/settings.yaml`.

حتى يُضاف المعرّف يبقى زر الإرسال معطّلاً مع رسالة تدعو للتواصل بالبريد. زر «اطلب هذه الخدمة» يفتح صفحة التواصل والخدمة مختارة مسبقاً.

## النشر على GitHub Pages

الموقع منشور من مستودع `SAFWANALASMAR.github.io` على الرابط **https://safwanalasmar.github.io**.

بعد أي تعديل:

```bash
git add -A
git commit -m "وصف التعديل"
git push
npm run deploy
```

`git push` يحفظ الكود في فرع `main`، و`npm run deploy` يبني الموقع ويرفع النسخة الجاهزة إلى فرع `gh-pages` الذي يعرضه GitHub Pages. يظهر التحديث خلال دقيقة أو اثنتين.

> إعداد GitHub Pages في المستودع: **Settings ← Pages ← Deploy from a branch ← `gh-pages` / root**.

## ربط نطاق خاص

1. أنشئ ملف `public/CNAME` يحتوي على النطاق فقط، مثل: `safwan.dev`.
2. عند مزوّد النطاق:
   - للنطاق الرئيسي: سجلات `A` إلى `185.199.108.153` و`185.199.109.153` و`185.199.110.153` و`185.199.111.153`.
   - لنطاق فرعي مثل `www`: سجل `CNAME` إلى `safwanalasmar.github.io`.
3. انشر بالنطاق الجديد: `SITE_URL=https://safwan.dev npm run deploy` (أو غيّر القيمة الافتراضية في `scripts/deploy.mjs`).
4. من **Settings ← Pages** اكتب النطاق في **Custom domain** وفعّل **Enforce HTTPS**.

## ملاحظات تقنية

- الخطوط مستضافة ذاتياً عبر Fontsource: IBM Plex Sans Arabic، وInter، وJetBrains Mono.
- الوضع الداكن يتبع نظام الجهاز، وزر التبديل يحفظ الاختيار في المتصفح.
- الحركة تُلغى تلقائياً مع `prefers-reduced-motion`، والمحتوى يظهر كاملاً إن تعطّل JavaScript.
- لكل صفحة ولكل لغة: `title` و`description` و`canonical` و`hreflang` وصورة Open Graph، مع `sitemap-index.xml` و`robots.txt`، وبيانات `Person` بصيغة JSON-LD في الرئيسية.
