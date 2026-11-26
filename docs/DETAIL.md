# 千问 Token Plan

把千问 AI 平台 Token Plan 订阅接入 DSH：提供模型线路，并把套餐余量、每日 Token 用量与 Harness 权益呈现为一个只读控制台。

## 功能

- **模型线路**：OpenAI Chat Completions 端点，支持 `auto`、`qwen4-max`、`qwen3.8-max`、`qwen3.8-flash`、`deepseek-v4.1-flash`、`glm-5.3` 等文本/视觉模型与工具调用。
- **套餐总览**：档位、剩余百分比、剩余 Credits、月额度（含加油包）、5 小时额度、剩余天数、到期与重置时间。
- **每日用量**：总 / 输入 / 输出 / 缓存命中 / 图片 Token，近 7 / 30 / 90 天与每日明细。
- **Harness 权益**：7 项权益剩余量与官方单价的权益目录。
- **推理等级**：按模型族映射 `reasoning_effort` / `thinking_budget` / 开关，模型菜单里直接选档位。
- **模型目录**：默认每 30 分钟从端点 `GET /models` 动态发现，再与控制台授权信息和内置规格合并，并通知模型选择器刷新；标注能力、上下文、最大输出与推理档位。
- **入口**：设置分页与侧边栏图标打开同一个控制台。

## 配置

1. 在控制台的 **设置** 页填入 Token Plan API Key（写入本机 DSH 凭据，即时生效），或设置 `QWEN_TOKEN_PLAN_API_KEY`。
2. 在同一页粘贴 platform.qianwenai.com 的控制台 Cookie（或设置 `BAILIAN_CONSOLE_COOKIE`）以启用套餐与用量数据。

## 限制

- 端点 `GET /models` 只返回模型 id，能力/上下文/推理档位由内置规格与控制台元数据补全。
- 未配置 API Key 时回退到控制台授权列表，该接口单次上限 10 行且忽略翻页。
- 仅支持 Chat Completions 文本/视觉对话与工具调用；图像、视频、语音能力不在本插件范围内。
- 所有控制台数据只读，不会修改订阅。
