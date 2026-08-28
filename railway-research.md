# Railway deployment research

تمت مراجعة وثائق Railway الرسمية في 28 أغسطس 2026.

توضح وثائق Config as Code أن Railway يقرأ ملف `railway.toml` أو `railway.json` الموجود بجوار الكود، وأن إعدادات البناء والنشر يمكن تعريفها في الملف. كما تشير الوثائق الحالية إلى أن Config as Code أصبح مسارًا قديمًا نسبيًا مع تفضيل Infrastructure as Code؛ لذلك سيُستخدم هنا ملف إعداد بسيط فقط عند الحاجة، مع إبقاء الإعدادات المهمة قابلة للضبط من لوحة Railway.

توضح وثائق Healthchecks أن التطبيق يجب أن يستمع إلى متغير البيئة `PORT` الذي تحقنه Railway، وأنه يمكن ضبط مسار فحص الصحة على `/health` بحيث ينتظر Railway استجابة HTTP 200 قبل تفعيل النسخة الجديدة. كما أن healthcheck ليس مراقبة مستمرة بعد اكتمال النشر.

المصادر:

- https://docs.railway.com/config-as-code/reference
- https://docs.railway.com/deployments/healthchecks
