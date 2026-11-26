# dsh-qwen-token-plan

DeepSeek Harness 的 **千问 AI 平台 Token Plan** 接入插件：把订阅变成可用的模型线路，同时把套餐余量、每日 Token 用量和 Harness 权益做成一个和 [dsh-opencode-go](https://github.com/Duskriver/dsh-opencode-go) 同风格的只读控制台。

支持 DSH `0.2.1-rc.5` 及以上（在 `0.2.3-alpha.2` 上开发与验证）。

## 功能

- **模型线路**：按千问官方 DSH 指南接入 `https://token-plan.maas.qianwenaiapi.com/compatible-mode/v1`（OpenAI Chat Completions），在模型选择器里以「千问 Token Plan」出现，可选 `auto`、`qwen4-max`、`qwen3.8-max`、`qwen3.8-flash`、`deepseek-v4.1-flash`、`glm-5.3` 等。
- **套餐总览**：套餐档位（Lite / Essential / Standard / Pro）、剩余百分比、剩余 Credits、月额度（含加油包）、5 小时额度、剩余天数、到期与重置时间、自动续费状态。
- **每日用量**：直连控制台同源指标，按天汇总总 / 输入 / 输出 / 缓存命中 / 图片 Token，支持近 7 / 30 / 90 天；附每日明细表与缓存命中率。
- **Harness 权益**：7 项权益（联网搜索增强、垂类搜索、网页解析、代码解释器、语音合成、语音识别、图像生成）的剩余 / 总量，以及带官方单价的权益服务目录。
- **推理等级**：按官方文档为每个模型接上思考参数——Qwen4 / Qwen3.8 Max 走 `reasoning_effort`（低 / 中 / 高 / 超高），Qwen3.x、GLM 走 `thinking_budget`，DeepSeek V4 只有开 / 关；`glm-5.3` 这类仅思考模型不提供「关闭」。
- **模型目录（定时同步）**：默认每 30 分钟请求 Token Plan 端点的 `GET /models` 动态发现模型，再与控制台授权信息和内置规格合并；新增/下线模型会通过 `llm/adapters-updated` 通知模型选择器即时刷新。
- **模型信息**：标注文本 / 视觉 / 推理能力、上下文、最大输出与推理档位。
- **两个入口**：设置 →「千问 Token Plan」整页控制台；侧边栏同名图标直接打开同一个页面。
- **Key 与 Cookie 就地配置**：模型 API Key 和控制台 Cookie 都在面板「设置」页填写，写入本机 DSH 凭据，不用手改配置文件或 `~/.dsh/.env`。

## 安装

在 DSH 的 **插件 → 添加插件** 中填入本目录的绝对路径（本地目录安装），或：

```sh
dsh plugin --profile desktop add link:/绝对路径/dsh-qwen-token-plan
```

安装后如果宿主没有热更新，按提示重启一次 `dsh web` / 桌面端。

## 配置

### 1. API Key（模型线路）

打开侧边栏的 **千问 Token Plan**（或设置里的同名分页），切到 **设置** 标签页，在「模型 API Key」里粘贴 Token Plan 专属 API Key（`sk-sp-` 开头）并保存，即时生效、不用重启。也可以设置环境变量 / 凭据：

```
QWEN_TOKEN_PLAN_API_KEY
```

> 保存的 Key 写入本机 DSH 凭据，不会写进配置文件；「设置」页也会显示 Key 来源与末四位，并可一键清除。

> Token Plan 的 Key 与站点绑定：本插件默认使用中国站（北京）。国际站用户请在插件配置里把 `baseURL` 改为 `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`。

### 2. 控制台 Cookie（套餐与用量）

面板顶部会提示连接控制台。登录 [platform.qianwenai.com](https://platform.qianwenai.com) 后，从浏览器开发者工具复制该站点的完整 Cookie，粘贴到面板输入框保存即可；也可以把 Cookie 写成环境变量或放进 `~/.dsh/.env`：

```
BAILIAN_CONSOLE_COOKIE=...
```

Cookie 仅用于本机只读查询控制台，不会发往第三方。没有 Cookie 时模型线路照常工作，只是套餐面板显示「未连接」。

### 3. 可选配置（插件配置表单）

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `providerId` | `qwen-token-plan` | 模型 provider 路由 id |
| `displayName` | `千问 Token Plan` | 模型选择器里的显示名 |
| `apiKeyEnv` | `QWEN_TOKEN_PLAN_API_KEY` | API Key 的凭据名 |
| `baseURL` | 中国站 compatible-mode/v1 | 模型端点 |
| `consoleCookieEnv` | `BAILIAN_CONSOLE_COOKIE` | 控制台 Cookie 的凭据名 |
| `models` | `[]` | 额外追加的模型 id（控制台新模型可先手动加） |
| `excludeModels` | `[]` | 从目录隐藏的模型 id |
| `contextWindow` / `maxTokens` | `262144` / `32768` | 未在快照中的模型的保守默认值 |
| `requestTimeoutMs` | `120000` | 单次模型请求超时 |
| `consoleRefreshSeconds` | `60` | 面板数据缓存与轮询间隔 |
| `catalogRefreshMinutes` | `30` | 模型目录后台同步间隔（分钟，`0` 关闭） |
| `registerProvider` | `true` | 关掉后只做控制台，不注册模型线路 |

## 已知限制

- 模型列表来自 Token Plan 端点的 `GET /models`（2026-11-26 实测返回 200，22 个条目，含图像/视频/语音模型），插件会过滤掉非对话模型；端点只返回 id，能力、上下文与推理档位由内置规格和控制台元数据补全。
- 官方 DSH 指南仍写着 `GET /models` 返回 401/404，该说明已过时；没有 API Key 时会回退到控制台授权列表（该列表单次最多 10 行且忽略翻页），所以首次配置 Key 前目录可能不全。
- 只实现 **Chat Completions** 文本/视觉对话与工具调用；图像生成、视频生成、TTS/ASR 走独立原生接口，本插件不提供。
- 推理档位按模型族映射到 `reasoning_effort` 或 `thinking_budget`；两者不会同时发送（`qwen4-max-preview` / `qwen3.8-max` 会拒绝同时设置）。
- 控制台数据是只读快照，不修改订阅、不自动续费。

## 开发

```
index.js           Host 入口：provider 注册、状态缓存、HTTP 路由
lib/adapter.js     OpenAI Chat Completions SSE → DSH StreamChunk
lib/catalog.js     模型快照 + 控制台模型合并
lib/console.js     控制台网关客户端（subscription/usage/quota/equity/daily/models/benefits）
lib/guard.js       本机 HTTP 路由准入（Host / Origin / Sec-Fetch-Site）
lib/client.js      Web 半边：设置分页 + 侧边栏入口 + main 页面
locale/*.json      插件元数据（中 / 英）
```

调试时可直接用 `node` 调用 `lib/console.js`（需要控制台 Cookie）验证网关响应；模型线路需要真实 Token Plan Key。

## 许可

MIT。

调试提示：`GET /qwen-token-plan/model-info?id=<model>` 返回宿主解析后的模型元数据（含 reasoning 档位），可用来确认某个模型的推理等级是否按预期暴露。
