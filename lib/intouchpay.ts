import crypto from "node:crypto";
import { env, envBoolean, envNumber } from "@/lib/env";
import { absoluteUrl } from "@/lib/site-url";

type IntouchPayload = Record<string, unknown>;

type ProxyAttempt = {
  url: string;
  host?: string;
  status?: number;
  ok: boolean;
  code: string;
  message: string;
  elapsedMs: number;
};

export type IntouchResponse = {
  ok: boolean;
  code: string;
  message: string;
  data: IntouchPayload;
  raw: string;
};

export type IntouchPaymentInput = {
  amount: number;
  mobilePhone: string;
  requestTransactionId?: string;
  callbackUrl?: string;
};

export type IntouchDepositInput = {
  amount: number;
  mobilePhone: string;
  reason?: string;
  requestTransactionId?: string;
};

export type IntouchStatusInput = {
  requestTransactionId?: string;
  transactionId?: string;
};

const paymentRequestSuccessCodes = new Set(["1000"]);
const completedPaymentCodes = new Set(["01"]);
const completedDepositCodes = new Set(["2001"]);
const successfulResponseCodes = new Set([
  ...paymentRequestSuccessCodes,
  ...completedPaymentCodes,
  ...completedDepositCodes
]);

const responseCodeDescriptions: Record<string, string> = {
  "01": "Transaction successful.",
  "1000": "Transaction pending. Waiting for subscriber approval.",
  "2001": "Deposit request successful.",
  "0002": "Missing username information.",
  "0003": "Missing password information.",
  "0004": "Missing date information.",
  "0005": "Invalid IntouchPay password.",
  "0006": "User does not have an IntouchPay account.",
  "0007": "No such IntouchPay user.",
  "0008": "Failed to authenticate with IntouchPay.",
  "1002": "Mobile number is not registered on mobile money.",
  "1005": "Failed due to insufficient funds.",
  "1008": "General failure from IntouchPay.",
  "1100": "Number is not supported on this Mobile Money network.",
  "1101": "Service ID not recognized.",
  "1102": "Invalid mobile phone number.",
  "1103": "Payment above allowed maximum.",
  "1104": "Payment below allowed minimum.",
  "1105": "Network not supported.",
  "1106": "Operation not permitted.",
  "1107": "Payment account not configured.",
  "1108": "Insufficient IntouchPay account balance.",
  "1110": "Duplicate remit ID.",
  "1200": "Invalid number.",
  "1300": "Failed to complete transaction.",
  "2000": "General failure from IntouchPay.",
  "2003": "Transaction not allowed.",
  "2100": "Amount should be greater than zero.",
  "2102": "Subscriber could not be identified.",
  "2105": "Non-existent mobile account.",
  "2106": "Own mobile account provided.",
  "2107": "Invalid amount format.",
  "2108": "Insufficient funds on source account.",
  "2109": "Daily limit exceeded.",
  "2110": "Source account is not active.",
  "2111": "Mobile account is not active.",
  "2200": "Amount below minimum.",
  "2300": "Amount above maximum.",
  "2400": "Duplicate transaction ID.",
  "2500": "IntouchPay service failure.",
  "2510": "Service temporarily unavailable.",
  "2518": "Could not perform operation.",
  "2520": "Incorrect account password.",
  "2522": "Invalid amount.",
  "2525": "Resource is not active.",
  "2600": "Network failure or request timed out.",
  "2700": "Failed to complete transaction.",
  "2800": "Deposit channel failure.",
  "3000": "Missing transaction ID information.",
  "3100": "Transaction does not exist.",
  "3200": "Missing request transaction ID information.",
  "403": "IntouchPay rejected this server IP address."
};

const htmlResponseMessage =
  "IntouchPay returned an HTML page instead of JSON. Check the IntouchPay proxy URL, hosting bot protection, credentials, or server IP allowlist.";
const proxyBotVerificationMessage =
  "The IntouchPay proxy URL is blocked by the hosting bot verification page before PHP runs. Disable bot protection for intouch-proxy.php or move the proxy to a clean JSON endpoint.";

function looksLikeHtmlResponse(value: string) {
  return /<!doctype html|<html[\s>]|<body[\s>]|<script[\s>]|<form[\s>]/i.test(
    value
  );
}

function looksLikeBotVerification(value: string) {
  return /bot verification|lsrecaptcha|recaptcha|captcha|imunify|verify you are human/i.test(
    value
  );
}

function stripSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

function splitEnvList(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => stripSlashes(item.trim()))
    .filter(Boolean);
}

function cleanProxySecret(value: string) {
  return value
    .replace(/^(?:INTOUCH_PROXY_SECRET|PROXY_SECRET)\s*=\s*/i, "")
    .trim();
}

function intouchBaseUrl() {
  return stripSlashes(env("INTOUCH_BASE_URL", "https://www.intouchpay.co.rw"));
}

function intouchConfig() {
  return {
    baseUrl: intouchBaseUrl(),
    username: env("INTOUCH_USERNAME"),
    accountNo: env("INTOUCH_ACCOUNT_NO"),
    partnerPassword: env("INTOUCH_PARTNER_PASSWORD"),
    timeoutMs: envNumber("INTOUCH_TIMEOUT_MS", 20_000)
  };
}

function intouchProxyConfig() {
  const rawSecret = env("INTOUCH_PROXY_SECRET");
  const primaryUrl = stripSlashes(env("INTOUCH_PROXY_URL"));
  const urls = [
    ...splitEnvList(env("INTOUCH_PROXY_URLS")),
    ...(primaryUrl ? [primaryUrl] : [])
  ];

  return {
    enabled: envBoolean("INTOUCH_USE_PROXY", false),
    urls: Array.from(new Set(urls)),
    host: env("INTOUCH_PROXY_HOST"),
    secret: cleanProxySecret(rawSecret),
    rawSecret
  };
}

function assertConfig() {
  const config = intouchConfig();
  const missing = [
    ["INTOUCH_USERNAME", config.username],
    ["INTOUCH_ACCOUNT_NO", config.accountNo],
    ["INTOUCH_PARTNER_PASSWORD", config.partnerPassword]
  ].filter(([, value]) => !value);

  if (missing.length) {
    throw new Error(
      `IntouchPay is not configured. Missing ${missing.map(([name]) => name).join(", ")}.`
    );
  }

  return config;
}

function assertProxyConfig() {
  const config = intouchProxyConfig();

  if (!config.enabled) return null;
  if (!config.urls.length)
    throw new Error(
      "INTOUCH_PROXY_URL or INTOUCH_PROXY_URLS is required when INTOUCH_USE_PROXY=true."
    );
  if (!config.secret)
    throw new Error(
      "INTOUCH_PROXY_SECRET is required when INTOUCH_USE_PROXY=true."
    );

  return config;
}

function timestampUtc(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds())
  ].join("");
}

function passwordHash(
  username: string,
  accountNo: string,
  partnerPassword: string,
  timestamp: string
) {
  return crypto
    .createHash("sha256")
    .update(`${username}${accountNo}${partnerPassword}${timestamp}`)
    .digest("hex");
}

function signedFields() {
  const config = assertConfig();
  const timestamp = timestampUtc();

  return {
    username: config.username,
    timestamp,
    accountno: config.accountNo,
    password: passwordHash(
      config.username,
      config.accountNo,
      config.partnerPassword,
      timestamp
    )
  };
}

function asString(value: unknown) {
  return String(value ?? "").trim();
}

function safeProviderDetail(value: unknown) {
  const detail = asString(value);
  return looksLikeHtmlResponse(detail) ? htmlResponseMessage : detail;
}

function transportFailure(
  transport: "direct" | "proxy",
  error: unknown,
  timeoutMs: number
): IntouchResponse {
  const timedOut = error instanceof Error && error.name === "AbortError";
  const detail = error instanceof Error ? error.message : "Network request failed.";

  return {
    ok: false,
    code: timedOut ? `${transport}-timeout` : `${transport}-network`,
    message: timedOut
      ? `IntouchPay ${transport === "proxy" ? "proxy" : "request"} timed out after ${timeoutMs} ms.`
      : `IntouchPay ${transport === "proxy" ? "proxy" : "request"} could not be reached. ${detail}`,
    data: { transport },
    raw: ""
  };
}

function isRetryableProxyFailure(response: IntouchResponse) {
  if (response.ok) return false;
  if (/unauthorized proxy request/i.test(response.message)) return false;

  const code = response.code.toLowerCase();
  const transport = asString(field(response.data, "transport")).toLowerCase();

  return (
    transport === "proxy" ||
    code.startsWith("proxy-") ||
    code === "html" ||
    /proxy URL|bot verification|html page instead of json/i.test(
      response.message
    )
  );
}

function shouldTryDirectAfterProxyFailure(response: IntouchResponse) {
  return (
    envBoolean("INTOUCH_ALLOW_DIRECT_FALLBACK", false) &&
    isRetryableProxyFailure(response)
  );
}

function truthy(value: unknown) {
  if (value === true) return true;
  const normalized = asString(value).toLowerCase();
  return [
    "true",
    "1",
    "yes",
    "ok",
    "success",
    "successful",
    "successfull"
  ].includes(normalized);
}

function field(payload: IntouchPayload, ...keys: string[]) {
  for (const key of keys) {
    const direct = payload[key];
    if (typeof direct !== "undefined" && direct !== null) return direct;
  }

  return undefined;
}

function nestedPayload(payload: IntouchPayload): IntouchPayload {
  const wrapped = payload.jsonpayload;
  return wrapped && typeof wrapped === "object" && !Array.isArray(wrapped)
    ? (wrapped as IntouchPayload)
    : payload;
}

function normalizeResponse(
  payload: IntouchPayload,
  raw: string
): IntouchResponse {
  const data = nestedPayload(payload);
  const code = asString(
    field(data, "responsecode", "code", "statuscode", "statusCode")
  );
  const detail = safeProviderDetail(
    field(
      data,
      "message",
      "detail",
      "error",
      "error_description",
      "statusdesc",
      "description",
      "desc",
      "status"
    )
  );
  const message =
    detail ||
    (code && responseCodeDescriptions[code]) ||
    (code ? `IntouchPay response ${code}` : "IntouchPay response received.");

  return {
    ok:
      truthy(field(data, "success")) ||
      Boolean(code && successfulResponseCodes.has(code)) ||
      (Number(field(data, "proxy_http_status")) === 200 &&
        field(data, "balance", "availablebalance", "availableBalance") !==
          undefined),
    code,
    message,
    data,
    raw
  };
}

async function readIntouchResponse(
  response: Response
): Promise<IntouchResponse> {
  const raw = await response.text();
  let payload: IntouchPayload = {};

  try {
    payload = raw ? (JSON.parse(raw) as IntouchPayload) : {};
  } catch {
    if (looksLikeHtmlResponse(raw)) {
      const code = response.ok ? "html" : String(response.status);
      return {
        ok: false,
        code,
        message: explainIntouchFailure(raw, code),
        data: {},
        raw
      };
    }

    payload = { message: raw };
  }

  const normalized = normalizeResponse(payload, raw);

  if (!response.ok && !normalized.code) {
    const code = String(response.status);
    return {
      ok: false,
      code,
      message: explainIntouchFailure(normalized.message, code),
      data: normalized.data,
      raw
    };
  }

  return {
    ...normalized,
    message: explainIntouchFailure(normalized.message, normalized.code)
  };
}

function explainIntouchFailure(message: string, code?: string) {
  const fallback = (code && responseCodeDescriptions[code]) || message;
  const ipMatch = message.match(
    /IP\s+([0-9a-f:.]+)\s+is\s+Not\s+Allowed\s+to\s+Perform\s+this\s+Operation/i
  );

  if (looksLikeBotVerification(message)) {
    return proxyBotVerificationMessage;
  }

  if (ipMatch) {
    return `IntouchPay rejected server IP ${ipMatch[1]}. Ask IntouchPay to whitelist this IP for the MR Creativist account, or deploy from an already-approved server.`;
  }

  if (looksLikeHtmlResponse(message)) {
    return (code && responseCodeDescriptions[code]) || htmlResponseMessage;
  }

  return fallback || "IntouchPay response received.";
}

async function postForm(path: string, fields: Record<string, string>) {
  const config = assertConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "MR-Creativist-Intouch/1.0"
      },
      body: new URLSearchParams(fields),
      signal: controller.signal
    });

    return readIntouchResponse(response);
  } catch (error) {
    return transportFailure("direct", error, config.timeoutMs);
  } finally {
    clearTimeout(timeout);
  }
}

async function postJson(path: string, fields: Record<string, string>) {
  const config = assertConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
        "Content-Type": "application/json",
        "User-Agent": "MR-Creativist-Intouch/1.0"
      },
      body: JSON.stringify(fields),
      signal: controller.signal
    });

    return readIntouchResponse(response);
  } catch (error) {
    return transportFailure("direct", error, config.timeoutMs);
  } finally {
    clearTimeout(timeout);
  }
}

function mergeProxyFailure(
  previous: IntouchResponse | null,
  current: IntouchResponse
) {
  if (!previous) return current;
  if (previous.ok) return previous;
  if (current.ok) return current;
  if (/unauthorized proxy request/i.test(current.message)) return current;

  return previous;
}

function shouldAttachProxyHost(url: string, host: string) {
  if (!host) return false;

  try {
    const hostname = new URL(url).hostname;
    return /^[\d.]+$/.test(hostname) || hostname.includes(":");
  } catch {
    return false;
  }
}

function proxyUrlLabel(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return url;
  }
}

function summarizeProxyAttempts(attempts: ProxyAttempt[]) {
  if (!attempts.length) return "";

  return attempts
    .map((attempt) => {
      const status = attempt.status ? `HTTP ${attempt.status}` : attempt.code;
      return `${attempt.url}: ${status} ${attempt.message}`;
    })
    .join(" | ")
    .slice(0, 900);
}

function withProxyAttempts(
  response: IntouchResponse,
  attempts: ProxyAttempt[]
): IntouchResponse {
  if (!attempts.length) return response;

  const data: IntouchPayload = {
    ...response.data,
    proxy_attempts: attempts
  };

  if (response.ok || !isRetryableProxyFailure(response)) {
    return { ...response, data };
  }

  const summary = summarizeProxyAttempts(attempts);

  return {
    ...response,
    data,
    message: summary
      ? `IntouchPay proxy endpoints failed. ${summary}`
      : response.message
  };
}

async function postProxy(action: string, fields: Record<string, string>) {
  const config = assertProxyConfig();
  if (!config) return null;
  const timeoutMs = envNumber(
    "INTOUCH_PROXY_TIMEOUT_MS",
    envNumber("INTOUCH_TIMEOUT_MS", 20_000)
  );
  const attempts: ProxyAttempt[] = [];

  try {
    const secrets = Array.from(
      new Set([config.secret, config.rawSecret].filter(Boolean))
    );
    let lastFailure: IntouchResponse | null = null;

    for (const url of config.urls) {
      for (const secret of secrets) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const startedAt = Date.now();
        const host = shouldAttachProxyHost(url, config.host)
          ? config.host
          : "";

        try {
          const headers: Record<string, string> = {
            Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
            "User-Agent":
              env("INTOUCH_PROXY_USER_AGENT") ||
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            "X-Requested-With": "XMLHttpRequest",
            "x-intouch-proxy-secret": secret
          };

          if (host) {
            headers.Host = host;
          }

          const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({ action, ...fields }),
            signal: controller.signal
          });
          const parsed = await readIntouchResponse(response);
          attempts.push({
            url: proxyUrlLabel(url),
            host: host || undefined,
            status: response.status,
            ok: parsed.ok,
            code: parsed.code || String(response.status),
            message: parsed.message,
            elapsedMs: Date.now() - startedAt
          });

          if (
            response.status !== 401 &&
            !/unauthorized proxy request/i.test(parsed.message)
          ) {
            if (parsed.ok || !isRetryableProxyFailure(parsed)) {
              return withProxyAttempts(parsed, attempts);
            }

            lastFailure = mergeProxyFailure(lastFailure, parsed);
            break;
          }

          lastFailure = parsed;
        } catch (error) {
          const failure = transportFailure("proxy", error, timeoutMs);
          attempts.push({
            url: proxyUrlLabel(url),
            host: host || undefined,
            ok: false,
            code: failure.code,
            message: failure.message,
            elapsedMs: Date.now() - startedAt
          });
          lastFailure = mergeProxyFailure(
            lastFailure,
            failure
          );
          break;
        } finally {
          clearTimeout(timeout);
        }
      }
    }

    return lastFailure ? withProxyAttempts(lastFailure, attempts) : null;
  } catch (error) {
    return withProxyAttempts(transportFailure("proxy", error, timeoutMs), attempts);
  }
}

export function getIntouchCallbackUrl() {
  return (
    env("INTOUCH_CALLBACK_URL") ||
    absoluteUrl(env("INTOUCH_CALLBACK_PATH", "/api/intouchpay/callback"))
  );
}

export function createIntouchRequestId(prefix = "MRC") {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${stamp}-${random}`;
}

export function formatRwandaMobilePhone(value: string) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("250") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `25${digits}`;
  if (digits.startsWith("7") && digits.length === 9) return `250${digits}`;

  return digits;
}

export function isPaymentRequestAccepted(response: IntouchResponse) {
  return paymentRequestSuccessCodes.has(response.code);
}

export function isPaymentCompleted(response: IntouchResponse) {
  return completedPaymentCodes.has(response.code);
}

export function isDepositCompleted(response: IntouchResponse) {
  return completedDepositCodes.has(response.code);
}

export function callbackCode(payload: IntouchPayload) {
  const data = nestedPayload(payload);
  return asString(
    field(data, "responsecode", "code", "statuscode", "statusCode")
  );
}

export function callbackRequestTransactionId(payload: IntouchPayload) {
  const data = nestedPayload(payload);
  return asString(
    field(
      data,
      "requesttransactionid",
      "requestTransactionId",
      "request_transaction_id"
    )
  );
}

export function callbackProviderTransactionId(payload: IntouchPayload) {
  const data = nestedPayload(payload);
  return asString(
    field(data, "transactionid", "transactionId", "transaction_id")
  );
}

export function callbackReferenceNo(payload: IntouchPayload) {
  const data = nestedPayload(payload);
  return asString(
    field(data, "referenceno", "referenceNo", "referenceid", "referenceId")
  );
}

export function callbackStatusMessage(payload: IntouchPayload) {
  const data = nestedPayload(payload);
  return asString(
    field(data, "status", "statusdesc", "message", "description")
  );
}

export async function requestIntouchPayment(input: IntouchPaymentInput) {
  const mobilePhone = formatRwandaMobilePhone(input.mobilePhone);
  if (!mobilePhone)
    throw new Error("A valid MTN Mobile Money phone number is required.");

  const requestTransactionId =
    input.requestTransactionId || createIntouchRequestId("MRC-RCV");
  const proxyFields = {
    amount: String(Math.round(Number(input.amount))),
    mobilephone: mobilePhone,
    requesttransactionid: requestTransactionId,
    callbackurl: input.callbackUrl || getIntouchCallbackUrl()
  };
  const proxyResponse = await postProxy("requestpayment", proxyFields);
  if (proxyResponse && !shouldTryDirectAfterProxyFailure(proxyResponse))
    return { ...proxyResponse, requestTransactionId, mobilePhone };

  const response = await postForm("/api/requestpayment/", {
    ...signedFields(),
    ...proxyFields
  });
  return { ...response, requestTransactionId, mobilePhone };
}

export async function requestIntouchDeposit(input: IntouchDepositInput) {
  const mobilePhone = formatRwandaMobilePhone(input.mobilePhone);
  if (!mobilePhone)
    throw new Error("A valid MTN Mobile Money phone number is required.");

  const requestTransactionId =
    input.requestTransactionId || createIntouchRequestId("MRC-SND");
  const proxyFields = {
    amount: String(Math.round(Number(input.amount))),
    withdrawcharge: "1",
    reason: input.reason || "MR Creativist payout",
    sid: "1",
    mobilephone: mobilePhone,
    requesttransactionid: requestTransactionId
  };
  const proxyResponse = await postProxy("requestdeposit", proxyFields);
  if (proxyResponse && !shouldTryDirectAfterProxyFailure(proxyResponse))
    return { ...proxyResponse, requestTransactionId, mobilePhone };

  const response = await postForm("/api/requestdeposit/", {
    ...signedFields(),
    ...proxyFields
  });
  return { ...response, requestTransactionId, mobilePhone };
}

export async function getIntouchTransactionStatus(input: IntouchStatusInput) {
  if (!input.requestTransactionId && !input.transactionId) {
    throw new Error(
      "A request transaction ID or provider transaction ID is required."
    );
  }

  const proxyFields = {
    requesttransactionid: input.requestTransactionId ?? "",
    transactionid: input.transactionId ?? ""
  };
  const proxyResponse = await postProxy("gettransactionstatus", proxyFields);
  if (proxyResponse && !shouldTryDirectAfterProxyFailure(proxyResponse))
    return proxyResponse;

  return postJson("/api/gettransactionstatus/", {
    ...signedFields(),
    ...proxyFields
  });
}

export async function getIntouchBalance() {
  const proxyResponse = await postProxy("getbalance", {});
  if (proxyResponse && !shouldTryDirectAfterProxyFailure(proxyResponse)) {
    const balance = Number(
      field(
        proxyResponse.data,
        "balance",
        "availablebalance",
        "availableBalance"
      ) ?? 0
    );

    return {
      ...proxyResponse,
      balance: Number.isFinite(balance) ? balance : 0
    };
  }

  const fields = signedFields();
  const response = await postForm("/api/getbalance/", fields);
  const balance = Number(
    field(response.data, "balance", "availablebalance", "availableBalance") ?? 0
  );

  return {
    ...response,
    balance: Number.isFinite(balance) ? balance : 0
  };
}
