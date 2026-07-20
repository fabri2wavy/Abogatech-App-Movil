/**
 * Servicio ligero para interactuar con la API REST de Gemini.
 * Usa fetch nativo — sin SDKs adicionales.
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const MODEL = 'gemini-2.0-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ─── System prompt especializado en derecho boliviano ────────────
const SYSTEM_INSTRUCTION = `Eres un asistente legal especializado en derecho boliviano. Tu nombre es "Asistente Legal Abogatech".

Reglas:
- Responde siempre en español.
- Sé conciso pero preciso. Usa lenguaje profesional pero accesible.
- Cuando cites artículos de ley, indica la norma completa (ej: "Art. 120 del Código de Procedimiento Civil").
- Si no estás seguro de algo, dilo claramente. No inventes artículos ni normas.
- Enfócate en legislación boliviana: Constitución Política del Estado, Código Civil, Código Penal, Código de Procedimiento Civil, Código de Familias, Ley del Órgano Judicial, etc.
- No des asesoría legal definitiva. Aclara que tus respuestas son orientativas y que el abogado debe verificar.`;

// ─── Types ───────────────────────────────────────────────────────
export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// ─── Send message to Gemini ──────────────────────────────────────
export async function sendMessageToGemini(
  history: GeminiMessage[],
  userMessage: string
): Promise<string> {
  // Build the contents array with history + new user message
  const contents: GeminiMessage[] = [
    ...history,
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Gemini API error:', response.status, errorBody);
    
    if (response.status === 429 || errorBody.toLowerCase().includes('quota')) {
      throw new Error('El asistente está procesando muchas consultas en este momento. Por favor, intente de nuevo en un minuto.');
    }

    throw new Error(`Error de la API (${response.status})`);
  }

  const data = await response.json();

  // Extract the text from the response
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    'No pude generar una respuesta. Intente reformular su consulta.';

  return text;
}
