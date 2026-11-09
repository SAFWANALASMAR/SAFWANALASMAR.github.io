# موقع صفوان الأسمر الشخصي

موقع شخصي ثنائي اللغة (عربي RTL افتراضي على `/`، وإنجليزي LTR على `/en/`) الواجهة مفصولة عن الخادم في مستودع واحد:

| الجزء | المسار | التقنية |
| --- | --- | --- |
| الواجهة | `apps/web` | Astro 7 وTailwind CSS 4 وTypeScript — صفحات ثابتة على Cloudflare Workers (حالياً أيضاً على GitHub Pages) |
| الخادم | `apps/api` | Hono على Cloudflare Workers — نموذج التواصل: تحقق المدخلات، تحديد الطلبات، Turnstile، إرسال البريد عبر Resend |
| العقد المشترك | `packages/shared` | Zod — حدود الحقول وقواعد التحقق ورموز الأخطاء، يستخدمها الطرفان |

عامل الواجهة يمرّر أي طلب يبدأ بـ `/api/` إلى عامل الخادم عبر ربط خدمة داخلي، فيبقى الطلب من النطاق نفسه (بلا CORS)، والخادم غير مكشوف للعموم مباشرة.

A bilingual personal site. Frontend (`apps/web`, Astro) and backend (`apps/api`, Hono on Cloudflare Workers) are separate packages sharing one validation contract (`packages/shared`, Zod).

---

## التشغيل المحلي

يتطلب Node.js 22 أو أحدث.

الأوامر من جذر المستودع:

```bash
npm install
npm run dev:web     # الواجهة على http://localhost:4321
npm run dev:api     # الخادم وحده على http://localhost:8787
npm run check       # فحص الأنواع في الأجزاء الثلاثة
npm test            # اختبارات الخادم (Vitest)
npm run build       # فحص وبناء الواجهة في apps/web/dist/
npm run e2e         # اختبارات المتصفح (Playwright): يشغّل الواجهة والخادم معاً محلياً
```

أوامر خاصة بالواجهة من داخل `apps/web`: `npm run images` (صور Open Graph والأيقونات) و`npm run deploy` (النشر على GitHub Pages).

لتجربة نموذج التواصل محلياً بإرسال حقيقي: أنشئ `apps/api/.dev.vars` (مستثنى من git) فيه `TURNSTILE_SECRET` و`RESEND_API_KEY`، ثم شغّل من `apps/web`: `npx wrangler dev -c wrangler.jsonc -c ../api/wrangler.jsonc`.

## هيكل الواجهة (`apps/web`)

```
src/
  content/               ← كل النصوص هنا — عدّلها دون لمس الكود
    settings.yaml        ← البريد، لينكدإن، جت هب، مفتاح Turnstile العام، مسار السيرة والصورة
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

المسارات أدناه داخل `apps/web/`.

| ماذا تريد أن تعدّل | الملف |
| --- | --- |
| البريد، الروابط، نموذج التواصل | `src/content/settings.yaml` |
| المقدمة، الأرقام، «كيف أعمل»، «من أنا»، الخط الزمني، المهارات، عناوين الصفحات ووصفها | `src/content/site/ar.yaml` و `src/content/site/en.yaml` |
| خدمة | `src/content/services/<اسم-الخدمة>.yaml` |
| مشروع | `src/content/projects/<اسم-المشروع>.yaml` |
| الصورة الشخصية | `public/images/profile.jpg` — إن لم توجد يظهر الحرفان «ص أ» تلقائياً |
| صورة شهادة | `public/certificates/<اسم>.webp` ثم أضف `image: certificates/<اسم>.webp` للشهادة في ملفي اللغة — يظهر زر «عرض الشهادة» تلقائياً |
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

## نموذج التواصل والنشر على Cloudflare

يُنشر الخادم أولاً ثم الواجهة (الواجهة تربط نفسها بالخادم باسمه `safwan-api`). مرة واحدة فقط:

1. أنشئ حساباً مجانياً في [Cloudflare](https://dash.cloudflare.com/sign-up)، ثم من **Turnstile** أضف موقعاً (Managed) واكتب نطاق الموقع. انسخ:
   - **المفتاح العام (Site key)** ← ضعه في `turnstileSiteKey` داخل `apps/web/src/content/settings.yaml`.
   - **المفتاح السري (Secret key)** ← للخطوة 4.
2. أنشئ حساباً مجانياً في [Resend](https://resend.com) بالبريد نفسه الموجود في `MAIL_TO` بملف `apps/api/wrangler.jsonc`، وأنشئ مفتاح API (صلاحية الإرسال فقط).
3. سجّل الدخول من الطرفية: `npx wrangler login`.
4. أدخل المفتاحين بنفسك (لا يُكتبان في أي ملف ولا يُرسلان في محادثة):
   ```bash
   cd apps/api
   npx wrangler secret put TURNSTILE_SECRET
   npx wrangler secret put RESEND_API_KEY
   ```
5. انشر من الجذر:
   ```bash
   npm run deploy:api
   SITE_URL=https://safwan-web.<اسمك-الفرعي>.workers.dev npm run deploy:web
   ```

حتى يُضاف المفتاح العام يفتح النموذج تطبيق البريد لدى الزائر والرسالة جاهزة. زر «اطلب هذه الخدمة» يفتح صفحة التواصل والخدمة مختارة مسبقاً.

الإحصاءات: لوحة Cloudflare تعرض عدد الطلبات والزيارات من جهة الخادم تلقائياً، بلا سكربت تتبع ولا ملفات تعريف ارتباط.

## النشر على GitHub Pages (الاستضافة الحالية حتى الانتقال)

الموقع منشور من مستودع `SAFWANALASMAR.github.io` على الرابط **https://safwanalasmar.github.io**.

بعد أي تعديل:

```bash
git add -A
git commit -m "وصف التعديل"
git push
cd apps/web && npm run deploy
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

## الحماية

- **ترويسات أمان حقيقية** على Cloudflare من `apps/web/public/_headers`: منع التأطير، وإجبار HTTPS (HSTS)، وسياسة الإحالة، وتعطيل الكاميرا والميكروفون والموقع.
- **الخادم**: يقبل الطلبات من نطاق الموقع نفسه فقط، وJSON فقط بحد 16 ك.ب، وثلاث رسائل في الدقيقة لكل عنوان، ويتحقق من Turnstile على الخادم، ويرسل البريد نصاً مجرداً بلا HTML، ولا يسجّل بيانات الزوار، ولا يُخزّن الردود مؤقتاً. حقل مخفي يكشف البرامج الآلية دون إزعاج الزائر.
- **المفاتيح السرية** في أسرار Cloudflare فقط؛ `.dev.vars` مستثنى من git.
- **الفحص الآلي** مع كل تعديل (`.github/workflows/ci.yml`): تدقيق الحزم، وفحص الأنواع، واختبارات الخادم، واختبارات المتصفح على الكمبيوتر والجوال. و**CodeQL** (`codeql.yml`) يحلل الكود أمنياً أسبوعياً ومع كل تعديل.
- سياسة أمن المحتوى (CSP) تُضاف وسماً في كل صفحة من `apps/web/astro.config.mjs`، ويحسب Astro بصمات السكربتات والأنماط المضمّنة تلقائياً. أي مصدر خارجي جديد (خط أو سكربت أو صورة) يجب إضافته هناك وإلا سيحجبه المتصفح.
- البريد لا يُكتب كاملاً في الصفحات؛ يُقسَّم في `data-u` و`data-d` ويعيد سكربت بناء الرابط، لإبعاده عن برامج جمع العناوين.
- الروابط الخارجية بـ `rel="noopener noreferrer"`، والصفحات ترفض العرض داخل إطار موقع آخر.
- امسح بيانات EXIF من أي صورة قبل رفعها (يكفي تمريرها عبر sharp كما في الصورة الشخصية).
- Dependabot يفتح طلبات تحديث أسبوعية للحزم ولإجراءات GitHub من `.github/dependabot.yml`.

## ملاحظات تقنية

- الخطوط مستضافة ذاتياً عبر Fontsource: IBM Plex Sans Arabic، وInter، وJetBrains Mono.
- الوضع الداكن يتبع نظام الجهاز، وزر التبديل يحفظ الاختيار في المتصفح.
- الحركة تُلغى تلقائياً مع `prefers-reduced-motion`، والمحتوى يظهر كاملاً إن تعطّل JavaScript.
- لكل صفحة ولكل لغة: `title` و`description` و`canonical` و`hreflang` وصورة Open Graph، مع `sitemap-index.xml` و`robots.txt`، وبيانات `Person` بصيغة JSON-LD في الرئيسية.
