/**
 * Reasoning-effort translation for the Qianwen Token Plan Chat Completions route.
 *
 * The platform exposes thinking depth in three different ways, so the model
 * catalogue records which one applies:
 *   - `effort` → `enable_thinking` + `reasoning_effort` (Qwen4 / Qwen3.8 Max)
 *   - `budget` → `enable_thinking` + `thinking_budget` (Qwen3.x, GLM, Kimi)
 *   - `toggle` → only `enable_thinking` (DeepSeek V4 has no depth parameter)
 *
 * Never send `reasoning_effort` together with `thinking_budget`: the platform
 * rejects that combination for qwen4-max-preview and qwen3.8-max.
 */

/** Display names for the thinking levels DSH offers. */
export const EFFORT_NAMES = Object.freeze({
  none: "关闭",
  minimal: "最小",
  low: "低",
  medium: "中",
  high: "高",
  xhigh: "超高",
  max: "最大",
});

/**
 * Translate one DSH reasoning effort into Qianwen thinking parameters.
 * @param model - catalogue entry with a `reasoning` descriptor.
 * @param effort - DSH effort id from the request, or undefined for the default.
 * @returns request fields to merge into the Chat Completions body.
 */
export function reasoningParamsFor(model, effort) {
  const reasoning = model?.reasoning;
  if (!reasoning) return {};
  const requested = typeof effort === "string" && effort !== "" ? effort : reasoning.defaultEffort;
  if (typeof requested !== "string" || requested === "") return {};
  const id = requested.toLowerCase();

  if (id === "none" || id === "off") {
    // Always-thinking models (glm-5.3) have no off switch; leave the default on.
    if (reasoning.canDisable === false) return { enable_thinking: true };
    return { enable_thinking: false };
  }

  if (reasoning.mode === "effort") {
    const mapped = reasoning.map?.[id] ?? (reasoning.efforts.includes(id) ? id : reasoning.defaultEffort);
    return { enable_thinking: true, ...(mapped ? { reasoning_effort: mapped } : {}) };
  }

  if (reasoning.mode === "budget") {
    const budget = reasoning.budget?.[id] ?? reasoning.budget?.[reasoning.defaultEffort];
    return { enable_thinking: true, ...(Number.isFinite(budget) ? { thinking_budget: budget } : {}) };
  }

  return { enable_thinking: true };
}

/** Human-readable effort names for a model, used by the console's model table. */
export function effortNamesFor(model) {
  const reasoning = model?.reasoning;
  if (!reasoning) return undefined;
  return {
    efforts: reasoning.efforts.map((id) => ({ id, name: EFFORT_NAMES[id] ?? id })),
    ...(reasoning.defaultEffort ? { defaultEffort: reasoning.defaultEffort } : {}),
  };
}
