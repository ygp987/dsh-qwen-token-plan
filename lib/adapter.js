/**
 * OpenAI Chat Completions adapter for the Qianwen Token Plan endpoint.
 *
 * The official Qianwen DSH guide configures this subscription as
 * `api: openai-completions` with base URL
 * `https://token-plan.maas.qianwenaiapi.com/compatible-mode/v1`. This adapter
 * implements the same wire protocol directly so the plugin can own the model
 * catalogue, request shaping and diagnostics.
 */
import { LlmAdapter, LlmError } from "@deepseek-ai/dsh-llm";
import { EFFORT_NAMES, reasoningParamsFor } from "./reasoning.js";
import { httpFailureCode, streamFailureCode } from "./failures.js";

const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

function sanitize(text) {
  return String(text ?? "").replace(LONE_SURROGATE, "\uFFFD");
}

const MESSAGES_400 = "（没有输出）";

/** Yield one JSON object per SSE event. */
async function* iterateSse(body, signal) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      if (signal?.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      if (buffer.length > 32 * 1024 * 1024) {
        throw new LlmError("Qianwen Token Plan 单个 SSE 事件超过 32MB", "STREAM_CLOSED");
      }
      while (true) {
        const match = /\r?\n\r?\n/.exec(buffer);
        if (!match) break;
        const raw = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);
        const data = raw
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).replace(/^\s/, ""))
          .join("\n");
        if (data === "") continue;
        if (data === "[DONE]") return;
        try {
          yield JSON.parse(data);
        } catch {
          // A provider heartbeat that is not JSON must not kill the reply.
        }
      }
    }
    const tail = buffer
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).replace(/^\s/, ""))
      .join("\n");
    if (tail !== "" && tail !== "[DONE]") {
      try {
        yield JSON.parse(tail);
      } catch {
        // ignore
      }
    }
  } finally {
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

function usageOf(raw) {
  const prompt = Number.isFinite(raw?.prompt_tokens) ? raw.prompt_tokens : 0;
  const cached = Number.isFinite(raw?.prompt_tokens_details?.cached_tokens)
    ? raw.prompt_tokens_details.cached_tokens
    : Number.isFinite(raw?.prompt_cache_hit_tokens)
      ? raw.prompt_cache_hit_tokens
      : 0;
  const output = Number.isFinite(raw?.completion_tokens) ? raw.completion_tokens : 0;
  const reasoning = raw?.completion_tokens_details?.reasoning_tokens;
  return {
    inputTokens: Math.max(0, prompt - cached),
    outputTokens: output,
    ...(cached > 0 ? { cacheReadTokens: cached } : {}),
    ...(Number.isFinite(reasoning) && reasoning > 0 ? { reasoningTokens: reasoning } : {}),
  };
}

function finishOf(reason) {
  if (reason === "stop") return { kind: "stop" };
  if (reason === "tool_calls" || reason === "function_call") return { kind: "tool-calls" };
  if (reason === "length") return { kind: "max-tokens" };
  return {
    kind: "error",
    failure: { message: `Qianwen Token Plan 异常结束：${reason || "unknown"}`, code: String(reason || "UNKNOWN").toUpperCase() },
  };
}

function textOf(blocks) {
  return (Array.isArray(blocks) ? blocks : [])
    .filter((block) => block?.type === "text" || block?.type === "reasoning")
    .map((block) => sanitize(block.text))
    .join("");
}

export class QwenTokenPlanAdapter extends LlmAdapter {
  #catalog;
  #fetch;
  #resolveApiKey;
  #attachments;
  #baseURL;
  #displayName;
  #providerId;
  #defaultMaxTokens;
  #requestTimeoutMs;

  constructor({ providerId, displayName, baseURL, catalog, resolveApiKey, attachments, fetchImpl = globalThis.fetch, defaultMaxTokens = 32_768, requestTimeoutMs = 120_000 }) {
    super();
    this.#providerId = providerId;
    this.#displayName = displayName;
    this.#baseURL = baseURL.replace(/\/+$/, "");
    this.#catalog = catalog;
    this.#resolveApiKey = resolveApiKey;
    this.#attachments = attachments;
    this.#fetch = fetchImpl;
    this.#defaultMaxTokens = defaultMaxTokens;
    this.#requestTimeoutMs = requestTimeoutMs;
  }

  get providerId() {
    return this.#providerId;
  }

  get baseURL() {
    return this.#baseURL;
  }

  providerInfo(provider) {
    return { id: provider, name: this.#displayName };
  }

  async listModels() {
    return this.#catalog.snapshot().map((model) => ({
      provider: this.#providerId,
      id: model.id,
      name: model.name || model.id,
      description: descriptionOf(model),
      inputModalities: model.input ?? ["text"],
    }));
  }

  async resolveModel(provider, modelId) {
    const model = this.#catalog.find(modelId);
    if (!model) {
      return {
        provider,
        id: modelId,
        name: modelId,
        description: "不在千问 Token Plan 目录中；请求仍会发出，但目录元数据未知",
        inputModalities: ["text"],
      };
    }
    const reasoning = model.reasoning
      ? {
        efforts: model.reasoning.efforts.map((id) => ({ id, name: EFFORT_NAMES[id] ?? id })),
        ...(model.reasoning.defaultEffort ? { defaultEffort: model.reasoning.defaultEffort } : {}),
      }
      : undefined;
    return {
      provider,
      id: model.id,
      name: model.name || model.id,
      description: descriptionOf(model),
      inputModalities: model.input ?? ["text"],
      context: { contextWindow: model.contextWindow },
      defaultMaxTokens: Math.min(model.maxTokens || this.#defaultMaxTokens, this.#defaultMaxTokens),
      ...(reasoning ? { reasoning } : {}),
    };
  }

  #toolDeclarations(tools) {
    return (Array.isArray(tools) ? tools : [])
      .filter((tool) => typeof tool?.name === "string" && tool.name !== "")
      .map((tool) => ({
        type: "function",
        function: {
          name: tool.name,
          description: sanitize(tool.description),
          parameters: objectSchema(tool.parameters),
        },
      }));
  }

  async #imagePart(block, signal) {
    const attachments = this.#attachments;
    if (!attachments || typeof attachments.readImage !== "function") {
      throw new LlmError("图片输入需要 DSH 附件服务", "UNSUPPORTED_CONTENT");
    }
    const stored = await attachments.readImage(block.attachment, signal);
    const mediaType = stored?.ref?.mediaType ?? block.attachment?.mediaType ?? "image/png";
    const bytes = stored?.data;
    const base64 = typeof Buffer !== "undefined"
      ? Buffer.from(bytes).toString("base64")
      : btoa(String.fromCharCode(...new Uint8Array(bytes)));
    return { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}` } };
  }

  async #userContent(blocks, model, signal) {
    const parts = [];
    for (const block of Array.isArray(blocks) ? blocks : []) {
      if (block?.type === "text" || block?.type === "reasoning") {
        parts.push({ type: "text", text: sanitize(block.text) });
      } else if (block?.type === "image") {
        if (!(model.input ?? []).includes("image")) {
          throw new LlmError(`模型 ${model.id} 不支持图片输入`, "UNSUPPORTED_CONTENT");
        }
        parts.push(await this.#imagePart(block, signal));
      } else if (block?.type === "tool-result") {
        parts.push({ type: "text", text: textOf(block.content) || MESSAGES_400 });
      } else if (block?.type === "file") {
        parts.push({ type: "text", text: `[file: ${block.attachment?.name ?? "attachment"} (${block.attachment?.bytes ?? 0} bytes)]` });
      }
    }
    if (parts.every((part) => part.type === "text")) {
      return parts.map((part) => part.text).join("");
    }
    return parts;
  }

  async #messages(options, model) {
    const messages = [];
    if (options.system) messages.push({ role: "system", content: sanitize(options.system) });
    for (const message of Array.isArray(options.messages) ? options.messages : []) {
      if (message.role === "system" || message.role === "developer") {
        messages.push({ role: "system", content: textOf(message.content) });
        continue;
      }
      if (message.role === "assistant") {
        const text = (message.content ?? []).filter((block) => block.type === "text").map((block) => sanitize(block.text)).join("");
        const calls = (message.content ?? []).filter((block) => block.type === "tool-call").map((block) => ({
          id: String(block.id),
          type: "function",
          function: { name: block.name, arguments: sanitize(block.arguments || "{}") },
        }));
        messages.push({
          role: "assistant",
          content: text,
          ...(calls.length > 0 ? { tool_calls: calls } : {}),
        });
        continue;
      }
      if (message.role === "tool") {
        messages.push({
          role: "tool",
          tool_call_id: String(message.toolCallId),
          content: textOf(message.content) || (message.isError ? "（工具执行失败，没有输出）" : MESSAGES_400),
        });
        continue;
      }
      const content = await this.#userContent(message.content, model, options.signal);
      if (content !== "") messages.push({ role: "user", content });
    }
    return messages;
  }

  async *stream(options) {
    const model = this.#catalog.find(options.model) ?? {
      id: options.model,
      input: ["text"],
      maxTokens: this.#defaultMaxTokens,
      contextWindow: 262_144,
    };
    const apiKey = await this.#resolveApiKey();
    const tools = this.#toolDeclarations(options.tools);
    const maxTokens = Math.max(1, Math.min(
      Number.isFinite(options.maxTokens) ? options.maxTokens : model.maxTokens || this.#defaultMaxTokens,
      model.maxTokens || this.#defaultMaxTokens,
    ));
    const body = {
      model: model.id,
      messages: await this.#messages(options, model),
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: maxTokens,
      ...reasoningParamsFor(model, options.reasoningEffort),
      ...(tools.length > 0 ? { tools, tool_choice: "auto" } : {}),
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      ...(Array.isArray(options.stop) && options.stop.length > 0 ? { stop: options.stop } : {}),
    };

    const timeout = AbortSignal.timeout(this.#requestTimeoutMs);
    const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
    let response;
    try {
      response = await this.#fetch(`${this.#baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
          accept: "text/event-stream",
        },
        body: JSON.stringify(body),
        signal,
      });
    } catch (error) {
      if (options.signal?.aborted) {
        throw new LlmError("请求已取消", "ABORTED", { cause: error });
      }
      if (timeout.aborted) {
        throw new LlmError(`千问 Token Plan 请求超时（${this.#requestTimeoutMs}ms）`, "TIMEOUT", { cause: error });
      }
      throw new LlmError(`千问 Token Plan 网络错误：${error instanceof Error ? error.message : String(error)}`, "TRANSPORT", { cause: error });
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new LlmError(
        `千问 Token Plan HTTP ${response.status}${text ? `：${text.slice(0, 600)}` : ""}`,
        httpFailureCode(response.status, text),
        { status: response.status },
      );
    }
    if (!response.body) {
      throw new LlmError("千问 Token Plan 没有返回响应流", "PROVIDER_ERROR", { status: response.status });
    }

    let nextIndex = 0;
    let textBlock;
    let reasoningBlock;
    let finish;
    let usage;
    const toolBlocks = new Map();
    const order = [];
    const open = (kind, extra = {}) => {
      const block = { kind, index: nextIndex++, text: "", ...extra };
      order.push(block);
      return block;
    };

    try {
      for await (const event of iterateSse(response.body, signal)) {
        if (event?.error) {
          throw new LlmError(
            `千问 Token Plan 流错误：${event.error.message ?? event.error.code ?? "unknown"}`,
            streamFailureCode(event.error),
          );
        }
        for (const choice of Array.isArray(event?.choices) ? event.choices : []) {
          const delta = choice?.delta ?? {};
          if (typeof delta.reasoning_content === "string" && delta.reasoning_content !== "") {
            if (!reasoningBlock) {
              reasoningBlock = open("reasoning");
              yield { type: "block-start", index: reasoningBlock.index, blockType: "reasoning" };
            }
            reasoningBlock.text += delta.reasoning_content;
            yield { type: "reasoning-delta", index: reasoningBlock.index, text: delta.reasoning_content };
          }
          if (typeof delta.content === "string" && delta.content !== "") {
            if (!textBlock) {
              textBlock = open("text");
              yield { type: "block-start", index: textBlock.index, blockType: "text" };
            }
            textBlock.text += delta.content;
            yield { type: "text-delta", index: textBlock.index, text: delta.content };
          }
          for (const call of Array.isArray(delta.tool_calls) ? delta.tool_calls : []) {
            const wireIndex = Number.isInteger(call?.index) ? call.index : toolBlocks.size;
            let block = toolBlocks.get(wireIndex);
            if (!block) {
              block = open("tool-call", { wireIndex, id: "", name: "" });
              toolBlocks.set(wireIndex, block);
              yield { type: "block-start", index: block.index, blockType: "tool-call" };
            }
            if (call?.id !== undefined) block.id = String(call.id);
            if (call?.function?.name !== undefined) block.name = String(call.function.name);
            const fragment = typeof call?.function?.arguments === "string" ? call.function.arguments : "";
            block.text += fragment;
            if (fragment !== "" || call?.id !== undefined || call?.function?.name !== undefined) {
              yield {
                type: "tool-call-delta",
                index: block.index,
                id: block.id || `call_${wireIndex}`,
                ...(block.name ? { name: block.name } : {}),
                argumentsDelta: fragment,
              };
            }
          }
          if (typeof choice?.finish_reason === "string") finish = finishOf(choice.finish_reason);
        }
        if (event?.usage) usage = usageOf(event.usage);
      }
    } catch (error) {
      if (error instanceof LlmError) throw error;
      if (options.signal?.aborted) throw new LlmError("请求已取消", "ABORTED", { cause: error });
      if (timeout.aborted) throw new LlmError(`千问 Token Plan 请求超时（${this.#requestTimeoutMs}ms）`, "TIMEOUT", { cause: error });
      throw new LlmError(`千问 Token Plan 流中断：${error instanceof Error ? error.message : String(error)}`, "TRANSPORT", { cause: error });
    }

    if (options.signal?.aborted) throw new LlmError("请求已取消", "ABORTED");
    if (!finish) throw new LlmError("千问 Token Plan 在 finish_reason 前关闭了流", "STREAM_CLOSED");

    for (const block of order) {
      if (block.kind === "text") yield { type: "block-end", index: block.index, block: { type: "text", text: block.text } };
      else if (block.kind === "reasoning") yield { type: "block-end", index: block.index, block: { type: "reasoning", text: block.text } };
      else {
        yield {
          type: "block-end",
          index: block.index,
          block: { type: "tool-call", id: block.id || `call_${block.wireIndex}`, name: block.name || "", arguments: block.text || "{}" },
        };
      }
    }
    if (usage) yield { type: "usage", usage };
    if (finish.kind === "stop" && order.length === 0) {
      yield {
        type: "finish",
        reason: { kind: "error", failure: { message: "千问 Token Plan 返回空回复", code: "EMPTY_RESPONSE" } },
      };
      return;
    }
    yield { type: "finish", reason: finish };
  }
}

function objectSchema(parameters) {
  return parameters && typeof parameters === "object" ? parameters : { type: "object", properties: {} };
}

function descriptionOf(model) {
  const caps = Array.isArray(model.capabilities) ? model.capabilities : [];
  const labels = { TG: "文本生成", VU: "视觉理解", Reasoning: "推理" };
  const text = caps.map((cap) => labels[cap] ?? cap).join("、");
  return text === "" ? "千问 Token Plan" : `千问 Token Plan · ${text}`;
}
