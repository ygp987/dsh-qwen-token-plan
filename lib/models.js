/**
 * Dynamic model discovery through the Token Plan endpoint.
 *
 * The platform's OpenAI-compatible endpoint does serve `GET /models` with the
 * subscription key (verified 2026-11-26: HTTP 200, 22 entries). The official
 * DSH guide still says this returns 401/404; that note is outdated. Querying it
 * is cheaper and more complete than the console's `listTokenPlanModels`, which
 * caps a reply at ten rows.
 *
 * The endpoint returns model ids only, including media models (image, video,
 * TTS, ASR, realtime). DSH's provider route can only chat with text models, so
 * media ids are filtered out here while still remaining discoverable in the
 * platform console.
 */

/** Known non-chat families served by the same endpoint. */
const MEDIA_FAMILY = /(^|\/)(wan|qwen-image|qwen-audio|cosyvoice|sambert|paraformer|fun-asr|qwen3-tts|qwen3-asr|qwen3-omni|qwen3-vl-embedding|text-embedding|multimodal-embedding|tongyi-embedding|qwen3-rerank|gte-rerank|qwen3\.5-ocr|qwen-vl-ocr|qwen-doc|qwen-mt|qwen3-livetranslate|qwen3\.8-livetranslate|voice-enrollment|qwen-voice-enrollment|gui-plus|decision-model)/i;

/** Suffixes that always mean a non-chat modality. */
const MEDIA_SUFFIX = /-(image|video|tts|asr|realtime|embedding|rerank|ocr)(-|$)/i;

/**
 * Is this endpoint model id usable as a DSH chat model?
 * @param id - model id from `GET /models`.
 */
export function isChatModelId(id) {
  const text = String(id ?? "").trim();
  if (text === "" || text.length > 200) return false;
  if (MEDIA_FAMILY.test(text) || MEDIA_SUFFIX.test(text)) return false;
  return true;
}

/**
 * Read the model ids advertised by the Token Plan endpoint.
 * @returns the raw ids in endpoint order; throws when the endpoint is unreachable.
 */
export async function fetchEndpointModels({ baseURL, apiKey, fetchImpl = globalThis.fetch, timeoutMs = 15_000, signal }) {
  const url = `${String(baseURL).replace(/\/+$/, "")}/models`;
  const timeout = AbortSignal.timeout(timeoutMs);
  const response = await fetchImpl(url, {
    headers: {
      authorization: `Bearer ${apiKey}`,
      accept: "application/json",
    },
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`GET /models HTTP ${response.status}: ${text.slice(0, 160)}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("GET /models returned non-JSON");
  }
  const rows = Array.isArray(parsed?.data) ? parsed.data : Array.isArray(parsed) ? parsed : [];
  return rows
    .map((row) => (typeof row === "string" ? row : row?.id))
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter((id) => id !== "");
}
