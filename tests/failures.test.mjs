import test from "node:test";
import assert from "node:assert/strict";

import { httpFailureCode, streamFailureCode } from "../lib/failures.js";

test("HTTP failures map to DSH retryable codes", () => {
  assert.equal(httpFailureCode(401, "unauthorized"), "AUTH");
  assert.equal(httpFailureCode(403, "forbidden"), "AUTH");
  assert.equal(httpFailureCode(429, "slow down"), "RATE_LIMIT");
  assert.equal(httpFailureCode(408, "timeout"), "TIMEOUT");
  assert.equal(httpFailureCode(500, "boom"), "SERVER");
  assert.equal(httpFailureCode(503, "overloaded"), "SERVER");
  assert.equal(httpFailureCode(400, "maximum context length exceeded"), "CONTEXT_WINDOW_EXCEEDED");
  assert.equal(httpFailureCode(400, "余额不足"), "QUOTA");
  assert.equal(httpFailureCode(422, "invalid parameter"), "PROVIDER_ERROR");
});

test("in-stream errors prefer the structured code", () => {
  assert.equal(streamFailureCode({ code: "rate_limit_exceeded", message: "quota exceeded, slow down" }), "RATE_LIMIT");
  assert.equal(streamFailureCode({ code: "insufficient_quota" }), "QUOTA");
  assert.equal(streamFailureCode({ code: "server_error", message: "upstream" }), "SERVER");
  assert.equal(streamFailureCode({ type: "request_timeout" }), "TIMEOUT");
  assert.equal(streamFailureCode({ message: "上下文超长" }), "CONTEXT_WINDOW_EXCEEDED");
  assert.equal(streamFailureCode({ message: "invalid api key" }), "AUTH");
  assert.equal(streamFailureCode({ message: "something odd" }), "PROVIDER_ERROR");
  assert.equal(streamFailureCode(undefined), "PROVIDER_ERROR");
});
