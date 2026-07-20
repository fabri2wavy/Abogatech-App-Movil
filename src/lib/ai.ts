/**
 * Cliente IA — Groq (Llama 3.3 70B Versatile)
 * Usa la API compatible con OpenAI via fetch nativo.
 */

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `Eres un asistente legal experto en la legislación boliviana para la firma Iturri & Asociados. Tu nombre es "Asistente Legal Abogatech".

Reglas:
- Responde siempre en español.
- Sé conciso, profesional y directo.
- Cuando cites artículos de ley, indica la norma completa (ej: "Art. 120 del Código de Procedimiento Civil").
- Si no estás seguro de algo, dilo claramente. No inventes artículos ni normas.
- Enfócate en legislación boliviana: Constitución Política del Estado, Código Civil, Código Penal, Código de Procedimiento Civil, Código de Familias, Ley del Órgano Judicial, etc.
- No des asesoría legal definitiva. Aclara que tus respuestas son orientativas y que el abogado debe verificar.`;

// ─── Types ───────────────────────────────────────────────────────
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ─── Send message ────────────────────────────────────────────────
export async function sendMessageToAI(
  history: AIMessage[],
  userMessage: string
): Promise<string> {
  // Build messages array: system + history + new user message
  const messages: AIMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Groq API error:', response.status, errorBody);

    if (response.status === 429 || errorBody.toLowerCase().includes('rate')) {
      throw new Error(
        'El asistente está procesando muchas consultas en este momento. Por favor, intente de nuevo en un minuto.'
      );
    }

    throw new Error(`Error de la API (${response.status})`);
  }

  const data = await response.json();

  const text =
    data?.choices?.[0]?.message?.content ??
    'No pude generar una respuesta. Intente reformular su consulta.';

  return text;
}
