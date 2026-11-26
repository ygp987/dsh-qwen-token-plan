/**
 * HTTP and in-stream failure classification for the Qianwen Token Plan route.
 *
 * The codes must match DSH's LLM failure vocabulary: the retry policy only
 * retries the codes it knows (`RATE_LIMIT`, `SERVER`, `TIMEOUT`, `TRANSPORT`,
 * `EMPTY_RESPONSE`). Returning a generic provider error for a rate limit made a
 * transient 429 end the turn instead of backing off.
 */

/** Classify a non-2xx HTTP response. */
export function httpFailureCode(status, text) {
  const lower = String(text ?? "").toLowerCase();
  if (status === 401 || status === 403) return "AUTH";
  if (/insufficient_quota|quota exceeded|余额不足|额度耗尽|套餐.*用尽/.test(lower)) return "QUOTA";
  if (status === 429) return "RATE_LIMIT";
  if (status === 408) return "TIMEOUT";
  if (status >= 500) return "SERVER";
  if (/context.*(length|window)|maximum context|上下文.*超|超出.*token/.test(lower)) return "CONTEXT_WINDOW_EXCEEDED";
  return "PROVIDER_ERROR";
}

/**
 * Classify an error delivered inside an SSE stream (HTTP 200, error payload).
 * The structured code is checked before free-text messages because providers
 * sometimes put "quota exceeded, slow down" in a rate-limit message.
 */
export function streamFailureCode(payload) {
  const code = String(payload?.code ?? payload?.type ?? "").toLowerCase();
  const message = String(payload?.message ?? "").toLowerCase();
  const text = `${code} ${message}`;

  if (/^(insufficient_quota|quota_exceeded|quota_exhausted|billing_.*)$/.test(code)) return "QUOTA";
  if (/rate.?limit|too_many_requests|throttl/.test(code)) return "RATE_LIMIT";
  if (/^(request_timeout|timeout|timed_out|deadline_exceeded)$/.test(code)) return "TIMEOUT";
  if (/^(server_error|internal_error|internal_server_error|upstream_error|bad_gateway|service_unavailable|overloaded|model_unavailable)$/.test(code)) return "SERVER";

  if (/quota|余额不足|额度耗尽/.test(text)) return "QUOTA";
  if (/context.*(length|window)|maximum context|上下文.*超|超出.*token/.test(text)) return "CONTEXT_WINDOW_EXCEEDED";
  if (/rate.?limit|too many|throttl|限流/.test(message)) return "RATE_LIMIT";
  if (/timeout|timed.?out|超时/.test(message)) return "TIMEOUT";
  if (/server|internal|upstream|overload|unavailable|系统繁忙/.test(message)) return "SERVER";
  if (/invalid.?api.?key|unauthorized|permission/.test(message)) return "AUTH";
  return "PROVIDER_ERROR";
}
