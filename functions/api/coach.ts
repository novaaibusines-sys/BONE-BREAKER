interface Env {
  GEMINI_API_KEY?: string;
}

interface ChatPayload {
  message?: string;
  history?: Array<{ role?: string; parts?: Array<{ text?: string }> }>;
  context?: { systemPrompt?: string };
}

interface GeminiCandidate {
  content?: { parts?: Array<{ text?: string }> };
}

const MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse`;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function sse(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function extractText(data: unknown): string {
  const candidates = (data as { candidates?: GeminiCandidate[] })?.candidates;
  const parts = candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((part) => part.text || '').join('');
}

function eventText(event: string): string {
  const line = event
    .split('\n')
    .find((entry) => entry.startsWith('data: '));
  if (!line) return '';
  const raw = line.slice(6).trim();
  if (!raw || raw === '[DONE]') return '';
  try {
    return extractText(JSON.parse(raw));
  } catch {
    return '';
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  let payload: ChatPayload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const clientKey = request.headers.get('x-gemini-api-key') || '';
  const apiKey = clientKey.trim() || env.GEMINI_API_KEY || '';

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return json(
      {
        error:
          'Gemini API key is missing or not configured. Please enter your API key in Settings.',
      },
      401
    );
  }

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  if (Array.isArray(payload.history)) {
    for (const item of payload.history) {
      const text = item?.parts?.[0]?.text;
      if (!text) continue;
      contents.push({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text }],
      });
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: payload.message || '' }],
  });

  const upstream = await fetch(`${GEMINI_URL}&key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text:
              payload.context?.systemPrompt ||
              'You are the BONE BREAKER warrior AI Coach.',
          },
        ],
      },
      contents,
      generationConfig: { temperature: 0.8 },
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const err = (await upstream.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    return json(
      {
        error:
          err?.error?.message ||
          `Gemini API Error: Status ${upstream.status}. Verify your API key in Settings.`,
      },
      502
    );
  }

  const body = upstream.body;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = '';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';
          for (const event of events) {
            const text = eventText(event);
            if (text) controller.enqueue(sse({ text }));
          }
        }
        if (buffer.trim()) {
          const text = eventText(buffer);
          if (text) controller.enqueue(sse({ text }));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to generate response.';
        controller.enqueue(
          sse({ text: `\n\n[Coach Communication Note: ${message}]` })
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
