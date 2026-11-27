/**
 * Model catalog for the Qianwen Token Plan route.
 *
 * The platform's OpenAI-compatible endpoint does not serve `GET /models`
 * (the official DSH guide records 401/404 for that button), so the catalog is
 * a shipped snapshot merged with two live sources when they are available:
 *   - the console's `listTokenPlanModels` (authoritative ids, names, capabilities)
 *   - explicit `models` ids from the plugin config (always appended)
 */

import { isChatModelId } from "./models.js";

/** Console capability codes → DSH model metadata. */
const CAPABILITY_MEANING = Object.freeze({
  TG: "text generation",
  VU: "vision understanding",
  Reasoning: "reasoning",
  ASR: "speech recognition",
  TTS: "speech synthesis",
});

/**
 * Shipped snapshot of the Token Plan text-generation catalogue.
 * Context/max-output values follow the platform docs and console metadata
 * captured 2026-11-24; `contextWindow` stays conservative where the docs do
 * not publish a number so DSH compacts before the provider rejects a request.
 */
export const BUILTIN_MODELS = Object.freeze([
  { id: "auto", name: "Auto", capabilities: ["TG", "Reasoning"], contextWindow: 1_000_000, maxTokens: 32_768 },
  { id: "qwen4-max", name: "Qwen4-Max", capabilities: ["TG", "VU", "Reasoning"], contextWindow: 1_000_000, maxTokens: 262_144, isNew: true },
  { id: "qwen4-max-preview", name: "Qwen4.0-Max-Preview", capabilities: ["TG", "VU", "Reasoning"], contextWindow: 1_000_000, maxTokens: 262_144, isNew: true },
  { id: "qwen3.8-max", name: "Qwen3.8-Max", capabilities: ["TG", "VU", "Reasoning"], contextWindow: 983_616, maxTokens: 131_072, isNew: true },
  { id: "qwen3.8-flash", name: "Qwen3.8-Flash", capabilities: ["TG", "VU", "Reasoning"], contextWindow: 983_616, maxTokens: 131_072 },
  { id: "qwen3.7-plus", name: "Qwen3.7-Plus", capabilities: ["TG", "VU", "Reasoning"], contextWindow: 262_144, maxTokens: 65_536 },
  { id: "qwen3.7-max", name: "Qwen3.7-Max", capabilities: ["TG", "Reasoning"], contextWindow: 262_144, maxTokens: 65_536 },
  { id: "qwen3.6-flash", name: "Qwen3.6-Flash", capabilities: ["TG", "VU", "Reasoning"], contextWindow: 262_144, maxTokens: 65_536 },
  { id: "deepseek-v4.1-flash", name: "DeepSeek-V4.1-Flash", capabilities: ["TG", "VU", "Reasoning"], contextWindow: 1_000_000, maxTokens: 393_216 },
  { id: "deepseek-v4.1-flash-1017", name: "DeepSeek-V4.1-Flash-1017", capabilities: ["TG", "VU", "Reasoning"], contextWindow: 1_000_000, maxTokens: 393_216 },
  { id: "deepseek-v4-pro", name: "DeepSeek-V4-Pro", capabilities: ["TG", "Reasoning"], contextWindow: 1_000_000, maxTokens: 393_216 },
  { id: "deepseek-v4-pro-0813", name: "DeepSeek-V4-Pro-0813", capabilities: ["TG", "Reasoning"], contextWindow: 1_000_000, maxTokens: 393_216 },
  { id: "deepseek-v4-flash-0731", name: "DeepSeek-V4-Flash-0731", capabilities: ["TG", "Reasoning"], contextWindow: 1_000_000, maxTokens: 393_216 },
  { id: "glm-5.3", name: "GLM-5.3", capabilities: ["TG", "Reasoning"], contextWindow: 1_048_576, maxTokens: 131_072 },
  { id: "glm-5.2", name: "GLM-5.2", capabilities: ["TG", "Reasoning"], contextWindow: 1_048_576, maxTokens: 131_072 },
]);

const TEXT_CAPABILITIES = new Set(["TG"]);

const EFFORT_IDS = Object.freeze(["none", "low", "medium", "high", "xhigh"]);

function budgetMode(efforts, defaultEffort, budget, canDisable = true) {
  return Object.freeze({
    mode: "budget",
    efforts: Object.freeze(efforts),
    defaultEffort,
    canDisable,
    budget: Object.freeze(budget ?? { low: 1024, medium: 4096, high: 16_384, xhigh: 32_768 }),
  });
}

function effortMode(efforts, defaultEffort, map, canDisable = true) {
  return Object.freeze({
    mode: "effort",
    efforts: Object.freeze(efforts),
    defaultEffort,
    canDisable,
    map: Object.freeze(map ?? {}),
  });
}

/**
 * Thinking controls per model family, taken from the platform's Thinking guide
 * (2026-11-24):
 *   - `effort`  → `enable_thinking` + `reasoning_effort` (Qwen4 / Qwen3.8 Max)
 *   - `budget`  → `enable_thinking` + `thinking_budget` (Qwen3.x, GLM, Kimi)
 *   - `toggle`  → `enable_thinking` only (DeepSeek V4 has no depth parameter)
 * `canDisable: false` marks always-thinking models such as glm-5.3.
 */
const REASONING = Object.freeze({
  auto: effortMode(["low", "medium", "high", "xhigh"], "medium", { low: "low", medium: "medium", high: "high", xhigh: "xhigh" }),
  "qwen4-max": effortMode(EFFORT_IDS, "high", { low: "low", medium: "high", high: "high", xhigh: "xhigh" }),
  "qwen4-max-preview": effortMode(["none", "low", "medium", "xhigh"], "xhigh", { low: "low", medium: "medium", high: "xhigh", xhigh: "xhigh" }),
  "qwen3.8-max": effortMode(["none", "low", "medium", "xhigh"], "xhigh", { low: "low", medium: "medium", high: "xhigh", xhigh: "xhigh" }),
  "qwen3.8-flash": budgetMode(["none", "low", "medium", "high", "xhigh"], "high"),
  "qwen3.7-plus": budgetMode(["none", "low", "medium", "high", "xhigh"], "high"),
  "qwen3.7-max": budgetMode(["none", "low", "medium", "high", "xhigh"], "high"),
  "qwen3.6-flash": budgetMode(["none", "low", "medium", "high", "xhigh"], "high"),
  "deepseek-v4.1-flash": Object.freeze({ mode: "toggle", efforts: Object.freeze(["none", "high"]), defaultEffort: "high", canDisable: true }),
  "deepseek-v4.1-flash-1017": Object.freeze({ mode: "toggle", efforts: Object.freeze(["none", "high"]), defaultEffort: "high", canDisable: true }),
  "deepseek-v4-pro": Object.freeze({ mode: "toggle", efforts: Object.freeze(["none", "high"]), defaultEffort: "high", canDisable: true }),
  "deepseek-v4-pro-0813": Object.freeze({ mode: "toggle", efforts: Object.freeze(["none", "high"]), defaultEffort: "high", canDisable: true }),
  "deepseek-v4-flash-0731": Object.freeze({ mode: "toggle", efforts: Object.freeze(["none", "high"]), defaultEffort: "high", canDisable: true }),
  "glm-5.3": budgetMode(["low", "medium", "high"], "medium", { low: 2048, medium: 8192, high: 16_384 }, false),
  "glm-5.2": budgetMode(["none", "low", "medium", "high"], "medium", { low: 2048, medium: 8192, high: 16_384 }),
});

/**
 * Thinking metadata for one model id, or undefined when it cannot think.
 * `hasReasoning` comes from console capabilities; endpoint ids carry no
 * capabilities, so an unknown model only gets a thinking selector when the
 * console explicitly marked it.
 */
export function reasoningOf(id, hasReasoning = false) {
  const known = REASONING[id];
  if (known) {
    // Always-thinking models must not offer "none".
    return known.canDisable === false
      ? { ...known, efforts: known.efforts.filter((effort) => effort !== "none") }
      : known;
  }
  return hasReasoning ? budgetMode(["none", "low", "medium", "high"], "high") : undefined;
}


function normalizeCapabilities(list) {
  const caps = Array.isArray(list) ? list.map(String).filter((item) => item in CAPABILITY_MEANING) : [];
  return caps.length > 0 ? caps : ["TG"];
}

function isChatModel(model) {
  return normalizeCapabilities(model?.capabilities).some((cap) => TEXT_CAPABILITIES.has(cap));
}

function parseLocalizedName(value) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const text = value.trim();
  if (!text.startsWith("{")) return text;
  try {
    const parsed = JSON.parse(text);
    return parsed?.["zh-CN"] ?? parsed?.["en-US"] ?? Object.values(parsed ?? {})[0];
  } catch {
    return undefined;
  }
}

function modalityOf(capabilities) {
  return capabilities.includes("VU") ? ["text", "image"] : ["text"];
}

/** Console entry → catalog entry. Returns undefined for non-chat models. */
export function fromConsoleModel(raw) {
  const id = typeof raw?.modelId === "string" ? raw.modelId.trim() : "";
  if (id === "" || !isChatModel(raw)) return undefined;
  const capabilities = normalizeCapabilities(raw.capabilities);
  const editions = Array.isArray(raw.editions) ? raw.editions.map(String) : [];
  return {
    id,
    name: parseLocalizedName(raw.name) ?? id,
    capabilities,
    editions,
    isNew: raw.isNew === true,
    input: modalityOf(capabilities),
  };
}

function capabilitiesOf(list) {
  return normalizeCapabilities(list);
}

/**
 * Merge the builtin snapshot, console entries, and configured extra ids.
 * Builtin specs win on context/maxTokens; console wins on display name and
 * capabilities because it reflects what the subscription can actually use.
 */
export class ModelCatalog {
  #builtin;
  #extraIds;
  #excluded;
  #console = new Map();
  #endpoint = new Set();
  #endpointAt = 0;
  #defaultContext;
  #defaultMaxTokens;

  constructor({ extraIds = [], excluded = [], defaultContextWindow = 262_144, defaultMaxTokens = 32_768 } = {}) {
    this.#builtin = BUILTIN_MODELS.map((model) => ({ ...model, capabilities: [...model.capabilities] }));
    this.#extraIds = [...new Set(extraIds.map(String).map((id) => id.trim()).filter(Boolean))];
    this.#excluded = new Set(excluded.map(String));
    this.#defaultContext = Number.isFinite(defaultContextWindow) && defaultContextWindow > 0 ? defaultContextWindow : 262_144;
    this.#defaultMaxTokens = Number.isFinite(defaultMaxTokens) && defaultMaxTokens > 0 ? defaultMaxTokens : 32_768;
  }

  /** Replace the live console catalogue (or clear it with an empty list). */
  setConsoleModels(list) {
    this.#console = new Map();
    for (const raw of Array.isArray(list) ? list : []) {
      const model = fromConsoleModel(raw);
      if (model) this.#console.set(model.id, model);
    }
  }

  /** Replace the endpoint-advertised chat ids (`GET /models`). */
  setEndpointModels(ids) {
    this.#endpoint = new Set((Array.isArray(ids) ? ids : []).map(String).filter(Boolean));
    this.#endpointAt = Date.now();
  }

  /** Which source last enriched the catalogue: endpoint, console, or builtin. */
  get source() {
    if (this.#endpoint.size > 0) return "endpoint";
    if (this.#console.size > 0) return "console";
    return "builtin";
  }

  get endpointCount() {
    return this.#endpoint.size;
  }

  snapshot() {
    const byId = new Map();
    for (const builtin of this.#builtin) {
      const live = this.#console.get(builtin.id);
      // Union the shipped specs with console metadata: the console list is
      // capped at ten rows and has omitted vision for known multimodal models.
      const capabilities = [...new Set([
        ...capabilitiesOf(builtin.capabilities),
        ...capabilitiesOf(live?.capabilities),
      ])];
      byId.set(builtin.id, {
        ...builtin,
        ...(live ? { name: live.name || builtin.name, editions: live.editions } : {}),
        capabilities,
        input: modalityOf(capabilities),
        reasoning: capabilities.includes("Reasoning") ? reasoningOf(builtin.id, true) : undefined,
      });
    }
    const endpointActive = this.#endpoint.size > 0;
    const builtinIds = new Set(this.#builtin.map((model) => model.id));
    for (const live of this.#console.values()) {
      if (byId.has(live.id)) continue;
      // With live endpoint discovery, the console list is metadata only: do not
      // resurrect models the subscription no longer advertises (for example a
      // TEAM-only upsell row) unless they are shipped or explicitly configured.
      if (endpointActive && !this.#endpoint.has(live.id) && !builtinIds.has(live.id) && !this.#extraIds.includes(live.id)) continue;
      byId.set(live.id, {
        ...live,
        contextWindow: this.#defaultContext,
        maxTokens: this.#defaultMaxTokens,
        reasoning: live.capabilities.includes("Reasoning") ? reasoningOf(live.id, true) : undefined,
      });
    }
    for (const id of this.#endpoint) {
      if (byId.has(id)) continue;
      const reasoning = reasoningOf(id, false);
      byId.set(id, {
        id,
        name: id,
        capabilities: ["TG"],
        editions: [],
        contextWindow: this.#defaultContext,
        maxTokens: this.#defaultMaxTokens,
        input: ["text"],
        ...(reasoning ? { reasoning } : {}),
      });
    }
    for (const id of this.#extraIds) {
      if (byId.has(id)) continue;
      byId.set(id, {
        id,
        name: id,
        capabilities: ["TG"],
        editions: [],
        contextWindow: this.#defaultContext,
        maxTokens: this.#defaultMaxTokens,
        input: ["text"],
      });
    }
    return [...byId.values()].filter((model) => !this.#excluded.has(model.id));
  }

  find(id) {
    return this.snapshot().find((model) => model.id === id);
  }
}

export { CAPABILITY_MEANING };
