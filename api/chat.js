const MAX_MESSAGE_LENGTH = Number(process.env.MAX_MESSAGE_LENGTH || 12000);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 30000);
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || "You are Celia, a helpful and concise assistant. Answer in the user's language.";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const message = req.body?.message;
  if (typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'يجب توفير حقل message نصي غير فارغ.' });
  }

  const prompt = message.trim();
  if (prompt.length > MAX_MESSAGE_LENGTH) {
    return res.status(413).json({ error: `الرسالة تتجاوز الحد الأقصى ${MAX_MESSAGE_LENGTH} حرفًا.` });
  }

  const errors = [];
  if (process.env.GROQ_API_KEY) {
    try {
      const response = await callGroq(prompt);
      return res.status(200).json({ provider: 'groq', response });
    } catch (error) {
      errors.push(`groq: ${error.message}`);
      console.error(errors.at(-1));
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await callGemini(prompt);
      return res.status(200).json({ provider: 'gemini', response });
    } catch (error) {
      errors.push(`gemini: ${error.message}`);
      console.error(errors.at(-1));
    }
  }

  return res.status(502).json({
    error: 'تعذر على مزودي الذكاء الاصطناعي معالجة الطلب حاليًا.',
    ...(process.env.NODE_ENV === 'development' ? { details: errors } : {})
  });
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function callGroq(prompt) {
  const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`API ${response.status}: ${data.error?.message || 'unknown error'}`);
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('empty response');
  return content;
}

async function callGemini(prompt) {
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`API ${response.status}: ${data.error?.message || 'unknown error'}`);
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!content) throw new Error('empty response');
  return content;
}
