/**
 * dsh-qwen-token-plan — Host half.
 *
 * Registers the Qianwen Token Plan OpenAI Chat Completions route, ships a model
 * catalogue, and serves the console panel's read-only data over same-origin
 * HTTP routes. The browser half lives in ./lib/client.js.
 */
import z from "@deepseek-ai/schemastery";
import { ModelCatalog } from "./lib/catalog.js";
import { fetchEndpointModels, isChatModelId } from "./lib/models.js";
import { QwenTokenPlanAdapter } from "./lib/adapter.js";
import {
  TokenPlanConsole,
  readConsoleCookie,
  localDate,
  TIER_NAMES,
  EQUITY_TYPES,
} from "./lib/console.js";
import { trustedRequest } from "./lib/guard.js";

export const name = "dsh-qwen-token-plan";

export const inject = ["llm", "timer", "credentials", "webServer"];

const DEFAULT_BASE_URL = "https://token-plan.maas.qianwenaiapi.com/compatible-mode/v1";
const ROUTE_PREFIX = "/qwen-token-plan";
const VERSION = "0.5.5";
const STATE_TTL_MS = 60_000;

export const Config = z.object({
  providerId: z.string().default("qwen-token-plan"),
  displayName: z.string().default("千问 Token Plan"),
  apiKeyEnv: z.string().role("credential-ref").default("QWEN_TOKEN_PLAN_API_KEY"),
  baseURL: z.string().default(DEFAULT_BASE_URL),
  consoleCookieEnv: z.string().role("credential-ref").default("BAILIAN_CONSOLE_COOKIE"),
  models: z.array(z.string()).default([]),
  excludeModels: z.array(z.string()).default([]),
  contextWindow: z.number().min(1024).default(262_144),
  maxTokens: z.number().min(1).default(32_768),
  requestTimeoutMs: z.number().min(1_000).default(120_000),
  consoleRefreshSeconds: z.number().min(10).default(60),
  catalogRefreshMinutes: z.number().min(0).default(30),
  registerProvider: z.boolean().default(true),
});

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

async function readJsonBody(req, limit = 16 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error("请求体过大");
    chunks.push(chunk);
  }
  if (size === 0) return {};
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("请求体不是 JSON");
  }
}

export function apply(ctx, config = {}) {
  const providerId = String(config.providerId || "qwen-token-plan").trim() || "qwen-token-plan";
  const displayName = String(config.displayName || "千问 Token Plan");
  const apiKeyEnv = String(config.apiKeyEnv || "QWEN_TOKEN_PLAN_API_KEY");
  const consoleCookieEnv = String(config.consoleCookieEnv || "BAILIAN_CONSOLE_COOKIE");
  const baseURL = String(config.baseURL || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const registerProvider = config.registerProvider !== false;
  const consoleTtl = Math.max(10, Number(config.consoleRefreshSeconds) || 60) * 1000;
  const defaultMaxTokens = Math.max(1, Number(config.maxTokens) || 32_768);

  const catalog = new ModelCatalog({
    extraIds: Array.isArray(config.models) ? config.models : [],
    excluded: Array.isArray(config.excludeModels) ? config.excludeModels : [],
    defaultContextWindow: Number(config.contextWindow) || 262_144,
    defaultMaxTokens,
  });

  const resolveApiKey = async () => {
    let value;
    try {
      const hit = await ctx.credentials.resolve(apiKeyEnv);
      value = hit?.value;
    } catch {
      // Credential service unavailable: fall back to the environment.
    }
    value ??= process.env[apiKeyEnv];
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`缺少 API Key（凭据 ${apiKeyEnv}）`);
    }
    return value.trim();
  };

  const readCookie = async () => {
    try {
      const hit = await ctx.credentials.resolve(consoleCookieEnv);
      if (typeof hit?.value === "string" && hit.value.trim() !== "") {
        return { cookie: hit.value.trim(), source: "credentials" };
      }
    } catch {
      // fall through
    }
    const fromEnv = process.env[consoleCookieEnv];
    if (typeof fromEnv === "string" && fromEnv.trim() !== "") {
      return { cookie: fromEnv.trim(), source: "env" };
    }
    const fromFile = await readConsoleCookie(consoleCookieEnv);
    if (fromFile) return { cookie: fromFile, source: "dotfile" };
    return { cookie: "", source: "none" };
  };

  const maskKey = (value) => (value.length <= 8 ? "…" : `…${value.slice(-4)}`);

  /** Whether a model API key is available, where it came from, and a safe hint. */
  const apiKeyInfo = async () => {
    try {
      const hit = await ctx.credentials.resolve(apiKeyEnv);
      const value = typeof hit?.value === "string" ? hit.value.trim() : "";
      if (value !== "") return { configured: true, source: "credentials", hint: maskKey(value) };
    } catch {
      // Credential service unavailable: fall back to the environment.
    }
    const fromEnv = process.env[apiKeyEnv];
    if (typeof fromEnv === "string" && fromEnv.trim() !== "") {
      return { configured: true, source: "env", hint: maskKey(fromEnv.trim()) };
    }
    return { configured: false, source: "none", hint: null };
  };

  // ---- Provider registration -------------------------------------------------
  let providerError;
  let adapterInstance;
  if (registerProvider) {
    try {
      ctx.llm.registerConfigurableProviders([{
        provider: providerId,
        displayName,
        settingsNs: "qwen-token-plan",
        settingsPath: [],
      }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // A reload can race the previous fiber's disposal; a duplicate declaration
      // means the route is already published, so keep going.
      if (!/already declared|DUPLICATE_DIRECTORY/i.test(message)) {
        providerError = `无法声明可配置 provider：${message}`;
        ctx.logger?.warn?.(new Error(`${name}: ${providerError}`));
      }
    }
    try {
      adapterInstance = new QwenTokenPlanAdapter({
        providerId,
        displayName,
        baseURL,
        catalog,
        resolveApiKey,
        attachments: ctx.get("attachments"),
        defaultMaxTokens,
        requestTimeoutMs: Number(config.requestTimeoutMs) || 120_000,
      });
      ctx.llm.registerAdapter([providerId], adapterInstance);
      ctx.logger?.info?.(`${name}: provider "${providerId}" registered (${baseURL})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/DUPLICATE_ADAPTER|already .*adapter|already registered/i.test(message)) {
        providerError = `无法注册 provider "${providerId}"：${message}`;
        ctx.logger?.warn?.(new Error(`${name}: ${providerError}`));
      }
    }
  }

  // ---- Model catalogue publication -------------------------------------------
  // The console's entitlement list is the only live source of model metadata
  // (the OpenAI-compatible endpoint has no GET /models). Publishing it notifies
  // DSH's model picker through `llm/adapters-updated`, so a background sync
  // reaches an open selector without a page reload.
  let modelSignature = "";
  let catalogSyncedAt = 0;
  const publishCatalog = ({ endpoint, console: consoleModels } = {}) => {
    if (Array.isArray(endpoint)) catalog.setEndpointModels(endpoint);
    if (Array.isArray(consoleModels)) catalog.setConsoleModels(consoleModels);
    const signature = catalog.snapshot().map((model) => model.id).join("|");
    catalogSyncedAt = Date.now();
    if (signature === modelSignature) return false;
    modelSignature = signature;
    try {
      ctx.llm.emitAdaptersUpdated?.();
    } catch (error) {
      ctx.logger?.warn?.(new Error(`${name}: adapters-updated notification failed: ${errorText(error)}`));
    }
    return true;
  };

  // ---- Console data cache ----------------------------------------------------
  const cache = { at: 0, days: 0, data: undefined, pending: undefined };
  const planCache = { at: 0, data: undefined, pending: undefined };

  /** Lightweight plan-only payload for the composer badge. */
  async function planPayload(force = false) {
    if (!force && planCache.data !== undefined && Date.now() - planCache.at < consoleTtl) return planCache.data;
    if (!force && planCache.pending !== undefined) return planCache.pending;
    const pending = (async () => {
      const { cookie } = await readCookie();
      if (cookie === "") {
        return { ok: true, configured: false, plan: null, error: "未配置控制台 Cookie" };
      }
      try {
        const plan = await new TokenPlanConsole({ cookie }).plan();
        return { ok: true, configured: true, plan, error: null };
      } catch (error) {
        return { ok: true, configured: true, plan: null, error: errorText(error) };
      }
    })();
    planCache.pending = pending;
    try {
      const data = await pending;
      planCache.data = data;
      planCache.at = Date.now();
      return data;
    } finally {
      if (planCache.pending === pending) planCache.pending = undefined;
    }
  }

  async function loadConsole(days, force) {
    const key = Math.min(90, Math.max(1, days));
    if (!force && cache.data !== undefined && cache.days === key && Date.now() - cache.at < consoleTtl) {
      return cache.data;
    }
    if (!force && cache.pending !== undefined && cache.days === key) return cache.pending;

    const pending = (async () => {
      const { cookie, source } = await readCookie();
      const result = {
        configured: cookie !== "",
        source,
        plan: undefined,
        planError: undefined,
        equity: [],
        equityError: undefined,
        daily: undefined,
        dailyError: undefined,
        benefits: [],
        benefitsError: undefined,
        modelsError: undefined,
        modelTotal: 0,
      };
      if (cookie === "") {
        result.planError = "未配置控制台 Cookie：套餐、用量与权益数据不可用";
        return result;
      }
      const client = new TokenPlanConsole({ cookie });
      const [plan, equity, daily, models, benefits] = await Promise.allSettled([
        client.plan(),
        client.equity(),
        client.daily(key),
        client.models(),
        client.benefits(),
      ]);
      if (plan.status === "fulfilled") result.plan = plan.value;
      else result.planError = errorText(plan.reason);
      if (equity.status === "fulfilled") result.equity = equity.value;
      else result.equityError = errorText(equity.reason);
      if (daily.status === "fulfilled") result.daily = daily.value;
      else result.dailyError = errorText(daily.reason);
      if (models.status === "fulfilled") {
        publishCatalog({ console: models.value.list });
        result.modelTotal = models.value.total;
      } else {
        result.modelsError = errorText(models.reason);
      }
      if (benefits.status === "fulfilled") result.benefits = benefits.value;
      else result.benefitsError = errorText(benefits.reason);
      return result;
    })();

    cache.pending = pending;
    cache.days = key;
    try {
      const data = await pending;
      cache.data = data;
      cache.at = Date.now();
      return data;
    } finally {
      if (cache.pending === pending) cache.pending = undefined;
    }
  }

  // ---- Periodic catalogue sync ----------------------------------------------
  const catalogRefreshMinutes = Number.isFinite(Number(config.catalogRefreshMinutes))
    ? Math.max(0, Number(config.catalogRefreshMinutes))
    : 30;

  async function refreshCatalogOnly() {
    // Primary source: the endpoint's own GET /models (complete, no 10-row cap).
    // Fallback: the console entitlement list when no API key is configured.
    let endpointIds;
    const apiKey = await resolveApiKey().catch(() => undefined);
    if (apiKey) {
      try {
        const ids = await fetchEndpointModels({ baseURL, apiKey });
        const chat = ids.filter(isChatModelId);
        if (chat.length > 0) endpointIds = chat;
      } catch (error) {
        ctx.logger?.debug?.(`${name}: GET /models failed: ${errorText(error)}`);
      }
    }
    let consoleModels;
    const { cookie } = await readCookie();
    if (cookie !== "") {
      try {
        consoleModels = (await new TokenPlanConsole({ cookie }).models()).list;
      } catch (error) {
        ctx.logger?.debug?.(`${name}: console model list failed: ${errorText(error)}`);
      }
    }
    if (endpointIds === undefined && consoleModels === undefined) return false;
    return publishCatalog({ endpoint: endpointIds, console: consoleModels });
  }

  if (catalogRefreshMinutes > 0) {
    // First sync shortly after activation: a user may open the model picker
    // without ever opening the console panel.
    ctx.effect(() => ctx.timeout(() => {
      refreshCatalogOnly().catch((error) => {
        ctx.logger?.debug?.(`${name}: initial catalogue sync failed: ${errorText(error)}`);
      });
    }, 3_000), "dsh-qwen-token-plan: initial catalogue sync");
    ctx.effect(() => ctx.interval(() => {
      refreshCatalogOnly().catch((error) => {
        ctx.logger?.debug?.(`${name}: catalogue sync failed: ${errorText(error)}`);
      });
    }, catalogRefreshMinutes * 60_000), "dsh-qwen-token-plan: catalogue timer");
  }

  async function statePayload(days = 7, force = false) {
    const consoleData = await loadConsole(days, force);
    const models = catalog.snapshot();
    const plan = consoleData.plan;
    const keyInfo = await apiKeyInfo();
    return {
      ok: true,
      version: VERSION,
      fetchedAt: Date.now(),
      provider: {
        id: providerId,
        displayName,
        baseURL,
        registered: registerProvider && providerError === undefined,
        apiKeyConfigured: keyInfo.configured,
        apiKeySource: keyInfo.source,
        apiKeyHint: keyInfo.hint,
        apiKeyEnv,
        modelCount: models.length,
        ...(providerError ? { error: providerError } : {}),
      },
      catalog: {
        refreshMinutes: catalogRefreshMinutes,
        syncedAt: catalogSyncedAt || null,
        source: catalog.source,
        endpointCount: catalog.endpointCount,
      },
      console: {
        configured: consoleData.configured,
        cookieEnv: consoleCookieEnv,
        source: consoleData.source,
        cookieSaved: consoleData.source === "credentials",
        refreshSeconds: Math.round(consoleTtl / 1000),
      },
      plan: plan ?? null,
      planError: consoleData.planError ?? null,
      equity: consoleData.equity,
      equityError: consoleData.equityError ?? null,
      daily: consoleData.daily ?? null,
      dailyError: consoleData.dailyError ?? null,
      benefits: consoleData.benefits,
      benefitsError: consoleData.benefitsError ?? null,
      models: models.map((model) => ({
        id: model.id,
        name: model.name,
        capabilities: model.capabilities,
        editions: model.editions ?? [],
        contextWindow: model.contextWindow,
        maxTokens: model.maxTokens,
        input: model.input ?? ["text"],
        isNew: model.isNew === true,
        reasoning: model.reasoning
          ? { efforts: model.reasoning.efforts, defaultEffort: model.reasoning.defaultEffort }
          : null,
      })),
      modelTotal: consoleData.modelTotal,
      modelsError: consoleData.modelsError ?? null,
      benefitsMeta: {
        equityTypes: EQUITY_TYPES,
        tierNames: TIER_NAMES,
        planCodeEquity: planCodeEquityMap(),
      },
      today: localDate(Date.now()),
    };
  }

  // ---- HTTP routes -----------------------------------------------------------
  ctx.effect(() => {
    const server = ctx.get("webServer");
    if (!server || typeof server.register !== "function") return () => {};
    const trusted = (req) => trustedRequest(req, server.host);
    const dispose = server.register({
      kind: "prefix",
      path: ROUTE_PREFIX,
      // Anonymous at the carrier because the panel's same-origin fetch has no
      // Peer credential; trustedRequest() below is the admission fence.
      auth: "anonymous",
      async handler(req, res) {
        try {
          if (!trusted(req)) return json(res, 403, { ok: false, error: "forbidden" });
          const url = new URL(req.url ?? "/", "http://localhost");
          const sub = url.pathname.slice(ROUTE_PREFIX.length).replace(/^\/+/, "");
          const days = Number(url.searchParams.get("days") ?? "7") || 7;

          if (req.method === "GET" && (sub === "" || sub === "state")) {
            return json(res, 200, await statePayload(days, false));
          }
          if (req.method === "POST" && sub === "refresh") {
            const body = await readJsonBody(req).catch(() => ({}));
            const requested = Number(body?.days);
            return json(res, 200, await statePayload(Number.isFinite(requested) ? requested : days, true));
          }
          if (req.method === "GET" && sub === "model-info") {
            const id = url.searchParams.get("id") ?? "";
            if (id === "") return json(res, 400, { ok: false, error: "missing id" });
            if (!adapterInstance) return json(res, 503, { ok: false, error: "provider not registered" });
            return json(res, 200, { ok: true, model: await adapterInstance.resolveModel(providerId, id) });
          }
          if (req.method === "GET" && sub === "plan") {
            return json(res, 200, await planPayload(false));
          }
          if (req.method === "POST" && sub === "key") {
            const body = await readJsonBody(req);
            const value = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";
            if (value.length < 16 || value.length > 512 || /\s/.test(value)) {
              return json(res, 400, { ok: false, error: "API Key 格式不正确（长度 16-512，且不能包含空白字符）" });
            }
            if (typeof ctx.credentials?.set !== "function") {
              return json(res, 501, { ok: false, error: "宿主未提供凭据服务，请把 Key 写入环境变量 " + apiKeyEnv });
            }
            await ctx.credentials.set(apiKeyEnv, value);
            await refreshCatalogOnly().catch(() => false);
            return json(res, 200, await statePayload(days, false));
          }
          if (req.method === "POST" && sub === "key/clear") {
            if (typeof ctx.credentials?.unset === "function") await ctx.credentials.unset(apiKeyEnv);
            await refreshCatalogOnly().catch(() => false);
            return json(res, 200, await statePayload(days, false));
          }
          if (req.method === "POST" && sub === "cookie") {
            const body = await readJsonBody(req);
            const cookie = typeof body?.cookie === "string" ? body.cookie.trim() : "";
            if (cookie.length < 20) return json(res, 400, { ok: false, error: "Cookie 太短，请粘贴完整控制台 Cookie" });
            if (cookie.length > 12_000) return json(res, 400, { ok: false, error: "Cookie 过长" });
            if (typeof ctx.credentials?.set !== "function") {
              return json(res, 501, { ok: false, error: "宿主未提供凭据服务，请把 Cookie 写入 ~/.dsh/.env 的 " + consoleCookieEnv });
            }
            await ctx.credentials.set(consoleCookieEnv, cookie);
            cache.at = 0;
            cache.data = undefined;
            planCache.at = 0;
            planCache.data = undefined;
            return json(res, 200, await statePayload(days, true));
          }
          if (req.method === "POST" && sub === "cookie/clear") {
            if (typeof ctx.credentials?.unset === "function") await ctx.credentials.unset(consoleCookieEnv);
            cache.at = 0;
            cache.data = undefined;
            planCache.at = 0;
            planCache.data = undefined;
            return json(res, 200, await statePayload(days, true));
          }
          return json(res, 404, { ok: false, error: "not found" });
        } catch (error) {
          return json(res, 500, { ok: false, error: errorText(error) });
        }
      },
    });
    return () => {
      try {
        dispose();
      } catch {
        // already disposed
      }
    };
  }, "dsh-qwen-token-plan: console routes");
}

function errorText(error) {
  return error instanceof Error ? error.message : String(error ?? "unknown error");
}

function planCodeEquityMap() {
  const map = {};
  for (const [code, key] of Object.entries({
    tokenplan_harnesstool_search_pro: "search_pro",
    tokenplan_harnesstool_vertical_search: "vertical_search",
    tokenplan_harnestool_webfetch: "webfetch",
    tokenplan_mcp_codeinterpreter: "code_interpreter",
    tokenplan_harnesstool_tts: "tts",
    tokenplan_harnesstool_asr: "asr",
    tokenplan_harnesstool_image_generation: "image_generation",
    tokenplan_harnesstool_video_generation: "video_generation",
  })) map[code] = key;
  return map;
}

apply.inject = inject;
