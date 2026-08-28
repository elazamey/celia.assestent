# celia.assestent

خلفية MVP بسيطة لمساعد Celia. تقدم نقطة نهاية واحدة للمحادثة (`POST /chat`) مع استخدام Groq كمزود أساسي وGemini كمزود احتياطي تلقائيًا عند الفشل أو عدم توفر المزود الأساسي.

## المتطلبات

يتطلب المشروع Node.js 18 أو أحدث. لا تُضمّن مفاتيح API داخل الكود أو المستودع؛ استخدم متغيرات البيئة فقط.

## التشغيل المحلي

```bash
npm install
cp .env.example .env
# عدّل GROQ_API_KEY و GEMINI_API_KEY داخل .env
npm start
```

فحص الحالة:

```bash
curl http://localhost:3000/health
```

إرسال رسالة:

```bash
curl -X POST http://localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"مرحبًا، عرّف نفسك"}'
```

شكل الاستجابة:

```json
{
  "provider": "groq",
  "response": "..."
}
```

## المزامنة والرفع

يُرفع الكود إلى فرع `main` فقط بعد فحص محلي، ولا تُرفع ملفات `.env` أو `node_modules`. ملف GitHub Actions في `.github/workflows/ci.yml` يشغّل فحص الصياغة واختبارًا صحيًا تلقائيًا عند كل `push` أو Pull Request.

المزامنة التلقائية من جهازك أو بيئة أخرى تحتاج إلى تشغيل GitHub Actions أو عميل Git على تلك البيئة. لا يُنصح باستخدام مهمة مجدولة لرفع الملفات دون مراجعة؛ المسار الآمن هو commit واضح ثم push، مع فحص الأسرار قبل الرفع.

## ملاحظات أمنية

في الإنتاج، قيّد `CORS_ORIGIN` إلى نطاق الواجهة الفعلي، وأضف مصادقة وحدود معدل قبل فتح endpoint للعامة. لا تظهر تفاصيل أخطاء المزودين إلا عند `NODE_ENV=development`.
