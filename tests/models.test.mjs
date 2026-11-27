import test from "node:test";
import assert from "node:assert/strict";

import { fetchEndpointModels, isChatModelId } from "../lib/models.js";
import { ModelCatalog } from "../lib/catalog.js";

test("isChatModelId keeps chat models and drops media families", () => {
  for (const id of ["auto", "qwen4-max", "qwen3.8-max", "deepseek-v4.1-flash", "glm-5.3", "kimi-k2.6"]) {
    assert.equal(isChatModelId(id), true, id);
  }
  for (const id of [
    "wan2.7-image", "wan3.0-video", "qwen-image-3.0-pro",
    "qwen-audio-3.0-tts-plus", "qwen-audio-3.0-asr-flash", "qwen-audio-3.0-realtime-plus",
    "qwen3-tts-flash", "qwen3-asr-flash", "cosyvoice-v3-plus", "paraformer-v2",
    "text-embedding-v4", "qwen3-rerank", "qwen3.5-ocr", "decision-model-preview",
  ]) {
    assert.equal(isChatModelId(id), false, id);
  }
  assert.equal(isChatModelId(""), false);
});

test("fetchEndpointModels reads data ids and surfaces HTTP failures", async () => {
  const okFetch = async (url, init) => {
    assert.match(String(url), /\/compatible-mode\/v1\/models$/);
    assert.equal(init.headers.authorization, "Bearer sk-sp-test");
    return new Response(JSON.stringify({
      object: "list",
      data: [{ id: "qwen4-max" }, { id: "wan2.7-image" }, { id: "" }],
    }), { status: 200 });
  };
  const ids = await fetchEndpointModels({ baseURL: "https://example.test/compatible-mode/v1/", apiKey: "sk-sp-test", fetchImpl: okFetch });
  assert.deepEqual(ids, ["qwen4-max", "wan2.7-image"]);

  const denied = async () => new Response("unauthorized", { status: 401 });
  await assert.rejects(
    () => fetchEndpointModels({ baseURL: "https://example.test/v1", apiKey: "x", fetchImpl: denied }),
    /HTTP 401/,
  );
});

test("endpoint models merge into the catalogue without reasoning guesses", () => {
  const catalog = new ModelCatalog();
  const before = catalog.snapshot().length;
  catalog.setEndpointModels(["qwen4-max", "qwen5-max"]);
  const after = catalog.snapshot();
  assert.equal(after.length, before + 1);
  assert.equal(catalog.source, "endpoint");
  assert.equal(catalog.endpointCount, 2);
  const added = after.find((model) => model.id === "qwen5-max");
  assert.equal(added.contextWindow, 262_144);
  assert.equal(added.reasoning, undefined);
  // Endpoint-discovered models still appear in the picker as text models.
  assert.deepEqual(added.input, ["text"]);
});

test("endpoint discovery wins over non-advertised console rows", () => {
  const catalog = new ModelCatalog();
  catalog.setEndpointModels(["qwen4-max", "qwen5-max"]);
  catalog.setConsoleModels([
    { modelId: "qwen3.6-plus", capabilities: ["TG", "Reasoning"], editions: ["TEAM"], name: "Qwen3.6-Plus" },
    { modelId: "qwen-audio-3.0-realtime-plus", capabilities: ["TG"], editions: ["PERSONAL"], name: "Realtime" },
    { modelId: "qwen4-max", capabilities: ["TG", "VU", "Reasoning"], editions: ["PERSONAL"], name: "Qwen4-Max" },
  ]);
  const ids = catalog.snapshot().map((model) => model.id);
  assert.ok(ids.includes("qwen5-max"));
  assert.ok(ids.includes("qwen4-max-preview"));
  assert.ok(!ids.includes("qwen3.6-plus"));
  assert.ok(!ids.includes("qwen-audio-3.0-realtime-plus"));
});

test("DeepSeek V4.1 Flash keeps vision while V4 Pro stays text", () => {
  const catalog = new ModelCatalog();
  const flash = catalog.find("deepseek-v4.1-flash");
  const flash1017 = catalog.find("deepseek-v4.1-flash-1017");
  const pro = catalog.find("deepseek-v4-pro");
  assert.deepEqual(flash.input, ["text", "image"]);
  assert.ok(flash.capabilities.includes("VU"));
  assert.deepEqual(flash1017.input, ["text", "image"]);
  assert.deepEqual(pro.input, ["text"]);
  // A console row that omits VU must not erase the shipped vision capability.
  catalog.setConsoleModels([{ modelId: "deepseek-v4.1-flash", capabilities: ["TG", "Reasoning"], editions: ["PERSONAL"], name: "DeepSeek-V4.1-Flash" }]);
  assert.deepEqual(catalog.find("deepseek-v4.1-flash").input, ["text", "image"]);
});

test("GLM context and output limits follow the model pages", () => {
  const catalog = new ModelCatalog();
  for (const id of ["glm-5.3", "glm-5.2"]) {
    const model = catalog.find(id);
    assert.equal(model.contextWindow, 1_048_576);
    assert.equal(model.maxTokens, 131_072);
    assert.deepEqual(model.input, ["text"]);
  }
});
