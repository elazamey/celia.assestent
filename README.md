# celia.assestent

خلفية وواجهة MVP لمساعد Celia. يقدّم المشروع نقطة نهاية واحدة للمحادثة (`POST /chat`) مع استخدام Groq كمزوّد أساسي وGemini كمزوّد احتياطي تلقائيًا عند الفشل أو عدم توفر المزود الأساسي.

## المكونات

| المكوّن | الوظيفة |
|---|---|
| `server.js` | خادم Express مع `/chat` و`/health` وتبديل Groq/Gemini |
| `index.html` و`style.css` و`script.js` | واجهة محادثة متجاوبة مع العربية RTL والإنجليزية LTR والوضع الليلي |
| `railway.json` | إعداد Railway لأمر التشغيل ومسار فحص الصحة |
| `.github/workflows/ci.yml` | فحص الصياغة واختبار الصحة عند كل push أو Pull Request |
| `sync-to-github.sh` | مزامنة محلية آمنة مع فحص الملفات الحساسة قبل الرفع |

## التشغيل المحلي

يتطلب المشروع Node.js 18 أو أحدث. ثبّت الاعتماديات وانسخ ملف البيئة النموذجي، ثم أضف المفاتيح محليًا فقط:

```bash
npm install
cp .env.example .env
# عدّل GROQ_API_KEY و GEMINI_API_KEY داخل .env
npm start
```

فحص الخادم:

```bash
curl http://localhost:3000/health
```

إرسال رسالة:

```bash
curl -X POST http://localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"مرحبًا، عرّف نفسك"}'
```

لا تُرفع ملفات `.env` أو مفاتيح API إلى GitHub. يستخدم الخادم متغير `PORT` الذي توفره منصة الاستضافة، ويقيّد طول الرسالة والمهلة الزمنية افتراضيًا.

## تشغيل الواجهة الأمامية

شغّل خادم ملفات محليًا من مجلد المشروع:

```bash
npx --yes http-server . -p 4173
```

ثم افتح `http://127.0.0.1:4173/index.html`. تستخدم الواجهة افتراضيًا `http://localhost:3000`، ويمكن تغيير عنوان الخادم من زر الإعدادات؛ يُحفظ العنوان في `localStorage`. عند إدخال نطاق ينتهي بـ `vercel.app` تضيف الواجهة `/api` تلقائيًا، بينما تبقي عناوين Railway والعناوين المحلية دون تعديل. لا تحتاج الواجهة إلى أي مفتاح API.

## النشر على Railway

يمكن نشر المشروع من خلال ربط مستودع GitHub `elazamey/celia.assestent` بخدمة جديدة في Railway. سيقرأ Railway ملف `railway.json` الموجود بجوار الكود ويستخدم `npm start` لتشغيل الخادم، مع ضبط `/health` كمسار فحص الصحة. يعتمد التطبيق على متغير `PORT` الذي توفره Railway، لذلك لا ينبغي تثبيت منفذ إنتاجي داخل الكود [1] [2].

بعد إنشاء الخدمة، أضف المتغيرات التالية من قسم Variables في Railway:

| المتغير | القيمة |
|---|---|
| `GROQ_API_KEY` | مفتاح Groq الخاص بك |
| `GEMINI_API_KEY` | مفتاح Gemini الخاص بك |
| `GROQ_MODEL` | اختياري؛ الافتراضي `llama-3.1-8b-instant` |
| `GEMINI_MODEL` | اختياري؛ الافتراضي `gemini-1.5-flash` |
| `CORS_ORIGIN` | نطاق الواجهة، أو قيمة مؤقتة للاختبار فقط |
| `NODE_ENV` | `production` |

لا تضع القيم السرية في `railway.json` أو `README.md` أو أي commit. بعد نجاح النشر، استخدم رابط الخدمة العام في إعدادات الواجهة، مثل `https://your-service.up.railway.app`، ثم اختبر:

```bash
curl https://your-service.up.railway.app/health
```

ينتظر Railway استجابة HTTP 200 من `/health` قبل تفعيل النسخة الجديدة، لكنه لا يستخدم هذا المسار للمراقبة المستمرة بعد اكتمال النشر [2].

> ملاحظة: ملف `railway.json` هو إعداد نشر بسيط متوافق مع Config as Code الحالي. توضح وثائق Railway أن هذا المسار أصبح قديمًا نسبيًا وتفضّل Infrastructure as Code للمشاريع الجديدة، مع استمرار دعم الملفات الحالية خلال الفترة الانتقالية [1].

## النشر على Vercel بجانب Railway

يدعم المشروع وظائف Vercel منفصلة داخل `api/` دون تعديل `server.js` أو إضافة `type: module` إلى `package.json`. يحتوي `api/package.json` على نطاق ESM محلي، لذلك تعمل `api/chat.js` و`api/health.js` بصيغة `export default` بينما يبقى الخادم الرئيسي متوافقًا مع Railway.

للنشر، أنشئ مشروعًا جديدًا في [Vercel](https://vercel.com) واختر مستودع GitHub. لا يحتاج المشروع إلى أمر بناء مخصص. أضف المتغيرات `GROQ_API_KEY` و`GEMINI_API_KEY`، ويمكنك إضافة `GROQ_MODEL` و`GEMINI_MODEL` و`MAX_MESSAGE_LENGTH` و`REQUEST_TIMEOUT_MS` اختياريًا. بعد النشر تصبح النقاط:

| المنصة | المحادثة | الصحة |
|---|---|---|
| Railway | `POST /chat` | `GET /health` |
| Vercel | `POST /api/chat` | `GET /api/health` |

عند استخدام الواجهة مع Vercel، يمكنك إدخال `https://your-app.vercel.app` أو `https://your-app.vercel.app/api`؛ تتعرف الواجهة على نطاق Vercel وتضمن وجود `/api` قبل إضافة `/chat`، فتصل إلى `POST /api/chat`. أما عند استخدام Railway فاضبطه على `https://your-service.railway.app` للوصول إلى `POST /chat`. إذا كانت الواجهة منشورة ضمن مشروع Vercel نفسه، يمكن لاحقًا جعل العنوان نسبيًا عبر إعداد frontend مخصص. لا تُرفع المفاتيح إلى GitHub، ولا تُعدّل `package.json` الجذر أو `server.js` لهذا المسار.

## النشر عبر Render

يمكن استخدام نفس مستودع GitHub على Render كخدمة Web Service. استخدم أمر البناء `npm install` وأمر التشغيل `npm start`، واضبط المتغيرات نفسها في لوحة الخدمة. اجعل مسار فحص الصحة `/health` إذا كان الخيار متاحًا في إعدادات الخدمة.

## المزامنة والاختبارات

بعد تعديل الكود من بيئة التطوير، استخدم:

```bash
./sync-to-github.sh "وصف التغيير"
```

ينفذ السكربت `pull --rebase` ثم يراجع الملفات المرحّلة بحثًا عن `.env` والشهادات ومفاتيح الاعتماد قبل تنفيذ `commit` و`push`. كما يشغّل GitHub Actions فحص الصياغة واختبار `/health` عند كل push أو Pull Request.

للتشغيل المحلي للفحوص:

```bash
node --check server.js
node --check script.js
bash -n sync-to-github.sh
git diff --check
```

## English

### Overview

`celia.assestent` is a minimal chat MVP with an Express backend and a static frontend. The backend exposes `POST /chat`, uses Groq as the primary provider, and falls back to Gemini when the primary provider is unavailable. `GET /health` reports whether provider credentials are configured without exposing their values.

### Local setup

```bash
npm install
cp .env.example .env
# Add GROQ_API_KEY and GEMINI_API_KEY to .env
npm start
```

Run the static frontend with `npx --yes http-server . -p 4173`, then open `http://127.0.0.1:4173/index.html`. The frontend defaults to `http://localhost:3000` and lets the user change the backend URL from Settings. API keys must remain server-side.

### Railway deployment

Create a Railway service from the GitHub repository `elazamey/celia.assestent`. The included `railway.json` sets the `npm start` command and `/health` deployment healthcheck. Add `GROQ_API_KEY`, `GEMINI_API_KEY`, `NODE_ENV=production`, and a production `CORS_ORIGIN` in Railway Variables. Do not commit secrets. After deployment, place the public service URL in the frontend Settings and verify it with `GET /health`.

Railway injects the `PORT` variable and uses the configured healthcheck to wait for an HTTP 200 response before activating a new deployment [2]. The healthcheck is a deployment gate, not continuous monitoring after activation [2].

## المراجع / References

[1]: https://docs.railway.com/config-as-code/reference "Railway Docs — Config as Code Reference"
[2]: https://docs.railway.com/deployments/healthchecks "Railway Docs — Healthchecks"
