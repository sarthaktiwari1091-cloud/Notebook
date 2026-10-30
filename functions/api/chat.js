// Cloudflare Pages Function: POST /api/chat
// Keeps the Gemini API key on the server (env var GEMINI_API_KEY). The browser never sees it.

const DEFAULT_MODEL = 'gemini-2.5-flash';
const MAX_MESSAGES = 24;
const MAX_CHARS = 12000;

const reply = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function onRequestGet({ env }) {
  return reply({ ok: true, configured: Boolean(env.GEMINI_API_KEY), model: env.GEMINI_MODEL || DEFAULT_MODEL });
}

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return reply({ error: 'AI is not configured yet. Add the GEMINI_API_KEY environment variable on your host and redeploy.' }, 500);
  }

  const origin = request.headers.get('Origin');
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) return reply({ error: 'Forbidden origin.' }, 403);
    } catch {
      return reply({ error: 'Bad origin.' }, 403);
    }
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return reply({ error: 'Invalid request.' }, 400);
  }

  const { system = '', messages, json = false } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) return reply({ error: 'No messages provided.' }, 400);

  let total = 0;
  const contents = [];
  for (const m of messages.slice(-MAX_MESSAGES)) {
    const text = String(m?.content ?? '').slice(0, 8000);
    total += text.length;
    if (!text.trim()) continue;
    const role = m.role === 'assistant' ? 'model' : 'user';
    if (contents.length === 0 && role === 'model') continue;
    contents.push({ role, parts: [{ text }] });
  }
  if (!contents.length) return reply({ error: 'Empty message.' }, 400);
  if (total > MAX_CHARS * 2) return reply({ error: 'Message is too long. Please shorten it.' }, 413);

  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  let r;
  try {
    r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: String(system).slice(0, 4000)  ' Never use LaTeX or dollar signs. Write maths in plain text, like x^2, 3/2, sqrt(x), H2O.'  }] },
        contents,
        generationConfig: {
          temperature: json ? 0.4 : 0.7,
          maxOutputTokens: 4096,
          ...(json ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    });
  } catch {
    return reply({ error: 'Could not reach the AI service. Please try again.' }, 502);
  }

  if (r.status === 429) return reply({ error: 'The free AI quota is used up for the moment. Please try again in a minute.' }, 429);
  if (r.status === 400 || r.status === 403) {
    return reply({ error: 'The AI service rejected the request. Check your API key and model name on the server.' }, 502);
  }
  if (!r.ok) return reply({ error: `AI service error (${r.status}). Please try again.` }, 502);

  let data;
  try {
    data = await r.json();
  } catch {
    return reply({ error: 'The AI returned an unreadable response.' }, 502);
  }

  const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
  if (!text) {
    const blocked = data.promptFeedback?.blockReason;
    return reply({ error: blocked ? 'That request was blocked by safety filters. Try rephrasing it.' : 'The AI returned an empty answer. Please try again.' }, 502);
  }
  return reply({ text });
}
