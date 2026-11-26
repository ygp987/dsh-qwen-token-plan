import test from "node:test";
import assert from "node:assert/strict";

import { TokenPlanConsole, localDate } from "../lib/console.js";
import { ModelCatalog, BUILTIN_MODELS } from "../lib/catalog.js";
import { trustedRequest } from "../lib/guard.js";

const ok = (body) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { "content-type": "application/json" },
});

const envelope = (data) => ({ data: { DataV2: { data: { success: true, data } } } });

function fakeGateway({ subscription, usage, quota, equity, models, benefits, daily, addons = { total: 0, items: [] } }) {
  return async (url, init = {}) => {
    if (String(url).endsWith("/tool/user/info.json")) {
      return ok({ data: { secToken: "sec-token" } });
    }
    if (!String(url).includes("cs-data.qianwenai.com")) return ok({});
    assert.equal(init.method, "POST");
    const body = new URLSearchParams(String(init.body));
    assert.equal(body.get("sec_token"), "sec-token");
    const api = new URL(url).searchParams.get("api");
    if (api.endsWith("/subscription")) return ok(envelope(subscription));
    if (api.endsWith("/usage")) return ok(envelope(usage));
    if (api.endsWith("/quota-config")) return ok(envelope(quota));
    if (api.endsWith("/addon/list")) return ok(envelope(addons));
    if (api.includes("queryTokenPlanEquityInfo")) return ok(envelope(equity));
    if (api.includes("getModelMonitorDataWithOss")) {
      return ok({ data: { DataV2: { data: { success: true, data: daily } } } });
    }
    if (api.includes("listTokenPlanModels")) return ok(envelope(models));
    if (api.includes("token-plan.detail")) return ok(envelope(benefits));
    throw new Error(`unexpected api ${api}`);
  };
}

const fixture = {
  subscription: { specCode: "standard", status: "VALID", remainingDays: 22, startTime: 1_794_763_678_000, endTime: 1_797_436_800_000, autoRenewFlag: false },
  usage: { per1MonthPercentage: 0.545, per1MonthResetTime: 1_797_436_800_000 },
  quota: { standard: { five_hour: 3000, monthly: 80_000 }, pro: { five_hour: 12_000, monthly: 200_000 }, addon_quota: { extrabundle: 20_000 } },
  equity: {
    tokenPlanEquityInfos: [
      { equityType: "tokenplan_harnesstool_search_pro", totalQuota: 100, availableQuota: 90 },
      { equityType: "tokenplan_harnestool_webfetch", totalQuota: 1000, availableQuota: 1000 },
      { equityType: "unknown_type", totalQuota: 10, availableQuota: 5 },
    ],
  },
  models: {
    total: 35,
    list: [
      { modelId: "qwen4-max", capabilities: ["TG", "VU", "Reasoning"], editions: ["PERSONAL"], name: '{"zh-CN":"Qwen4-Max","en-US":"Qwen4-Max"}' },
      { modelId: "auto", capabilities: ["TG", "Reasoning"], editions: ["PERSONAL", "TEAM"], name: "Auto" },
      { modelId: "qwen-audio-3.0-asr-flash", capabilities: ["ASR"], editions: ["PERSONAL"], name: "ASR" },
    ],
  },
  benefits: {
    items: [
      { title: "图像生成 MCP", quotaUnit: "张", priceInfo: { currentPrice: "0.2112", originalPrice: "0.24", currency: "¥" }, planCodes: ["tokenplan_harnesstool_image_generation"], mcpInfo: { code: "TextGenerateImage" } },
    ],
  },
  daily: {
    originData: [
      {
        metricName: "model_usage",
        labels: { unit: "tokens", usage_type: "total_tokens" },
        points: [
          { value: 1000, timestamp: Date.UTC(2026, 10, 18, 4, 0, 0) },
          { value: 2000, timestamp: Date.UTC(2026, 10, 19, 4, 0, 0) },
        ],
      },
      {
        metricName: "model_usage",
        labels: { unit: "tokens", usage_type: "cached_tokens" },
        points: [
          { value: 800, timestamp: Date.UTC(2026, 10, 18, 4, 0, 0) },
          { value: 1500, timestamp: Date.UTC(2026, 10, 19, 4, 0, 0) },
        ],
      },
      {
        metricName: "model_usage",
        labels: { unit: "tokens", usage_type: "input_tokens" },
        points: [
          { value: 900, timestamp: Date.UTC(2026, 10, 18, 4, 0, 0) },
          { value: 1900, timestamp: Date.UTC(2026, 10, 19, 4, 0, 0) },
        ],
      },
      {
        metricName: "model_usage",
        labels: { unit: "tokens", usage_type: "output_tokens" },
        points: [
          { value: 100, timestamp: Date.UTC(2026, 10, 18, 4, 0, 0) },
          { value: 200, timestamp: Date.UTC(2026, 10, 19, 4, 0, 0) },
        ],
      },
    ],
  },
};

test("console plan reads tier, credits and remaining percentage", async () => {
  const client = new TokenPlanConsole({ cookie: "cna=x; foo=bar", fetchImpl: fakeGateway(fixture) });
  const plan = await client.plan();
  assert.equal(plan.specCode, "standard");
  assert.equal(plan.tierName, "Standard");
  // Standard is 80,000 credits; the 20,000 in addon_quota is only the
  // purchasable pack size, and this account owns none.
  assert.equal(plan.monthlyCredits, 80_000);
  assert.equal(plan.addonCredits, 0);
  assert.equal(plan.addonActive, false);
  assert.equal(plan.remainingCredits, 36_400);
  assert.equal(Math.round(plan.remainingPercent * 1000) / 1000, 45.5);
  assert.equal(plan.remainingDays, 22);
  assert.equal(plan.autoRenew, false);
});

test("console equity maps known types and drops unknown ones", async () => {
  const client = new TokenPlanConsole({ cookie: "c", fetchImpl: fakeGateway(fixture) });
  const equity = await client.equity();
  assert.deepEqual(equity.map((row) => row.key), ["search_pro", "webfetch"]);
  assert.equal(equity[0].title, "联网搜索增强");
  assert.equal(equity[0].unit, "次");
  assert.equal(equity[0].available, 90);
});

test("console daily buckets points into Asia/Shanghai dates", async () => {
  const client = new TokenPlanConsole({ cookie: "c", fetchImpl: fakeGateway(fixture) });
  const daily = await client.daily(7);
  assert.deepEqual(daily.rows.map((row) => row.date), ["2026-11-18", "2026-11-19"]);
  assert.equal(daily.rows[0].total, 1000);
  assert.equal(daily.rows[0].cached, 800);
  assert.equal(daily.rows[1].output, 200);
  assert.equal(daily.totals.total, 3000);
  assert.equal(daily.totals.cached, 2300);
  assert.equal(daily.totals.input, 2800);
  assert.equal(Math.round(daily.totals.cacheRate), 45);
  assert.equal(localDate(Date.UTC(2026, 10, 18, 4, 0, 0)), "2026-11-18");
});

test("console models returns total and raw list", async () => {
  const client = new TokenPlanConsole({ cookie: "c", fetchImpl: fakeGateway(fixture) });
  const models = await client.models();
  assert.equal(models.total, 35);
  assert.equal(models.list.length, 3);
});

test("console benefits maps price and plan codes", async () => {
  const client = new TokenPlanConsole({ cookie: "c", fetchImpl: fakeGateway(fixture) });
  const benefits = await client.benefits();
  assert.equal(benefits.length, 1);
  assert.equal(benefits[0].unit, "张");
  assert.equal(benefits[0].currentPrice, "0.2112");
  assert.equal(benefits[0].mcpCode, "TextGenerateImage");
});

test("console requires a cookie", async () => {
  const client = new TokenPlanConsole({ cookie: "" });
  await assert.rejects(() => client.plan(), /未配置控制台 Cookie/);
});

test("catalog merges console metadata and hides excluded ids", () => {
  const catalog = new ModelCatalog({ excluded: ["glm-5.2"], extraIds: ["my-model"] });
  const before = catalog.snapshot();
  assert.equal(before.length, BUILTIN_MODELS.length - 1 + 1);
  assert.equal(before.find((model) => model.id === "my-model").contextWindow, 262_144);
  assert.ok(before.find((model) => model.id === "qwen4-max").capabilities.includes("VU"));

  catalog.setConsoleModels([
    { modelId: "qwen4-max", capabilities: ["TG", "VU", "Reasoning"], editions: ["PERSONAL"], name: '{"zh-CN":"Qwen4-Max 旗舰"}' },
    { modelId: "qwen3.6-plus", capabilities: ["TG", "VU", "Reasoning"], editions: ["TEAM"], name: "Qwen3.6-Plus" },
    { modelId: "qwen-audio-3.0-asr-flash", capabilities: ["ASR"], editions: ["PERSONAL"], name: "ASR" },
  ]);
  const after = catalog.snapshot();
  assert.equal(after.find((model) => model.id === "qwen4-max").name, "Qwen4-Max 旗舰");
  assert.ok(after.some((model) => model.id === "qwen3.6-plus"));
  assert.ok(!after.some((model) => model.id === "qwen-audio-3.0-asr-flash"));
  assert.ok(!after.some((model) => model.id === "glm-5.2"));
  assert.equal(catalog.find("qwen4-max").input.join(","), "text,image");
});

test("route guard admits loopback requests and rejects rebinding", () => {
  assert.equal(trustedRequest({ headers: { host: "127.0.0.1:44707" } }, "127.0.0.1"), true);
  assert.equal(trustedRequest({ headers: { host: "localhost:44707", origin: "http://localhost:44707" } }, "127.0.0.1"), true);
  assert.equal(trustedRequest({ headers: { host: "evil.example:49419", origin: "http://evil.example:49419" } }, "127.0.0.1"), false);
  assert.equal(trustedRequest({ headers: { host: "127.0.0.1:44707", "sec-fetch-site": "cross-site" } }, "127.0.0.1"), false);
  assert.equal(trustedRequest({ headers: { host: "127.0.0.1:44707", origin: "http://127.0.0.1:5555" } }, "127.0.0.1"), false);
  assert.equal(trustedRequest({ headers: { host: "127.0.0.1:44707", origin: "null" } }, "127.0.0.1"), false);
});

test("owned add-on packs extend the monthly credits", async () => {
  const withAddon = {
    ...fixture,
    addons: { total: 1, items: [{ quota: 20_000 }] },
  };
  const client = new TokenPlanConsole({ cookie: "c", fetchImpl: fakeGateway(withAddon) });
  const plan = await client.plan();
  assert.equal(plan.addonCredits, 20_000);
  assert.equal(plan.addonActive, true);
  assert.equal(plan.monthlyCredits, 100_000);
  assert.equal(plan.remainingCredits, 45_500);
});
