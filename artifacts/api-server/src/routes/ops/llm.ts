import { GoogleGenAI } from "@google/genai";

let genai: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genai) {
    genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "missing-api-key" });
  }
  return genai;
}

const MODEL = "gemini-3.5-flash-lite";

export type LLMMessage = { role: "system" | "user" | "assistant"; content: string };

// Convertit un schéma JSON Schema (utilisé côté OpenAI) en schéma compatible Gemini
// (Gemini n'accepte pas "additionalProperties" et n'aime pas les unions de type ["string","null"]).
function toGeminiSchema(schema: any): any {
  if (schema === null || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);

  const { additionalProperties, ...rest } = schema;

  if (Array.isArray(rest.type)) {
    const nonNull = rest.type.filter((t: string) => t !== "null");
    rest.type = nonNull[0] ?? "string";
    rest.nullable = rest.type !== schema.type ? true : rest.nullable;
    if (schema.type.includes("null")) rest.nullable = true;
  }

  if (rest.properties) {
    rest.properties = Object.fromEntries(
      Object.entries(rest.properties).map(([k, v]) => [k, toGeminiSchema(v)])
    );
  }
  if (rest.items) rest.items = toGeminiSchema(rest.items);

  return rest;
}

export async function invokeLLM(options: {
  messages: LLMMessage[];
  response_format?: { type: "json_schema"; json_schema: { name: string; strict?: boolean; schema: object } };
  max_completion_tokens?: number;
}): Promise<{ choices: [{ message: { content: string } }] }> {
  const systemMessages = options.messages.filter((m) => m.role === "system").map((m) => m.content);
  const conversationMessages = options.messages.filter((m) => m.role !== "system");

  const contents = conversationMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const config: Record<string, unknown> = {
    maxOutputTokens: options.max_completion_tokens ?? 4096,
  };
  if (systemMessages.length > 0) {
    config.systemInstruction = systemMessages.join("\n\n");
  }
  if (options.response_format?.type === "json_schema") {
    config.responseMimeType = "application/json";
    config.responseSchema = toGeminiSchema(options.response_format.json_schema.schema);
  }

  const response = await getGenAI().models.generateContent({
    model: MODEL,
    contents,
    config,
  });

  return { choices: [{ message: { content: response.text ?? "" } }] };
}

export async function transcribeAudio(audioBuffer: Buffer, language = "fr"): Promise<string> {
  const langNames: Record<string, string> = { fr: "français", pt: "portugais", en: "anglais" };
  const langHint = langNames[language] ?? "français";

  const response = await getGenAI().models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: `Transcris fidèlement cet audio en ${langHint}. Réponds uniquement avec le texte transcrit, sans commentaire ni formatage additionnel.` },
          { inlineData: { mimeType: "audio/webm", data: audioBuffer.toString("base64") } },
        ],
      },
    ],
  });

  return (response.text ?? "").trim();
}
