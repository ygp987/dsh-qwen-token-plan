/**
 * Read-only client for the Qianwen AI Platform console (platform-home.qianwenai.com).
 *
 * The console exposes its data through one form-encoded gateway
 * (`cs-data.qianwenai.com/data/api.json?action=BroadScopeAspnGateway`). Every
 * call needs the signed-in console cookie plus a short-lived `sec_token` read
 * from `/tool/user/info.json`. The endpoints used here were verified against
 * the live Token Plan page on 2026-11-24:
 *
 *   apikeyMgr /tokenplan/personal/api/v2/subscription   plan tier and end time
 *   apikeyMgr /tokenplan/personal/api/v2/usage           used percentage + reset
 *   apikeyMgr /tokenplan/personal/api/v2/quota-config    per-tier credit table
 *   .../tokenPlan/queryTokenPlanEquityInfo               Harness benefit balances
 *   .../modelCenter/listTokenPlanModels                  models the plan entitles
 *   .../platform-model.getModelMonitorDataWithOss        daily token series
 *   zeldaEasy.broadscope-bailian.token-plan.detail       Harness benefit catalogue
 */

const ORIGIN = "https://platform-home.qianwenai.com";
export const DASHBOARD_URL = `${ORIGIN}/analytics/token-plan/individual`;
const GATEWAY_URL = "https://cs-data.qianwenai.com/data/api.json";
const API_PREFIX = "zeldaHttp.apikeyMgr./tokenplan/personal/api/v2";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const CONSOLE_TZ = "Asia/Shanghai";

/** Tier display names. */
export const TIER_NAMES = Object.freeze({
  lite: "Lite",
  essential: "Essential",
  standard: "Standard",
  pro: "Pro",
});

/** Harness benefit metadata keyed by the console's equityType. */
export const EQUITY_TYPES = Object.freeze({
  tokenplan_harnesstool_search_pro: { key: "search_pro", title: "联网搜索增强", unit: "次" },
  tokenplan_harnesstool_vertical_search: { key: "vertical_search", title: "垂类搜索", unit: "次" },
  tokenplan_harnestool_webfetch: { key: "webfetch", title: "网页解析", unit: "次" },
  tokenplan_mcp_codeinterpreter: { key: "code_interpreter", title: "代码解释器", unit: "次" },
  tokenplan_harnesstool_tts: { key: "tts", title: "语音合成", unit: "字符" },
  tokenplan_harnesstool_asr: { key: "asr", title: "语音识别", unit: "秒" },
  tokenplan_harnesstool_image_generation: { key: "image_generation", title: "图像生成", unit: "张" },
  tokenplan_harnesstool_video_generation: { key: "video_generation", title: "视频生成", unit: "秒" },
});

const PLAN_CODE_TO_EQUITY = Object.freeze({
  tokenplan_harnesstool_search_pro: "search_pro",
  tokenplan_harnesstool_search_pro_monthly: "search_pro",
  tokenplan_harnesstool_vertical_search: "vertical_search",
  tokenplan_harnesstool_vertical_search_monthly: "vertical_search",
  tokenplan_harnestool_webfetch: "webfetch",
  tokenplan_harnestool_webfetch_monthly: "webfetch",
  tokenplan_mcp_codeinterpreter: "code_interpreter",
  tokenplan_mcp_codeinterpreter_monthly: "code_interpreter",
  tokenplan_harnesstool_tts: "tts",
  tokenplan_harnestool_tts_monthly: "tts",
  tokenplan_harnesstool_asr: "asr",
  tokenplan_harnestool_asr_monthly: "asr",
  tokenplan_harnesstool_image_generation: "image_generation",
  tokenplan_harnesstool_image_generation_monthly: "image_generation",
  tokenplan_harnesstool_video_generation: "video_generation",
});

const USAGE_SERIES = Object.freeze({
  total_tokens: "total",
  input_tokens: "input",
  output_tokens: "output",
  cached_tokens: "cached",
  image_tokens: "image",
});

function randomId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function form(fields) {
  return new URLSearchParams(fields).toString();
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Unwrap `data.DataV2.data` regardless of whether the payload carries the
 * `{ success, data }` envelope (different endpoints nest differently).
 */
function payloadOf(outer) {
  const envelope = outer?.data?.DataV2?.data;
  if (envelope === undefined || envelope === null) {
    const message = outer?.data?.errorMsg ?? outer?.message ?? outer?.data?.Message;
    throw new Error(message ? String(message) : "console gateway returned no payload");
  }
  if (envelope.success === false) {
    throw new Error(String(envelope.msg ?? envelope.code ?? "console gateway rejected the request"));
  }
  if (isObject(envelope) && "data" in envelope) {
    const inner = envelope.data;
    if (isObject(inner) && inner.success === false) {
      throw new Error(String(inner.msg ?? inner.code ?? "console gateway rejected the request"));
    }
    return inner ?? envelope;
  }
  return envelope;
}

/** Find the first nested object that owns one of the expected keys. */
function pick(value, keys) {
  const queue = [value];
  const seen = new Set();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!isObject(current) || seen.has(current)) continue;
    seen.add(current);
    if (keys.some((key) => key in current)) return current;
    for (const child of Object.values(current)) {
      if (isObject(child) && !seen.has(child)) queue.push(child);
    }
  }
  return undefined;
}

export function localDate(timestamp, timeZone = CONSOLE_TZ) {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export class TokenPlanConsole {
  #cookie;
  #fetch;
  #timeoutMs;
  #secToken;
  #secTokenAt = 0;

  constructor({ cookie, fetchImpl = globalThis.fetch, timeoutMs = 20_000 } = {}) {
    this.#cookie = typeof cookie === "string" ? cookie.trim() : "";
    this.#fetch = fetchImpl;
    this.#timeoutMs = timeoutMs;
  }

  get configured() {
    return this.#cookie !== "";
  }

  #signal(signal) {
    const timeout = AbortSignal.timeout(this.#timeoutMs);
    return signal ? AbortSignal.any([signal, timeout]) : timeout;
  }

  #headers(extra = {}) {
    return {
      accept: "application/json",
      cookie: this.#cookie,
      origin: ORIGIN,
      referer: DASHBOARD_URL,
      "user-agent": UA,
      ...extra,
    };
  }

  async #ensureSecToken(force = false) {
    const fresh = Date.now() - this.#secTokenAt < 10 * 60_000;
    if (!force && this.#secToken && fresh) return this.#secToken;
    const response = await this.#fetch(`${ORIGIN}/tool/user/info.json`, {
      headers: this.#headers(),
      signal: this.#signal(),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`user/info.json HTTP ${response.status}: ${text.slice(0, 120)}`);
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("user/info.json returned non-JSON (console cookie may have expired)");
    }
    const token = parsed?.data?.secToken;
    if (typeof token !== "string" || token === "") {
      throw new Error("user/info.json returned no secToken (console cookie expired)");
    }
    this.#secToken = token;
    this.#secTokenAt = Date.now();
    return token;
  }

  async #gateway(apiName, data = {}) {
    if (!this.configured) throw new Error("未配置控制台 Cookie");
    const secToken = await this.#ensureSecToken();
    const params = {
      Api: apiName,
      V: "1.0",
      Data: {
        cornerstoneParam: {
          feTraceId: randomId(),
          feURL: DASHBOARD_URL,
          protocol: "V2",
          console: "ONE_CONSOLE",
          productCode: "p_efm",
          switchUserType: 3,
          domain: "platform-home.qianwenai.com",
          consoleSite: "QIANWENAI",
          userNickName: "",
          userPrincipalName: "",
          xsp_lang: "zh-CN",
        },
        ...data,
      },
    };
    const anonymous = /(?:^|;\s*)cna=([^;]+)/.exec(this.#cookie);
    if (anonymous) params.Data.cornerstoneParam["X-Anonymous-Id"] = anonymous[1].trim();

    const query = new URLSearchParams({
      action: "BroadScopeAspnGateway",
      product: "sfm_bailian",
      api: apiName,
      _v: "undefined",
    });
    const body = form({
      product: "sfm_bailian",
      action: "BroadScopeAspnGateway",
      region: "cn-beijing",
      language: "zh-CN",
      params: JSON.stringify(params),
      sec_token: String(secToken),
    });
    const response = await this.#fetch(`${GATEWAY_URL}?${query}`, {
      method: "POST",
      headers: this.#headers({ "content-type": "application/x-www-form-urlencoded" }),
      body,
      signal: this.#signal(),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`网关 ${apiName} HTTP ${response.status}: ${text.slice(0, 160)}`);
    }
    let outer;
    try {
      outer = JSON.parse(text);
    } catch {
      throw new Error(`网关 ${apiName} 返回非 JSON`);
    }
    if (outer?.data?.DataV2?.data?.success === false) {
      // Expired cookies come back as a signed-out envelope; refresh the token once.
      const message = String(outer?.data?.DataV2?.data?.msg ?? "");
      if (/token|login|登录|expired/i.test(message)) {
        this.#secToken = undefined;
        const retried = await this.#retryOnce(apiName, params);
        if (retried !== undefined) return retried;
      }
      throw new Error(`网关 ${apiName} 返回失败：${message || "unknown"}`);
    }
    return payloadOf(outer);
  }

  async #retryOnce(apiName, params) {
    try {
      const secToken = await this.#ensureSecToken(true);
      const query = new URLSearchParams({
        action: "BroadScopeAspnGateway",
        product: "sfm_bailian",
        api: apiName,
        _v: "undefined",
      });
      const body = form({
        product: "sfm_bailian",
        action: "BroadScopeAspnGateway",
        region: "cn-beijing",
        language: "zh-CN",
        params: JSON.stringify(params),
        sec_token: String(secToken),
      });
      const response = await this.#fetch(`${GATEWAY_URL}?${query}`, {
        method: "POST",
        headers: this.#headers({ "content-type": "application/x-www-form-urlencoded" }),
        body,
        signal: this.#signal(),
      });
      if (!response.ok) return undefined;
      const outer = JSON.parse(await response.text());
      if (outer?.data?.DataV2?.data?.success === false) return undefined;
      return payloadOf(outer);
    } catch {
      return undefined;
    }
  }

  async subscription() {
    return pick(await this.#gateway(`${API_PREFIX}/subscription`), ["specCode", "instanceCode"]) ?? {};
  }

  async usage() {
    return pick(await this.#gateway(`${API_PREFIX}/usage`), ["per1MonthPercentage"]) ?? {};
  }

  async quotaConfig() {
    return pick(await this.#gateway(`${API_PREFIX}/quota-config`), ["standard", "lite", "pro"]) ?? {};
  }

  /**
   * Purchased add-on packs. `quota-config.addon_quota.extrabundle` is only the
   * purchasable unit size, not an owned allowance (verified 2026-11-26: a
   * Standard plan with no add-on returns `total: 0` here while the config still
   * advertises 20,000), so ownership must come from this endpoint.
   */
  async addons() {
    const payload = await this.#gateway(`${API_PREFIX}/addon/list`, { pageNum: 1, pageSize: 100 });
    const board = pick(payload, ["items", "total"]) ?? {};
    const items = Array.isArray(board.items) ? board.items : [];
    let credits = 0;
    for (const item of items) {
      const value = Number(item?.quota ?? item?.credits ?? item?.amount ?? item?.totalQuota);
      if (Number.isFinite(value) && value > 0) credits += value;
    }
    return { total: Number(board.total) || items.length, items, credits };
  }

  /** Plan tier, remaining credits and reset time in one object. */
  async plan() {
    if (!this.configured) throw new Error("未配置控制台 Cookie");
    const [subscription, usage, quota, addons] = await Promise.allSettled([
      this.subscription(),
      this.usage(),
      this.quotaConfig(),
      this.addons(),
    ]);
    const sub = subscription.status === "fulfilled" ? subscription.value : {};
    const used = usage.status === "fulfilled" ? usage.value : {};
    const quotaBoard = quota.status === "fulfilled" ? quota.value : {};
    const addonInfo = addons.status === "fulfilled" ? addons.value : { items: [], credits: 0 };
    const specCode = String(sub?.specCode ?? "").toLowerCase();
    const tier = quotaBoard?.[specCode] ?? {};
    const addonUnit = isObject(quotaBoard?.addon_quota) ? Number(quotaBoard.addon_quota.extrabundle) || 0 : 0;
    // Owned add-on credits; fall back to one purchasable unit per active pack
    // when the endpoint does not expose a numeric amount.
    const addonCredits = addonInfo.credits > 0
      ? addonInfo.credits
      : addonInfo.items.length > 0 && addonUnit > 0
        ? addonUnit * addonInfo.items.length
        : 0;
    const monthlyCredits = (Number(tier.monthly) || 0) + addonCredits;
    const fiveHourCredits = Number(tier.five_hour) || 0;
    const usedRatio = Math.min(1, Math.max(0, Number(used?.per1MonthPercentage) || 0));
    const remainingDays = Number(sub?.remainingDays);
    return {
      source: "console",
      specCode,
      tierName: TIER_NAMES[specCode] ?? (specCode ? specCode.toUpperCase() : ""),
      status: String(sub?.status ?? ""),
      remainingDays: Number.isFinite(remainingDays) ? remainingDays : undefined,
      startTime: Number(sub?.startTime) || undefined,
      endTime: Number(sub?.endTime) || undefined,
      autoRenew: sub?.autoRenewFlag === true,
      monthlyCredits,
      fiveHourCredits,
      addonCredits,
      addonActive: addonInfo.items.length > 0,
      addonOffer: addonUnit || undefined,
      usedPercent: usedRatio * 100,
      remainingPercent: (1 - usedRatio) * 100,
      remainingCredits: monthlyCredits > 0 ? Math.round(monthlyCredits * (1 - usedRatio)) : undefined,
      resetTime: Number(used?.per1MonthResetTime) || undefined,
    };
  }

  /** Harness benefit balances for the current plan period. */
  async equity() {
    const payload = await this.#gateway("zeldaEasy.bailian-commerce.tokenPlan.queryTokenPlanEquityInfo", {
      queryTokenPlanEquityInfoRequest: { requestId: randomId() },
    });
    const rows = pick(payload, ["tokenPlanEquityInfos"])?.tokenPlanEquityInfos;
    const out = [];
    for (const item of Array.isArray(rows) ? rows : []) {
      const meta = EQUITY_TYPES[String(item?.equityType ?? "")];
      const total = Number(item?.totalQuota);
      const available = Number(item?.availableQuota);
      if (!meta || !Number.isFinite(total) || total <= 0 || !Number.isFinite(available)) continue;
      out.push({ ...meta, total: Math.round(total), available: Math.max(0, Math.round(available)) });
    }
    return out;
  }

  /** Daily token series for the last `days` days (console buckets, Asia/Shanghai). */
  async daily(days = 7) {
    const span = Math.min(90, Math.max(1, Math.round(days)));
    const end = Date.now();
    const start = end - span * 86_400_000;
    const payload = await this.#gateway("zeldaEasy.bailian-telemetry.platform-model.getModelMonitorDataWithOss", {
      reqDTO: {
        productMode: "TokenPlanPersonal",
        startTime: start,
        endTime: end,
        step: 86_400,
        metricFilters: [{ aggMethod: "sum", metricName: "model_usage" }],
      },
    });
    const series = pick(payload, ["originData"])?.originData;
    const buckets = new Map();
    for (const item of Array.isArray(series) ? series : []) {
      const field = USAGE_SERIES[String(item?.labels?.usage_type ?? "")];
      if (!field) continue;
      for (const point of Array.isArray(item?.points) ? item.points : []) {
        const at = Number(point?.timestamp);
        const value = Number(point?.value);
        if (!Number.isFinite(at) || !Number.isFinite(value)) continue;
        const date = localDate(at);
        if (date === "") continue;
        const row = buckets.get(date) ?? { date, timestamp: at, total: 0, input: 0, output: 0, cached: 0, image: 0 };
        row[field] = Math.max(0, Math.round(value));
        row.timestamp = Math.min(row.timestamp, at);
        buckets.set(date, row);
      }
    }
    const rows = [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
    const totals = rows.reduce((acc, row) => {
      for (const field of ["total", "input", "output", "cached", "image"]) acc[field] += row[field];
      return acc;
    }, { total: 0, input: 0, output: 0, cached: 0, image: 0 });
    const cacheRate = totals.input > 0 ? (totals.cached / (totals.input + totals.cached)) * 100 : 0;
    return { days: span, rows, totals: { ...totals, cacheRate } };
  }

  /**
   * Models the subscription entitles. The console endpoint caps a reply at ten
   * rows and ignores `pageNo`/`pageSize` (verified 2026-11-24), so this returns
   * the first page plus the reported total. The shipped catalogue supplies the
   * remaining ids; only names/capabilities are enriched from here.
   */
  async models() {
    const payload = await this.#gateway("zeldaHttp.dashscopeModel./zelda/api/v1/modelCenter/listTokenPlanModels", {
      pageNo: 1,
      pageSize: 100,
    });
    const board = pick(payload, ["list", "total"]) ?? {};
    const list = Array.isArray(board.list) ? board.list : [];
    const total = Number(board.total) || list.length;
    return { total, list };
  }

  /** Harness benefit catalogue with list prices and the plan codes that cover it. */
  async benefits() {
    const payload = await this.#gateway("zeldaEasy.broadscope-bailian.token-plan.detail");
    const items = pick(payload, ["items"])?.items;
    return (Array.isArray(items) ? items : []).map((item) => ({
      title: String(item?.title ?? ""),
      unit: String(item?.quotaUnit ?? ""),
      currentPrice: item?.priceInfo?.currentPrice ? String(item.priceInfo.currentPrice) : undefined,
      originalPrice: item?.priceInfo?.originalPrice ? String(item.priceInfo.originalPrice) : undefined,
      currency: item?.priceInfo?.currency ? String(item.priceInfo.currency) : "¥",
      planCodes: Array.isArray(item?.planCodes) ? item.planCodes.map(String) : [],
      mcpCode: item?.mcpInfo?.code ? String(item.mcpInfo.code) : undefined,
      mcpUrl: item?.aiNativeMcpUrl ? String(item.aiNativeMcpUrl) : undefined,
    })).filter((item) => item.title !== "");
  }
}

/** Plan codes → benefit keys, exported for the UI's coverage hints. */
export function equityKeyOfPlanCode(code) {
  return PLAN_CODE_TO_EQUITY[String(code)] ?? undefined;
}

/** Read the console cookie from an environment variable or ~/.dsh/.env. */
export async function readConsoleCookie(envName, { fs, os, path } = {}) {
  const direct = process.env[envName];
  if (typeof direct === "string" && direct.trim() !== "") return direct.trim();
  const fsMod = fs ?? (await import("node:fs"));
  const osMod = os ?? (await import("node:os"));
  const pathMod = path ?? (await import("node:path"));
  try {
    const text = fsMod.readFileSync(pathMod.join(osMod.homedir(), ".dsh", ".env"), "utf8");
    const match = new RegExp(`^\\s*(?:export\\s+)?${envName}\\s*=\\s*(.*)$`, "m").exec(text);
    if (match) {
      const value = match[1].trim().replace(/^["']|["']$/g, "");
      if (value !== "") return value;
    }
  } catch {
    // File missing or unreadable: treat as unset.
  }
  return undefined;
}
