/**
 * Admission guard for the plugin's own HTTP routes.
 *
 * `webServer.register({ kind: "prefix" })` routes bypass DSH's Host auth, so the
 * handler must reject requests that did not originate from this machine. The
 * Host header is the one value a DNS-rebinding attacker cannot forge, so it is
 * the primary fence; Origin and Sec-Fetch-Site add browser-side checks.
 */

function hostnameOf(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw === "") return undefined;
  try {
    return new URL(raw.includes("://") ? raw : `http://${raw}`).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function isLoopback(hostname) {
  if (!hostname) return false;
  const bare = hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
  if (bare === "localhost" || bare === "localhost." || bare === "::1") return true;
  const parts = bare.split(".");
  return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

/** Is this request from the local machine (and not a cross-site browser request)? */
export function trustedRequest(req, bindHost) {
  const headers = req?.headers ?? {};
  const hostHeader = typeof headers.host === "string" ? headers.host : "";
  const host = hostnameOf(hostHeader);
  const bind = hostnameOf(bindHost);
  if (!isLoopback(host) && !(bind && host === bind)) return false;

  const site = typeof headers["sec-fetch-site"] === "string" ? headers["sec-fetch-site"].toLowerCase() : "";
  if (site === "cross-site") return false;

  const origin = typeof headers.origin === "string" ? headers.origin.trim() : "";
  if (origin !== "") {
    if (origin.toLowerCase() === "null") return false;
    if (!isLoopback(hostnameOf(origin)) && hostnameOf(origin) !== bind) return false;
    try {
      if (new URL(origin).origin !== new URL(`http://${hostHeader}`).origin) return false;
    } catch {
      return false;
    }
  }
  return true;
}
