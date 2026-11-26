/**
 * dsh-qwen-token-plan — browser half.
 *
 * Registers a Settings section, a sidebar entry and the matching `main` panel.
 * All data comes from the same-origin Host routes under /qwen-token-plan; the
 * page polls while it is open and offers a manual refresh plus a cookie form.
 */
window.__ModuleLoader__.load({
  id: "dsh-qwen-token-plan",
  factory: (require) => {
    const module = { exports: {} };
    const exports = module.exports;
    const React = require("react");
    const h = React.createElement;
    const { useEffect, useMemo, useRef, useState } = React;

    const PAGE_ID = "qwen-token-plan";
    const STATE_URL = "/qwen-token-plan/state";
    const REFRESH_URL = "/qwen-token-plan/refresh";
    const COOKIE_URL = "/qwen-token-plan/cookie";
    const COOKIE_CLEAR_URL = "/qwen-token-plan/cookie/clear";
    const KEY_URL = "/qwen-token-plan/key";
    const KEY_CLEAR_URL = "/qwen-token-plan/key/clear";
    const API_KEYS_URL = "https://platform.qianwenai.com/home/api-keys";
    const STYLE_ID = "dsh-qwen-token-plan.css";
    const POLL_MS = 60_000;

    const COPY = {
      zh: {
        nav: "千问 Token Plan",
        title: "千问 Token Plan",
        subtitle: "千问 AI 平台 · 套餐余量、Token 用量与模型目录",
        overview: "概览",
        usage: "用量",
        benefits: "权益",
        models: "模型",
        about: "关于",
        refresh: "刷新",
        refreshing: "刷新中…",
        updated: "更新于",
        loadFailed: "无法读取插件状态",
        retry: "重试",
        cookieTitle: "连接控制台",
        cookieBody: "套餐余量与每日用量来自千问控制台，需要一个已登录控制台的 Cookie。Cookie 只保存在本机 DSH 凭据里，不会发往任何第三方。",
        cookiePlaceholder: "粘贴 platform.qianwenai.com 的完整 Cookie",
        cookieSave: "保存 Cookie",
        cookieSaving: "保存中…",
        cookieClear: "清除已保存的 Cookie",
        cookieSaved: "Cookie 已保存",
        cookieMissing: "未配置控制台 Cookie",
        cookieFrom: "来源",
        cookieSources: { credentials: "DSH 凭据", env: "环境变量", dotfile: "~/.dsh/.env", none: "未配置" },
        settingsTab: "设置",
        settingsTitle: "接入设置",
        settingsSub: "模型 API Key 与控制台 Cookie 都只保存在本机 DSH 凭据里，不会上传到任何第三方。",
        apiKeyTitle: "模型 API Key",
        apiKeyBody: "Token Plan 的 OpenAI 兼容线路需要专属 API Key。保存后即时生效，不必重启。",
        apiKeyPlaceholder: "粘贴 Token Plan API Key（sk-sp- 开头）",
        apiKeySave: "保存 Key",
        apiKeySaving: "保存中…",
        apiKeyClear: "清除 Key",
        apiKeySaved: "API Key 已保存，现在可以在模型选择器里使用千问 Token Plan 的模型了。",
        apiKeyCleared: "API Key 已清除。",
        apiKeyMissing: "未配置",
        apiKeyConfigured: "已配置",
        apiKeyWhere: "在千问 AI 平台创建 Token Plan 专属 API Key",
        keyNotice: "还没有配置 Token Plan API Key，模型暂时无法对话。",
        goSettings: "去设置",
        endpointTitle: "线路信息",
        endpointHint: "国际站用户请在插件配置里把 baseURL 改为新加坡端点。",
        providerKeySource: "Key 来源",
        notConfigured: "未配置",
        plan: "套餐",
        planStatus: "状态",
        planRemaining: "剩余额度",
        planRemainingCredits: "剩余 Credits",
        planMonthly: "月额度",
        planAddon: "加油包",
        planDaysLeft: "剩余天数",
        days: "天",
        planStart: "开始时间",
        planEnd: "到期时间",
        planReset: "周期重置",
        autoRenew: "自动续费",
        on: "开",
        off: "关",
        tierUnknown: "未知套餐",
        statusValid: "生效中",
        credits: "Credits",
        today: "今日 Tokens",
        last7: "近 7 日 Tokens",
        cacheHit: "缓存命中率",
        modelCount: "可用模型",
        dailyTrend: "每日 Token 用量",
        noData: "暂无数据",
        totalTokens: "总 Tokens",
        inputTokens: "输入",
        outputTokens: "输出",
        cachedTokens: "缓存命中",
        imageTokens: "图片",
        range7: "近 7 天",
        range30: "近 30 天",
        range90: "近 90 天",
        date: "日期",
        total: "合计",
        usageTable: "按日明细",
        usageEmpty: "还没有可展示的每日用量；控制台产生调用后会出现在这里。",
        benefitsTitle: "Harness 权益",
        benefitsNote: "Standard / Pro 套餐附赠的每月免费额度；用按量付费 Key 走 MCP 调用才消耗这里，模型对话走 Credits。",
        benefitsEmpty: "未获取到权益余额；请检查控制台 Cookie。",
        benefitsCatalog: "权益服务目录",
        coverage: "套餐覆盖",
        benefitPrice: "单价",
        benefitIncluded: "包含",
        benefitNotIncluded: "不含",
        remaining: "剩余",
        totalLabel: "总额",
        exhausted: "已用尽",
        modelsTitle: "模型目录",
        modelsNote: "默认每 30 分钟从 Token Plan 端点的 GET /models 动态发现模型，并合并控制台授权信息与内置规格；新增模型会自动出现在这里和模型选择器中。",
        searchModels: "搜索模型 ID 或名称",
        modelId: "模型 ID",
        modelName: "名称",
        capabilities: "能力",
        editions: "套餐",
        contextWindow: "上下文",
        maxOutput: "最大输出",
        newBadge: "新",
        capTG: "文本",
        capVU: "视觉",
        capReasoning: "推理",
        capASR: "语音识别",
        capTTS: "语音合成",
        catalogRefresh: "模型目录刷新",
        catalogSource: "目录来源",
        endpointModels: "端点模型",
        minutes: "分钟",
        lastSync: "上次同步",
        reasoningLevels: "推理档位",
        defaultLevel: "默认",
        levelNames: { none: "关闭", low: "低", medium: "中", high: "高", xhigh: "超高", max: "最大" },
        modelsEmpty: "没有匹配的模型",
        providerTitle: "接入状态",
        providerId: "Provider ID",
        providerName: "显示名称",
        providerBase: "基础 URL",
        providerKey: "API Key",
        keyConfigured: "已配置",
        keyMissing: "未配置",
        providerRegistered: "已注册到模型选择器",
        providerUnregistered: "未注册",
        providerHint: "在 设置 → 模型 中为千问 Token Plan 填入 API Key，随后即可在模型选择器中使用。",
        aboutTitle: "关于",
        version: "版本",
        routes: "数据路由",
        cookieEnv: "控制台 Cookie 凭据",
        apiKeyEnv: "API Key 凭据",
        refreshInterval: "状态刷新间隔",
        seconds: "秒",
        docs: "文档",
        tokenPlanDocs: "千问 Token Plan 文档",
        dshGuide: "在千问平台使用 DeepSeek Harness",
        sourceCode: "插件源码",
        noConsole: "未连接控制台：套餐与用量数据不可用。填入控制台 Cookie 即可恢复。",
        planError: "套餐数据获取失败",
        dailyError: "用量数据获取失败",
        equityError: "权益数据获取失败",
        benefitsError: "权益目录获取失败",
        modelsError: "模型目录获取失败",
        errorDetails: "详细信息",
        emptyPlan: "未获取到套餐信息",
        footerNote: "数据来自千问控制台，只读；不会修改订阅。",
        planCreditsHint: "月额度含加油包",
        cacheRateHint: "缓存命中 / (输入 + 缓存命中)",
      },
      en: {
        nav: "Qianwen Token Plan",
        title: "Qianwen Token Plan",
        subtitle: "Qianwen AI Platform · plan quota, token usage and model catalogue",
        overview: "Overview",
        usage: "Usage",
        benefits: "Benefits",
        models: "Models",
        about: "About",
        refresh: "Refresh",
        refreshing: "Refreshing…",
        updated: "Updated",
        loadFailed: "Could not read plugin state",
        retry: "Retry",
        cookieTitle: "Connect the console",
        cookieBody: "Plan quota and daily usage come from the Qianwen console and need a signed-in console cookie. The cookie stays in local DSH credentials and is never sent anywhere else.",
        cookiePlaceholder: "Paste the full platform.qianwenai.com cookie",
        cookieSave: "Save cookie",
        cookieSaving: "Saving…",
        cookieClear: "Clear saved cookie",
        cookieSaved: "Cookie saved",
        cookieMissing: "No console cookie configured",
        cookieFrom: "Source",
        cookieSources: { credentials: "DSH credentials", env: "environment", dotfile: "~/.dsh/.env", none: "not configured" },
        settingsTab: "Settings",
        settingsTitle: "Connection settings",
        settingsSub: "The model API key and the console cookie stay in local DSH credentials and are never uploaded.",
        apiKeyTitle: "Model API key",
        apiKeyBody: "The Token Plan OpenAI-compatible route needs its dedicated API key. Saving takes effect immediately.",
        apiKeyPlaceholder: "Paste the Token Plan API key (sk-sp-…)",
        apiKeySave: "Save key",
        apiKeySaving: "Saving…",
        apiKeyClear: "Clear key",
        apiKeySaved: "API key saved. Qianwen Token Plan models are now available in the model picker.",
        apiKeyCleared: "API key cleared.",
        apiKeyMissing: "Not configured",
        apiKeyConfigured: "Configured",
        apiKeyWhere: "Create a Token Plan API key on the Qianwen platform",
        keyNotice: "No Token Plan API key yet, so models cannot chat.",
        goSettings: "Open settings",
        endpointTitle: "Route",
        endpointHint: "International-site users should change baseURL to the Singapore endpoint in the plugin config.",
        providerKeySource: "Key source",
        notConfigured: "Not configured",
        plan: "Plan",
        planStatus: "Status",
        planRemaining: "Remaining",
        planRemainingCredits: "Credits left",
        planMonthly: "Monthly credits",
        planAddon: "Add-on",
        planDaysLeft: "Days left",
        days: "days",
        planStart: "Started",
        planEnd: "Expires",
        planReset: "Resets",
        autoRenew: "Auto renew",
        on: "on",
        off: "off",
        tierUnknown: "Unknown plan",
        statusValid: "Active",
        credits: "credits",
        today: "Tokens today",
        last7: "Tokens, last 7 days",
        cacheHit: "Cache hit rate",
        modelCount: "Models",
        dailyTrend: "Daily token usage",
        noData: "No data",
        totalTokens: "Total tokens",
        inputTokens: "Input",
        outputTokens: "Output",
        cachedTokens: "Cache read",
        imageTokens: "Image",
        range7: "Last 7 days",
        range30: "Last 30 days",
        range90: "Last 90 days",
        date: "Date",
        total: "Total",
        usageTable: "Daily detail",
        usageEmpty: "No daily usage yet; rows appear once the console records calls.",
        benefitsTitle: "Harness benefits",
        benefitsNote: "Monthly free allowances bundled with Standard / Pro. They are consumed by MCP calls made with a pay-as-you-go key; model chats spend credits.",
        benefitsEmpty: "No benefit balances; check the console cookie.",
        benefitsCatalog: "Benefit service catalogue",
        coverage: "Included in plan",
        benefitPrice: "Unit price",
        benefitIncluded: "Included",
        benefitNotIncluded: "Not included",
        remaining: "Remaining",
        totalLabel: "Total",
        exhausted: "Exhausted",
        modelsTitle: "Model catalogue",
        modelsNote: "Models are discovered from the Token Plan endpoint via GET /models every 30 minutes by default, merged with console entitlement metadata and shipped specs.",
        searchModels: "Search model id or name",
        modelId: "Model id",
        modelName: "Name",
        capabilities: "Capabilities",
        editions: "Editions",
        contextWindow: "Context",
        maxOutput: "Max output",
        newBadge: "New",
        capTG: "Text",
        capVU: "Vision",
        capReasoning: "Reasoning",
        capASR: "ASR",
        capTTS: "TTS",
        catalogRefresh: "Model sync",
        catalogSource: "Catalog source",
        endpointModels: "endpoint models",
        minutes: "min",
        lastSync: "Last sync",
        reasoningLevels: "Thinking",
        defaultLevel: "default",
        levelNames: { none: "off", low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "max" },
        modelsEmpty: "No matching models",
        providerTitle: "Route status",
        providerId: "Provider id",
        providerName: "Display name",
        providerBase: "Base URL",
        providerKey: "API key",
        keyConfigured: "configured",
        keyMissing: "missing",
        providerRegistered: "registered in the model picker",
        providerUnregistered: "not registered",
        providerHint: "Add the API key for Qianwen Token Plan in Settings → Models, then pick the models in the picker.",
        aboutTitle: "About",
        version: "Version",
        routes: "Data routes",
        cookieEnv: "Console cookie credential",
        apiKeyEnv: "API key credential",
        refreshInterval: "State refresh interval",
        seconds: "s",
        docs: "Docs",
        tokenPlanDocs: "Qianwen Token Plan docs",
        dshGuide: "DeepSeek Harness on Qianwen",
        sourceCode: "Plugin source",
        noConsole: "Console not connected: plan and usage data are unavailable. Paste a console cookie to recover.",
        planError: "Could not read plan data",
        dailyError: "Could not read usage data",
        equityError: "Could not read benefit balances",
        benefitsError: "Could not read the benefit catalogue",
        modelsError: "Could not read the model catalogue",
        errorDetails: "Details",
        emptyPlan: "No plan information",
        footerNote: "Read-only data from the Qianwen console; the subscription is never modified.",
        planCreditsHint: "Monthly credits include the add-on",
        cacheRateHint: "cache read / (input + cache read)",
      },
    };

    function lang() {
      const tag = document.documentElement?.lang || navigator.language || "zh";
      return String(tag).toLowerCase().startsWith("en") ? "en" : "zh";
    }
    const t = (key) => COPY[lang()][key] ?? COPY.zh[key] ?? key;

    /** Localized credential-source label, shared by the Cookie and API-key cards. */
    function sourceLabel(source) {
      const table = COPY[lang()].cookieSources ?? COPY.zh.cookieSources;
      return table[source] ?? table.none ?? String(source ?? "");
    }

    function levelName(id) {
      const table = COPY[lang()].levelNames ?? COPY.zh.levelNames;
      return table[id] ?? String(id ?? "");
    }

    const CAP_LABEL = {
      TG: "capTG",
      VU: "capVU",
      Reasoning: "capReasoning",
      ASR: "capASR",
      TTS: "capTTS",
    };

    function fmtInt(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return "—";
      return new Intl.NumberFormat(lang() === "en" ? "en-US" : "zh-CN").format(Math.round(n));
    }

    function fmtTokens(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return "—";
      const abs = Math.abs(n);
      if (abs >= 100_000_000) return `${(n / 100_000_000).toFixed(2)}亿`;
      if (abs >= 10_000) return `${(n / 10_000).toFixed(1)}万`;
      return fmtInt(n);
    }

    function fmtPct(value, digits = 1) {
      const n = Number(value);
      if (!Number.isFinite(n)) return "—";
      return `${n.toFixed(digits)}%`;
    }

    function fmtDate(ms) {
      if (!Number.isFinite(Number(ms)) || Number(ms) <= 0) return "—";
      return new Date(Number(ms)).toLocaleDateString(lang() === "en" ? "en-US" : "zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
    }

    function fmtDateTime(ms) {
      if (!Number.isFinite(Number(ms)) || Number(ms) <= 0) return "—";
      return new Date(Number(ms)).toLocaleString(lang() === "en" ? "en-US" : "zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    }

    function fmtClock(ms) {
      if (!Number.isFinite(Number(ms)) || Number(ms) <= 0) return "—";
      return new Date(Number(ms)).toLocaleTimeString(lang() === "en" ? "en-US" : "zh-CN", { hour: "2-digit", minute: "2-digit" });
    }

    async function readJson(response) {
      const text = await response.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error(`HTTP ${response.status}`);
      }
      if (!response.ok) throw new Error(parsed?.error ?? `HTTP ${response.status}`);
      return parsed;
    }

    function useConsoleState(days) {
      const [state, setState] = useState(null);
      const [error, setError] = useState(null);
      const [busy, setBusy] = useState(false);
      const mounted = useRef(true);

      const load = (targetDays, force = false) => {
        const url = force ? REFRESH_URL : `${STATE_URL}?days=${targetDays}`;
        const init = force
          ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ days: targetDays }) }
          : { headers: { accept: "application/json" } };
        return fetch(url, init)
          .then(readJson)
          .then((next) => {
            if (!mounted.current) return;
            setState(next);
            setError(null);
          })
          .catch((cause) => {
            if (!mounted.current) return;
            setError(cause instanceof Error ? cause.message : String(cause));
          });
      };

      useEffect(() => {
        mounted.current = true;
        load(days, false);
        const timer = setInterval(() => {
          if (document.visibilityState === "visible") load(days, false);
        }, POLL_MS);
        return () => {
          mounted.current = false;
          clearInterval(timer);
        };
      }, [days]);

      const refresh = async () => {
        if (busy) return;
        setBusy(true);
        try {
          await load(days, true);
        } finally {
          if (mounted.current) setBusy(false);
        }
      };

      return { state, error, busy, refresh, reload: () => load(days, true) };
    }

    function Notice({ tone, title, text, children }) {
      return h("div", { className: `qtp-notice ${tone ? `is-${tone}` : ""}` },
        h("div", { className: "qtp-notice-title" }, title),
        text ? h("div", { className: "qtp-notice-text" }, text) : null,
        children ?? null);
    }

    function Stat({ label, value, hint, tone }) {
      return h("div", { className: `qtp-stat ${tone ? `is-${tone}` : ""}` },
        h("div", { className: "qtp-stat-label" }, label),
        h("div", { className: "qtp-stat-value" }, value),
        hint ? h("div", { className: "qtp-stat-hint" }, hint) : null);
    }

    function Ring({ percent, label, caption }) {
      const value = Math.max(0, Math.min(100, Number(percent) || 0));
      const radius = 46;
      const circumference = 2 * Math.PI * radius;
      const filled = (circumference * value) / 100;
      return h("div", { className: "qtp-ring" },
        h("svg", { viewBox: "0 0 120 120", role: "img", "aria-label": `${label} ${fmtPct(value)}` },
          h("circle", { cx: 60, cy: 60, r: radius, fill: "none", stroke: "var(--qtp-track)", strokeWidth: 10 }),
          h("circle", {
            cx: 60, cy: 60, r: radius, fill: "none", stroke: "var(--qtp-accent)", strokeWidth: 10,
            strokeLinecap: "round", strokeDasharray: `${filled} ${circumference - filled}`,
            transform: "rotate(-90 60 60)",
          })),
        h("div", { className: "qtp-ring-center" },
          h("div", { className: "qtp-ring-value" }, fmtPct(value)),
          h("div", { className: "qtp-ring-label" }, label)),
        caption ? h("div", { className: "qtp-ring-caption" }, caption) : null);
    }

    function Bars({ rows, days }) {
      const max = Math.max(1, ...rows.map((row) => Number(row.total) || 0));
      const step = rows.length > 30 ? 7 : rows.length > 14 ? 3 : 1;
      return h("div", { className: "qtp-bars", style: { "--qtp-bars": Math.max(rows.length, 1) } },
        rows.map((row, index) => {
          const height = Math.max(2, ((Number(row.total) || 0) / max) * 100);
          const showLabel = index % step === 0 || index === rows.length - 1;
          return h("div", { className: "qtp-bar-col", key: row.date, title: `${row.date} · ${fmtTokens(row.total)}` },
            h("div", { className: "qtp-bar-rail" },
              h("div", { className: "qtp-bar", style: { height: `${height}%` } })),
            showLabel ? h("div", { className: "qtp-bar-label" }, row.date.slice(5)) : h("div", { className: "qtp-bar-label" }, ""));
        }));
    }

    function Tabs({ tab, onChange }) {
      const items = [["overview", "overview"], ["usage", "usage"], ["benefits", "benefits"], ["models", "models"], ["settings", "settingsTab"], ["about", "about"]];
      return h("div", { className: "qtp-tabs", role: "tablist" },
        items.map(([id, key]) => h("button", {
          key: id, type: "button", role: "tab", "aria-selected": tab === id,
          className: `qtp-tab${tab === id ? " is-active" : ""}`, onClick: () => onChange(id),
        }, t(key))));
    }

    function CookieCard({ state, onRefresh }) {
      const [value, setValue] = useState("");
      const [busy, setBusy] = useState(false);
      const [error, setError] = useState(null);
      const [saved, setSaved] = useState(false);

      const save = async () => {
        if (busy || value.trim() === "") return;
        setBusy(true);
        setError(null);
        try {
          await readJson(await fetch(COOKIE_URL, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ cookie: value.trim() }),
          }));
          setValue("");
          setSaved(true);
          await onRefresh();
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
          setBusy(false);
        }
      };

      const clear = async () => {
        if (busy) return;
        setBusy(true);
        try {
          await readJson(await fetch(COOKIE_CLEAR_URL, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }));
          setSaved(false);
          await onRefresh();
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
          setBusy(false);
        }
      };

      const source = state?.console?.source ?? "none";
      return h("section", { className: "qtp-card qtp-cookie" },
        h("div", { className: "qtp-card-head" },
          h("div", null,
            h("h3", { className: "qtp-card-title" }, t("cookieTitle")),
            h("p", { className: "qtp-card-sub" }, t("cookieBody"))),
          h("span", { className: "qtp-pill" }, `${t("cookieFrom")} · ${sourceLabel(source)}`)),
        h("div", { className: "qtp-cookie-row" },
          h("input", {
            className: "qtp-input", type: "password", spellCheck: false, autoComplete: "off",
            placeholder: t("cookiePlaceholder"), value, onChange: (event) => setValue(event.target.value),
          }),
          h("button", { type: "button", className: "qtp-btn is-primary", disabled: busy || value.trim() === "", onClick: save },
            busy ? t("cookieSaving") : t("cookieSave")),
          state?.console?.cookieSaved
            ? h("button", { type: "button", className: "qtp-btn", disabled: busy, onClick: clear }, t("cookieClear"))
            : null),
        saved ? h("div", { className: "qtp-hint is-ok" }, t("cookieSaved")) : null,
        error ? h("div", { className: "qtp-hint is-error" }, error) : null);
    }

    function ApiKeyCard({ state, onRefresh }) {
      const [value, setValue] = useState("");
      const [busy, setBusy] = useState(false);
      const [error, setError] = useState(null);
      const [saved, setSaved] = useState(false);
      const provider = state?.provider ?? {};
      const configured = provider.apiKeyConfigured === true;

      const save = async () => {
        if (busy || value.trim() === "") return;
        setBusy(true);
        setError(null);
        setSaved(false);
        try {
          await readJson(await fetch(KEY_URL, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ apiKey: value.trim() }),
          }));
          setValue("");
          setSaved(true);
          await onRefresh();
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
          setBusy(false);
        }
      };

      const clear = async () => {
        if (busy) return;
        setBusy(true);
        setError(null);
        setSaved(false);
        try {
          await readJson(await fetch(KEY_CLEAR_URL, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }));
          setSaved(true);
          await onRefresh();
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
          setBusy(false);
        }
      };

      return h("section", { className: "qtp-card" },
        h("div", { className: "qtp-card-head" },
          h("div", null,
            h("h3", { className: "qtp-card-title" }, t("apiKeyTitle")),
            h("p", { className: "qtp-card-sub" }, t("apiKeyBody"))),
          h("span", { className: `qtp-pill${configured ? " is-ok" : ""}` },
            configured ? `${t("apiKeyConfigured")} · ${provider.apiKeyHint ?? ""}` : t("apiKeyMissing"))),
        h("div", { className: "qtp-cookie-row" },
          h("input", {
            className: "qtp-input", type: "password", spellCheck: false, autoComplete: "off",
            placeholder: t("apiKeyPlaceholder"), value, onChange: (event) => setValue(event.target.value),
            onKeyDown: (event) => { if (event.key === "Enter") save(); },
          }),
          h("button", { type: "button", className: "qtp-btn is-primary", disabled: busy || value.trim() === "", onClick: save },
            busy ? t("apiKeySaving") : t("apiKeySave")),
          configured ? h("button", { type: "button", className: "qtp-btn", disabled: busy, onClick: clear }, t("apiKeyClear")) : null),
        saved ? h("div", { className: "qtp-hint is-ok" }, value === "" && !configured ? t("apiKeyCleared") : t("apiKeySaved")) : null,
        error ? h("div", { className: "qtp-hint is-error" }, error) : null,
        h("div", { className: "qtp-hint" },
          h("a", { className: "qtp-link", href: API_KEYS_URL, target: "_blank", rel: "noreferrer noopener" }, t("apiKeyWhere"), " ↗")));
    }

    function PlanCards({ state }) {
      const plan = state?.plan;
      if (!plan) {
        return h("section", { className: "qtp-card" },
          h("h3", { className: "qtp-card-title" }, t("plan")),
          h("p", { className: "qtp-muted" }, t("emptyPlan")),
          state?.planError ? h("p", { className: "qtp-hint is-error" }, state.planError) : null);
      }
      const tier = plan.tierName || t("tierUnknown");
      return h("section", { className: "qtp-card qtp-plan" },
        h("div", { className: "qtp-plan-main" },
          h("div", { className: "qtp-plan-tier" },
            h("div", { className: "qtp-plan-kicker" }, t("plan")),
            h("div", { className: "qtp-plan-name" }, tier),
            h("div", { className: "qtp-plan-status" },
              h("span", { className: "qtp-dot" }),
              plan.status === "VALID" ? t("statusValid") : (plan.status || "—"),
              plan.remainingDays !== undefined ? ` · ${t("planDaysLeft")} ${plan.remainingDays} ${t("days")}` : "")),
          h("div", { className: "qtp-plan-facts" },
            fact(t("planStart"), fmtDate(plan.startTime)),
            fact(t("planEnd"), fmtDate(plan.endTime)),
            fact(t("planMonthly"), `${fmtInt(plan.monthlyCredits)} ${t("credits")}`, plan.addonCredits > 0 ? `${t("planCreditsHint")} (+${fmtInt(plan.addonCredits)})` : null),
            fact(t("planRemainingCredits"), plan.remainingCredits !== undefined ? `${fmtInt(plan.remainingCredits)} ${t("credits")}` : "—"),
            fact(t("autoRenew"), plan.autoRenew ? t("on") : t("off")),
            fact(t("planReset"), fmtDateTime(plan.resetTime)))),
        h("div", { className: "qtp-plan-gauge" },
          Ring({
            percent: plan.remainingPercent,
            label: t("planRemaining"),
            caption: plan.resetTime ? `${t("planReset")} ${fmtDate(plan.resetTime)}` : null,
          })));
    }

    function fact(label, value, hint) {
      return h("div", { className: "qtp-fact" },
        h("div", { className: "qtp-fact-label" }, label),
        h("div", { className: "qtp-fact-value" }, value),
        hint ? h("div", { className: "qtp-fact-hint" }, hint) : null);
    }

    function OverviewTab({ state, days, refresh, busy, openSettings }) {
      const daily = state?.daily;
      const rows = daily?.rows ?? [];
      const today = state?.today;
      const todayRow = rows.find((row) => row.date === today);
      const last7 = rows.slice(-7);
      const total7 = last7.reduce((sum, row) => sum + (Number(row.total) || 0), 0);
      const input7 = last7.reduce((sum, row) => sum + (Number(row.input) || 0), 0);
      const cached7 = last7.reduce((sum, row) => sum + (Number(row.cached) || 0), 0);
      const cacheRate = input7 + cached7 > 0 ? (cached7 / (input7 + cached7)) * 100 : 0;

      return h("div", { className: "qtp-stack" },
        state?.provider?.apiKeyConfigured === false
          ? h(Notice, { tone: "warn", title: t("keyNotice") },
            h("button", { type: "button", className: "qtp-btn", onClick: openSettings }, t("goSettings")))
          : null,
        state?.console?.configured === false
          ? h(Notice, { tone: "warn", title: t("noConsole") },
            h("button", { type: "button", className: "qtp-btn", onClick: openSettings }, t("goSettings")))
          : null,
        h("div", { className: "qtp-kpis" },
          h(Stat, { label: t("today"), value: todayRow ? fmtTokens(todayRow.total) : (daily ? "0" : "—"), hint: today }),
          h(Stat, { label: t("last7"), value: daily ? fmtTokens(total7) : "—", hint: daily ? `${rows.length} ${t("date")}` : null }),
          h(Stat, { label: t("cacheHit"), value: daily ? fmtPct(cacheRate) : "—", hint: t("cacheRateHint") }),
          h(Stat, { label: t("modelCount"), value: fmtInt(state?.models?.length ?? 0), hint: state?.provider?.registered ? t("providerRegistered") : t("providerUnregistered") })),
        h(PlanCards, { state }),
        h("section", { className: "qtp-card" },
          h("div", { className: "qtp-card-head" },
            h("div", null,
              h("h3", { className: "qtp-card-title" }, t("dailyTrend")),
              h("p", { className: "qtp-card-sub" }, `${t("range7")} · ${state?.plan?.specCode ? state.plan.specCode.toUpperCase() : "Token Plan"}`)),
            h("button", { type: "button", className: "qtp-btn", onClick: refresh, disabled: busy },
              busy ? t("refreshing") : t("refresh"))),
          rows.length > 0
            ? h(Bars, { rows: last7, days })
            : h("p", { className: "qtp-muted" }, state?.dailyError ?? t("noData"))),
        h("section", { className: "qtp-card" },
          h("h3", { className: "qtp-card-title" }, t("providerTitle")),
          h("div", { className: "qtp-facts" },
            fact(t("providerId"), state?.provider?.id ?? "—"),
            fact(t("providerBase"), h("code", { className: "qtp-code" }, state?.provider?.baseURL ?? "—")),
            fact(t("providerKey"), state?.provider?.apiKeyConfigured ? t("keyConfigured") : t("keyMissing")),
            fact(t("modelCount"), fmtInt(state?.provider?.modelCount ?? 0))),
          h("p", { className: "qtp-hint" }, t("providerHint")),
          state?.provider?.error ? h("p", { className: "qtp-hint is-error" }, state.provider.error) : null));
    }

    function UsageTab({ state, days, setDays, refresh, busy }) {
      const daily = state?.daily;
      const rows = daily?.rows ?? [];
      const totals = daily?.totals;
      const options = [[7, "range7"], [30, "range30"], [90, "range90"]];
      return h("div", { className: "qtp-stack" },
        h("div", { className: "qtp-toolbar" },
          h("div", { className: "qtp-segment" }, options.map(([value, key]) => h("button", {
            key: value, type: "button", className: `qtp-seg${days === value ? " is-active" : ""}`,
            onClick: () => setDays(value),
          }, t(key)))),
          h("button", { type: "button", className: "qtp-btn", onClick: refresh, disabled: busy }, busy ? t("refreshing") : t("refresh"))),
        state?.dailyError ? h(Notice, { tone: "error", title: t("dailyError"), text: state.dailyError }) : null,
        totals && rows.length > 0
          ? h("div", { className: "qtp-kpis" },
            h(Stat, { label: t("totalTokens"), value: fmtTokens(totals.total) }),
            h(Stat, { label: t("inputTokens"), value: fmtTokens(totals.input) }),
            h(Stat, { label: t("outputTokens"), value: fmtTokens(totals.output) }),
            h(Stat, { label: t("cachedTokens"), value: fmtTokens(totals.cached), hint: fmtPct(totals.cacheRate) }))
          : null,
        h("section", { className: "qtp-card" },
          h("h3", { className: "qtp-card-title" }, t("dailyTrend")),
          rows.length > 0 ? h(Bars, { rows, days }) : h("p", { className: "qtp-muted" }, t("usageEmpty"))),
        h("section", { className: "qtp-card qtp-table-card" },
          h("h3", { className: "qtp-card-title" }, t("usageTable")),
          rows.length > 0
            ? h("div", { className: "qtp-table-wrap" },
              h("table", { className: "qtp-table" },
                h("thead", null, h("tr", null,
                  h("th", null, t("date")),
                  h("th", null, t("total")),
                  h("th", null, t("inputTokens")),
                  h("th", null, t("outputTokens")),
                  h("th", null, t("cachedTokens")),
                  h("th", null, t("imageTokens")))),
                h("tbody", null, rows.slice().reverse().map((row) => h("tr", { key: row.date },
                  h("td", null, row.date),
                  h("td", null, fmtTokens(row.total)),
                  h("td", null, fmtTokens(row.input)),
                  h("td", null, fmtTokens(row.output)),
                  h("td", null, fmtTokens(row.cached)),
                  h("td", null, fmtTokens(row.image)))))))
            : h("p", { className: "qtp-muted" }, t("usageEmpty"))));
    }

    function BenefitsTab({ state }) {
      const equity = state?.equity ?? [];
      const benefits = state?.benefits ?? [];
      const coverage = state?.benefitsMeta?.planCodeEquity ?? {};
      const covered = new Set();
      for (const [code, key] of Object.entries(coverage)) {
        if (equity.some((row) => row.key === key)) covered.add(code);
      }
      return h("div", { className: "qtp-stack" },
        state?.equityError ? h(Notice, { tone: "error", title: t("equityError"), text: state.equityError }) : null,
        h("section", { className: "qtp-card" },
          h("div", { className: "qtp-card-head" },
            h("div", null,
              h("h3", { className: "qtp-card-title" }, t("benefitsTitle")),
              h("p", { className: "qtp-card-sub" }, t("benefitsNote")))),
          equity.length > 0
            ? h("div", { className: "qtp-equity-grid" }, equity.map((row) => {
              const pct = row.total > 0 ? (row.available / row.total) * 100 : 0;
              return h("div", { className: "qtp-equity", key: row.key },
                h("div", { className: "qtp-equity-head" },
                  h("span", { className: "qtp-equity-title" }, row.title),
                  h("span", { className: `qtp-equity-left${pct <= 0 ? " is-empty" : ""}` },
                    pct <= 0 ? t("exhausted") : `${t("remaining")} ${fmtInt(row.available)} ${row.unit}`)),
                h("div", { className: "qtp-progress" }, h("div", { className: "qtp-progress-fill", style: { width: `${Math.max(0, Math.min(100, pct))}%` } })),
                h("div", { className: "qtp-equity-foot" },
                  h("span", null, `${t("totalLabel")} ${fmtInt(row.total)} ${row.unit}`),
                  h("span", null, fmtPct(pct, 0))));
            }))
            : h("p", { className: "qtp-muted" }, t("benefitsEmpty"))),
        benefits.length > 0
          ? h("section", { className: "qtp-card qtp-table-card" },
            h("h3", { className: "qtp-card-title" }, t("benefitsCatalog")),
            h("div", { className: "qtp-table-wrap" },
              h("table", { className: "qtp-table" },
                h("thead", null, h("tr", null,
                  h("th", null, t("benefitsTitle")),
                  h("th", null, t("benefitPrice")),
                  h("th", null, t("coverage")))),
                h("tbody", null, benefits.map((item, index) => {
                  const included = item.planCodes.some((code) => covered.has(code));
                  return h("tr", { key: `${item.title}-${index}` },
                    h("td", null, item.title),
                    h("td", null, item.currentPrice ? `${item.currency}${item.currentPrice}/${item.unit || "—"}` : "—"),
                    h("td", null, h("span", { className: `qtp-pill${included ? " is-ok" : ""}` },
                      included ? t("benefitIncluded") : t("benefitNotIncluded"))));
                })))))
          : null,
        state?.benefitsError ? h(Notice, { tone: "error", title: t("benefitsError"), text: state.benefitsError }) : null);
    }

    function ModelsTab({ state }) {
      const [query, setQuery] = useState("");
      const models = state?.models ?? [];
      const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (q === "") return models;
        return models.filter((model) => model.id.toLowerCase().includes(q) || String(model.name ?? "").toLowerCase().includes(q));
      }, [models, query]);
      return h("div", { className: "qtp-stack" },
        state?.modelsError ? h(Notice, { tone: "warn", title: t("modelsError"), text: state.modelsError }) : null,
        h("section", { className: "qtp-card qtp-table-card" },
          h("div", { className: "qtp-card-head" },
            h("div", null,
              h("h3", { className: "qtp-card-title" }, t("modelsTitle")),
              h("p", { className: "qtp-card-sub" }, t("modelsNote"))),
            h("input", {
              className: "qtp-input qtp-input-inline", type: "search",
              placeholder: t("searchModels"), value: query,
              onChange: (event) => setQuery(event.target.value),
            })),
          h("div", { className: "qtp-table-wrap" },
            h("table", { className: "qtp-table" },
              h("thead", null, h("tr", null,
                h("th", null, t("modelId")),
                h("th", null, t("modelName")),
                h("th", null, t("capabilities")),
                h("th", null, t("editions")),
                h("th", null, t("contextWindow")),
                h("th", null, t("maxOutput")),
                h("th", null, t("reasoningLevels")))),
              h("tbody", null, filtered.map((model) => h("tr", { key: model.id },
                h("td", null, h("code", { className: "qtp-code" }, model.id),
                  model.isNew ? h("span", { className: "qtp-new" }, t("newBadge")) : null),
                h("td", null, model.name),
                h("td", null, h("div", { className: "qtp-caps" }, (model.capabilities ?? []).map((cap) =>
                  h("span", { className: `qtp-cap cap-${cap.toLowerCase()}`, key: cap }, t(CAP_LABEL[cap] ?? cap))))),
                h("td", null, (model.editions ?? []).join(" / ") || "—"),
                h("td", null, fmtInt(model.contextWindow)),
                h("td", null, fmtInt(model.maxTokens)),
                h("td", {
                  title: model.reasoning ? model.reasoning.efforts.map((id) => levelName(id)).join(" / ") : "",
                }, model.reasoning
                  ? `${model.reasoning.efforts.length} 档 · ${t("defaultLevel")} ${levelName(model.reasoning.defaultEffort)}`
                  : "—")))))),
          filtered.length === 0 ? h("p", { className: "qtp-muted" }, t("modelsEmpty")) : null));
    }

    function SettingsTab({ state, refresh }) {
      const provider = state?.provider ?? {};
      return h("div", { className: "qtp-stack" },
        h("section", { className: "qtp-card" },
          h("h3", { className: "qtp-card-title" }, t("settingsTitle")),
          h("p", { className: "qtp-card-sub" }, t("settingsSub"))),
        h(ApiKeyCard, { state, onRefresh: refresh }),
        h(CookieCard, { state, onRefresh: refresh }),
        h("section", { className: "qtp-card" },
          h("h3", { className: "qtp-card-title" }, t("endpointTitle")),
          h("div", { className: "qtp-facts" },
            fact(t("providerId"), provider.id ?? "—"),
            fact(t("providerBase"), h("code", { className: "qtp-code" }, provider.baseURL ?? "—")),
            fact(t("apiKeyEnv"), h("code", { className: "qtp-code" }, provider.apiKeyEnv ?? "—")),
            fact(t("providerKeySource"), provider.apiKeyConfigured
              ? `${t("apiKeyConfigured")} · ${sourceLabel(provider.apiKeySource)}`
              : t("notConfigured")),
            fact(t("modelCount"), fmtInt(provider.modelCount ?? 0))),
          h("p", { className: "qtp-hint" }, t("endpointHint"))));
    }

    function AboutTab({ state, refresh, busy }) {
      const links = [
        ["https://platform.qianwenai.com/docs/token-plan/overview", t("tokenPlanDocs")],
        ["https://platform.qianwenai.com/docs/developer-guides/clients-and-developer-tools/deepseek-harness", t("dshGuide")],
        ["https://github.com/Duskriver/dsh-opencode-go", t("sourceCode")],
      ];
      return h("div", { className: "qtp-stack" },
        h("section", { className: "qtp-card" },
          h("h3", { className: "qtp-card-title" }, t("aboutTitle")),
          h("div", { className: "qtp-facts" },
            fact(t("version"), state?.version ?? "—"),
            fact(t("providerId"), state?.provider?.id ?? "—"),
            fact(t("providerBase"), h("code", { className: "qtp-code" }, state?.provider?.baseURL ?? "—")),
            fact(t("cookieEnv"), h("code", { className: "qtp-code" }, state?.console?.cookieEnv ?? "—")),
            fact(t("apiKeyEnv"), h("code", { className: "qtp-code" }, state?.provider?.apiKeyEnv ?? "QWEN_TOKEN_PLAN_API_KEY")),
            fact(t("providerKeySource"), state?.provider?.apiKeyConfigured
              ? `${t("apiKeyConfigured")} · ${sourceLabel(state?.provider?.apiKeySource)}`
              : t("notConfigured")),
            fact(t("refreshInterval"), `${state?.console?.refreshSeconds ?? 60} ${t("seconds")}`),
            fact(t("catalogRefresh"), state?.catalog?.refreshMinutes > 0
              ? `${state.catalog.refreshMinutes} ${t("minutes")}`
              : t("off"),
              state?.catalog?.syncedAt ? `${t("lastSync")} ${fmtClock(state.catalog.syncedAt)}` : null),
            fact(t("catalogSource"), state?.catalog?.source ?? "—",
              state?.catalog?.endpointCount > 0 ? `${state.catalog.endpointCount} ${t("endpointModels")}` : null),
            fact(t("updated"), fmtClock(state?.fetchedAt))),
          h("div", { className: "qtp-links" }, links.map(([url, label]) =>
            h("a", { key: url, href: url, target: "_blank", rel: "noreferrer noopener", className: "qtp-link" }, label, " ↗"))),
          h("div", { className: "qtp-actions" },
            h("button", { type: "button", className: "qtp-btn", onClick: refresh, disabled: busy }, busy ? t("refreshing") : t("refresh")))),
        h("p", { className: "qtp-foot" }, t("footerNote")));
    }

    function Page() {
      const [tab, setTab] = useState("overview");
      const [days, setDays] = useState(7);
      const { state, error, busy, refresh } = useConsoleState(days);

      if (error !== null && state === null) {
        return h("div", { className: "qtp-root" },
          h("div", { className: "qtp-page" },
            h(Notice, { tone: "error", title: t("loadFailed"), text: error },
              h("button", { type: "button", className: "qtp-btn", onClick: refresh }, t("retry")))));
      }

      return h("div", { className: "qtp-root" },
        h("div", { className: "qtp-page" },
          h("header", { className: "qtp-header" },
            h("div", { className: "qtp-brand" },
              h("span", { className: "qtp-logo", "aria-hidden": "true" }, markSvg(22)),
              h("div", null,
                h("h1", { className: "qtp-title" }, t("title")),
                h("p", { className: "qtp-sub" }, t("subtitle")))),
            h("div", { className: "qtp-header-actions" },
              h("span", { className: "qtp-updated" }, `${t("updated")} ${fmtClock(state?.fetchedAt)}`),
              h("button", { type: "button", className: "qtp-btn", onClick: refresh, disabled: busy },
                busy ? t("refreshing") : t("refresh")))),
          h(Tabs, { tab, onChange: setTab }),
          tab === "overview" ? h(OverviewTab, { state, days, refresh, busy, openSettings: () => setTab("settings") }) : null,
          tab === "usage" ? h(UsageTab, { state, days, setDays, refresh, busy }) : null,
          tab === "benefits" ? h(BenefitsTab, { state }) : null,
          tab === "models" ? h(ModelsTab, { state }) : null,
          tab === "settings" ? h(SettingsTab, { state, refresh }) : null,
          tab === "about" ? h(AboutTab, { state, refresh, busy }) : null,
          state?.ok === false && state?.error ? h(Notice, { tone: "error", title: t("loadFailed"), text: state.error }) : null));
    }

    function markSvg(size) {
      return h("svg", { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": "true" },
        h("circle", { cx: 12, cy: 12, r: 8.4, fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeDasharray: "39 14", strokeLinecap: "round", transform: "rotate(-90 12 12)" }),
        h("circle", { cx: 12, cy: 12, r: 2.6, fill: "currentColor" }));
    }

    function SidebarIcon({ size = 20, active = false }) {
      return h("span", { className: `qtp-icon${active ? " is-active" : ""}`, style: { width: size, height: size } }, markSvg(size));
    }

    function css() {
      return `
.qtp-root { --qtp-bg: var(--dsw-alias-bg-base, #ffffff); --qtp-card: var(--dsw-alias-bg-layer-1, #f8f8fa);
  --qtp-card-2: var(--dsw-alias-bg-layer-2, #ffffff); --qtp-border: var(--dsw-alias-border-l1, rgba(0,0,0,.09));
  --qtp-border-2: var(--dsw-alias-border-l2, rgba(0,0,0,.16)); --qtp-text: var(--dsw-alias-label-primary, #111318);
  --qtp-muted: var(--dsw-alias-label-secondary, #6b7280); --qtp-accent: var(--dsw-alias-brand-primary, #4f6bff);
  --qtp-track: color-mix(in oklab, var(--qtp-border) 70%, transparent); --qtp-ok: var(--dsw-alias-state-success-primary, #16a34a);
  --qtp-warn: var(--dsw-alias-state-warn-primary, #d97706); --qtp-error: var(--dsw-alias-state-error-primary, #dc2626);
  height: 100%; overflow: auto; background: var(--qtp-bg); color: var(--qtp-text); }
.qtp-page { max-width: 1080px; margin: 0 auto; padding: 26px 24px 56px; display: flex; flex-direction: column; gap: 18px; }
.qtp-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.qtp-brand { display: flex; align-items: center; gap: 12px; }
.qtp-logo { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 12px;
  color: #fff; background: linear-gradient(135deg, #4f6bff, #8b5cf6); }
.qtp-title { margin: 0; font-size: 21px; font-weight: 650; letter-spacing: -.01em; }
.qtp-sub { margin: 2px 0 0; color: var(--qtp-muted); font-size: 13px; }
.qtp-header-actions { display: flex; align-items: center; gap: 10px; }
.qtp-updated { color: var(--qtp-muted); font-size: 12px; }
.qtp-btn { appearance: none; border: 1px solid var(--qtp-border-2); background: var(--qtp-card-2); color: var(--qtp-text);
  border-radius: 9px; padding: 7px 13px; font-size: 13px; cursor: pointer; transition: background .12s, border-color .12s; }
.qtp-btn:hover:not(:disabled) { border-color: var(--qtp-accent); }
.qtp-btn:disabled { opacity: .55; cursor: default; }
.qtp-btn.is-primary { background: var(--qtp-accent); border-color: var(--qtp-accent); color: #fff; }
.qtp-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--qtp-border); }
.qtp-tab { appearance: none; border: 0; background: transparent; color: var(--qtp-muted); padding: 9px 13px; font-size: 13px; cursor: pointer;
  border-bottom: 2px solid transparent; margin-bottom: -1px; }
.qtp-tab:hover { color: var(--qtp-text); }
.qtp-tab.is-active { color: var(--qtp-accent); border-bottom-color: var(--qtp-accent); font-weight: 600; }
.qtp-stack { display: flex; flex-direction: column; gap: 16px; }
.qtp-card { background: var(--qtp-card); border: 1px solid var(--qtp-border); border-radius: 14px; padding: 18px; }
.qtp-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
.qtp-card-title { margin: 0; font-size: 15px; font-weight: 620; }
.qtp-card-sub { margin: 4px 0 0; color: var(--qtp-muted); font-size: 12.5px; line-height: 1.55; max-width: 68ch; }
.qtp-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; }
.qtp-stat { background: var(--qtp-card); border: 1px solid var(--qtp-border); border-radius: 12px; padding: 14px 16px; }
.qtp-stat-label { color: var(--qtp-muted); font-size: 12px; }
.qtp-stat-value { margin-top: 6px; font-size: 24px; font-weight: 650; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.qtp-stat-hint { margin-top: 4px; color: var(--qtp-muted); font-size: 11.5px; }
.qtp-plan { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.qtp-plan-main { display: flex; gap: 34px; flex-wrap: wrap; }
.qtp-plan-kicker { color: var(--qtp-muted); font-size: 12px; }
.qtp-plan-name { font-size: 26px; font-weight: 680; letter-spacing: -.02em; margin-top: 2px; }
.qtp-plan-status { margin-top: 6px; color: var(--qtp-muted); font-size: 12.5px; display: flex; align-items: center; gap: 6px; }
.qtp-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--qtp-ok); display: inline-block; }
.qtp-plan-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px 22px; min-width: 280px; flex: 1; }
.qtp-fact-label { color: var(--qtp-muted); font-size: 11.5px; }
.qtp-fact-value { margin-top: 3px; font-size: 13.5px; font-weight: 550; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.qtp-fact-hint { margin-top: 2px; color: var(--qtp-muted); font-size: 11px; }
.qtp-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px 20px; margin-top: 12px; }
.qtp-ring { display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; }
.qtp-ring svg { width: 132px; height: 132px; }
.qtp-ring-center { position: absolute; top: 44px; left: 50%; transform: translateX(-50%); text-align: center; width: 110px; }
.qtp-ring-value { font-size: 23px; font-weight: 700; font-variant-numeric: tabular-nums; }
.qtp-ring-label { color: var(--qtp-muted); font-size: 11px; }
.qtp-ring-caption { color: var(--qtp-muted); font-size: 11px; }
.qtp-bars { display: flex; align-items: stretch; gap: 3px; height: 190px; margin-top: 18px; overflow: hidden; }
.qtp-bar-col { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; justify-content: flex-end; gap: 6px; }
.qtp-bar-rail { flex: 1; display: flex; align-items: flex-end; }
.qtp-bar { width: 100%; background: linear-gradient(180deg, var(--qtp-accent), #8b5cf6); border-radius: 4px 4px 2px 2px; min-height: 2px;
  opacity: .85; transition: opacity .12s; }
.qtp-bar-col:hover .qtp-bar { opacity: 1; }
.qtp-bar-label { color: var(--qtp-muted); font-size: 10px; text-align: center; white-space: nowrap; overflow: hidden; height: 12px; }
.qtp-notice { border: 1px solid var(--qtp-border); background: var(--qtp-card); border-radius: 12px; padding: 13px 15px; }
.qtp-notice.is-warn { border-color: color-mix(in oklab, var(--qtp-warn) 45%, var(--qtp-border)); }
.qtp-notice.is-error { border-color: color-mix(in oklab, var(--qtp-error) 45%, var(--qtp-border)); }
.qtp-notice-title { font-size: 13px; font-weight: 600; }
.qtp-notice-text { margin-top: 5px; color: var(--qtp-muted); font-size: 12.5px; line-height: 1.55; overflow-wrap: anywhere; }
.qtp-notice .qtp-btn { margin-top: 10px; }
.qtp-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.qtp-segment { display: inline-flex; background: var(--qtp-card); border: 1px solid var(--qtp-border); border-radius: 10px; padding: 3px; }
.qtp-seg { appearance: none; border: 0; background: transparent; color: var(--qtp-muted); border-radius: 7px; padding: 5px 12px; font-size: 12.5px; cursor: pointer; }
.qtp-seg.is-active { background: var(--qtp-card-2); color: var(--qtp-text); box-shadow: 0 1px 2px rgba(0,0,0,.08); }
.qtp-table-card { padding: 18px; }
.qtp-table-wrap { margin-top: 12px; overflow-x: auto; }
.qtp-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.qtp-table th { text-align: left; color: var(--qtp-muted); font-weight: 500; padding: 8px 10px; border-bottom: 1px solid var(--qtp-border); white-space: nowrap; }
.qtp-table td { padding: 8px 10px; border-bottom: 1px solid var(--qtp-border); font-variant-numeric: tabular-nums; vertical-align: middle; }
.qtp-table tbody tr:last-child td { border-bottom: 0; }
.qtp-table tbody tr:hover td { background: var(--qtp-card-2); }
.qtp-code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; padding: 1px 5px; border-radius: 5px;
  background: var(--qtp-card-2); border: 1px solid var(--qtp-border); overflow-wrap: anywhere; }
.qtp-new { margin-left: 6px; font-size: 10px; padding: 1px 5px; border-radius: 999px; color: var(--qtp-accent);
  border: 1px solid currentColor; }
.qtp-pill { font-size: 11.5px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--qtp-border-2); color: var(--qtp-muted); white-space: nowrap; }
.qtp-pill.is-ok { color: var(--qtp-ok); border-color: color-mix(in oklab, var(--qtp-ok) 45%, var(--qtp-border)); }
.qtp-caps { display: flex; gap: 4px; flex-wrap: wrap; }
.qtp-cap { font-size: 10.5px; padding: 1px 6px; border-radius: 5px; background: var(--qtp-card-2); border: 1px solid var(--qtp-border); color: var(--qtp-muted); }
.qtp-cap.cap-reasoning { color: #8b5cf6; border-color: color-mix(in oklab, #8b5cf6 40%, var(--qtp-border)); }
.qtp-cap.cap-vu { color: #0ea5e9; border-color: color-mix(in oklab, #0ea5e9 40%, var(--qtp-border)); }
.qtp-equity-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; margin-top: 14px; }
.qtp-equity { background: var(--qtp-card-2); border: 1px solid var(--qtp-border); border-radius: 10px; padding: 12px; }
.qtp-equity-head { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; }
.qtp-equity-title { font-size: 12.5px; font-weight: 600; }
.qtp-equity-left { font-size: 11.5px; color: var(--qtp-muted); white-space: nowrap; }
.qtp-equity-left.is-empty { color: var(--qtp-warn); }
.qtp-progress { height: 7px; border-radius: 999px; background: var(--qtp-track); margin-top: 9px; overflow: hidden; }
.qtp-progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--qtp-accent), #8b5cf6); }
.qtp-equity-foot { display: flex; justify-content: space-between; color: var(--qtp-muted); font-size: 10.5px; margin-top: 6px; }
.qtp-cookie-row { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.qtp-input { flex: 1 1 260px; min-width: 0; background: var(--qtp-card-2); border: 1px solid var(--qtp-border-2); color: var(--qtp-text);
  border-radius: 9px; padding: 8px 11px; font-size: 13px; outline: none; }
.qtp-input:focus { border-color: var(--qtp-accent); }
.qtp-input-inline { flex: 0 1 240px; }
.qtp-hint { margin-top: 9px; color: var(--qtp-muted); font-size: 12px; line-height: 1.55; overflow-wrap: anywhere; }
.qtp-hint.is-error { color: var(--qtp-error); }
.qtp-hint.is-ok { color: var(--qtp-ok); }
.qtp-muted { color: var(--qtp-muted); font-size: 12.5px; line-height: 1.6; }
.qtp-muted a { color: var(--qtp-accent); }
.qtp-links { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 16px; }
.qtp-link { color: var(--qtp-accent); font-size: 12.5px; text-decoration: none; }
.qtp-link:hover { text-decoration: underline; }
.qtp-actions { margin-top: 16px; }
.qtp-foot { color: var(--qtp-muted); font-size: 11.5px; }
.qtp-icon { display: inline-flex; align-items: center; justify-content: center; color: currentColor; }
.qtp-icon.is-active { color: var(--dsw-alias-brand-primary, #4f6bff); }
@media (max-width: 640px) {
  .qtp-page { padding: 18px 14px 40px; }
  .qtp-plan { align-items: flex-start; }
  .qtp-bars { height: 150px; }
}
`;
    }

    function apply(ctx) {
      ctx.effect(() => {
        if (typeof document === "undefined") return () => {};
        if (document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return () => {};
        const style = document.createElement("style");
        style.dataset.plugin = "dsh-qwen-token-plan";
        style.dataset.pluginCss = STYLE_ID;
        style.textContent = css();
        document.head.appendChild(style);
        return () => style.remove();
      }, "dsh-qwen-token-plan: styles");

      const slots = ctx.get("slots");
      if (slots === undefined) {
        ctx.logger?.warn?.(new Error("dsh-qwen-token-plan: host did not provide the slots service"));
        return;
      }

      ctx.effect(() => slots.inject("settings.section", () => slots.register({
        name: "settings.section",
        id: PAGE_ID,
        order: 22,
        label: () => t("nav"),
      }, Page)), "dsh-qwen-token-plan: settings section");

      ctx.effect(() => slots.inject("sidebar.panellist", () => {
        const disposeMain = slots.register({ name: "main", key: PAGE_ID }, Page);
        let disposeRow;
        try {
          disposeRow = slots.register({ name: "sidebar.panellist", id: PAGE_ID, order: 2, label: () => t("nav") }, SidebarIcon);
        } catch (error) {
          disposeMain();
          throw error;
        }
        return () => {
          try { disposeRow(); } finally { disposeMain(); }
        };
      }), "dsh-qwen-token-plan: sidebar page");
    }

    exports.apply = apply;
    exports.inject = ["slots"];
    return module.exports;
  },
});
