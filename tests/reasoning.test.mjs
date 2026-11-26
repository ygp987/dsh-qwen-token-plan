import test from "node:test";
import assert from "node:assert/strict";

import { ModelCatalog } from "../lib/catalog.js";
import { reasoningParamsFor } from "../lib/reasoning.js";

const catalog = new ModelCatalog();
const model = (id) => catalog.find(id);

test("qwen4-max maps depth onto reasoning_effort", () => {
  assert.deepEqual(reasoningParamsFor(model("qwen4-max"), "high"), { enable_thinking: true, reasoning_effort: "high" });
  assert.deepEqual(reasoningParamsFor(model("qwen4-max"), "low"), { enable_thinking: true, reasoning_effort: "low" });
  // medium folds into high per the platform's documented Qwen4-Max mapping.
  assert.deepEqual(reasoningParamsFor(model("qwen4-max"), "medium"), { enable_thinking: true, reasoning_effort: "high" });
  assert.deepEqual(reasoningParamsFor(model("qwen4-max"), "none"), { enable_thinking: false });
});

test("qwen3.8-max offers low/medium/xhigh and its default", () => {
  const entry = model("qwen3.8-max");
  assert.deepEqual(entry.reasoning.efforts, ["none", "low", "medium", "xhigh"]);
  assert.deepEqual(reasoningParamsFor(entry, "medium"), { enable_thinking: true, reasoning_effort: "medium" });
  assert.deepEqual(reasoningParamsFor(entry, undefined), { enable_thinking: true, reasoning_effort: "xhigh" });
});

test("qwen3.8-flash uses thinking_budget instead of reasoning_effort", () => {
  const params = reasoningParamsFor(model("qwen3.8-flash"), "low");
  assert.equal(params.enable_thinking, true);
  assert.equal(params.thinking_budget, 1024);
  assert.equal("reasoning_effort" in params, false);
  assert.deepEqual(reasoningParamsFor(model("qwen3.8-flash"), "none"), { enable_thinking: false });
});

test("deepseek models only toggle thinking", () => {
  const high = reasoningParamsFor(model("deepseek-v4.1-flash"), "high");
  assert.deepEqual(high, { enable_thinking: true });
  assert.deepEqual(reasoningParamsFor(model("deepseek-v4.1-flash"), "none"), { enable_thinking: false });
});

test("glm-5.3 cannot disable thinking and keeps its budget", () => {
  assert.deepEqual(model("glm-5.3").reasoning.efforts, ["low", "medium", "high"]);
  assert.deepEqual(reasoningParamsFor(model("glm-5.3"), "none"), { enable_thinking: true });
  assert.deepEqual(reasoningParamsFor(model("glm-5.3"), "medium"), { enable_thinking: true, thinking_budget: 8192 });
});

test("models without reasoning metadata send no thinking fields", () => {
  assert.deepEqual(reasoningParamsFor({ id: "x" }, "high"), {});
  assert.deepEqual(reasoningParamsFor(undefined, "high"), {});
});
