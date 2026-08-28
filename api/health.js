export default function handler(_req, res) {
  return res.status(200).json({
    ok: true,
    providers: {
      groq: Boolean(process.env.GROQ_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY)
    },
    timestamp: new Date().toISOString()
  });
}
