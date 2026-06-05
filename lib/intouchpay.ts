import crypto from "node:crypto";
import { env, envNumber } from "@/lib/env";
import { absoluteUrl } from "@/lib/site-url";

type IntouchPayload = Record<string, unknown>;

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

function stripSlashes(value: string) {
  return value.replace(/\/+$/, "");
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

function assertConfig() {
  const config = intouchConfig();
  const missing = [
    ["INTOUCH_USERNAME", config.username],
    ["INTOUCH_ACCOUNT_NO", config.accountNo],
    ["INTOUCH_PARTNER_PASSWORD", config.partnerPassword]
  ].filter(([, value]) => !value);

  if (missing.length) {
    throw new Error(`IntouchPay is not configured. Missing ${missing.map(([name]) => name).join(", ")}.`);
  }

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

function passwordHash(username: string, accountNo: string, partnerPassword: string, timestamp: string) {
  return crypto.createHash("sha256").update(`${username}${accountNo}${partnerPassword}${timestamp}`).digest("hex");
}

function signedFields() {
  const config = assertConfig();
  const timestamp = timestampUtc();

  return {
    username: config.username,
    timestamp,
    accountno: config.accountNo,
    password: passwordHash(config.username, config.accountNo, config.partnerPassword, timestamp)
  };
}

function asString(value: unknown) {
  return String(value ?? "").trim();
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

function normalizeResponse(payload: IntouchPayload, raw: string): IntouchResponse {
  const data = nestedPayload(payload);
  const code = asString(field(data, "responsecode", "code", "statuscode", "statusCode"));
  const message =
    asString(field(data, "message", "status", "statusdesc", "description", "desc")) ||
    (code ? `IntouchPay response ${code}` : "IntouchPay response received.");

  return {
    ok: Boolean(code && (paymentRequestSuccessCodes.has(code) || completedPaymentCodes.has(code) || completedDepositCodes.has(code))),
    code,
    message,
    data,
    raw
  };
}

async function readIntouchResponse(response: Response): Promise<IntouchResponse> {
  const raw = await response.text();
  let payload: IntouchPayload = {};

  try {
    payload = raw ? (JSON.parse(raw) as IntouchPayload) : {};
  } catch {
    payload = { message: raw };
  }

  const normalized = normalizeResponse(payload, raw);

  if (!response.ok && !normalized.code) {
    return {
      ok: false,
      code: String(response.status),
      message: normalized.message || `IntouchPay HTTP ${response.status}`,
      data: normalized.data,
      raw
    };
  }

  return normalized;
}

async function postForm(path: string, fields: Record<string, string>) {
  const config = assertConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields),
      signal: controller.signal
    });

    return readIntouchResponse(response);
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
      signal: controller.signal
    });

    return readIntouchResponse(response);
  } finally {
    clearTimeout(timeout);
  }
}

export function getIntouchCallbackUrl() {
  return env("INTOUCH_CALLBACK_URL") || absoluteUrl(env("INTOUCH_CALLBACK_PATH", "/api/intouchpay/callback"));
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
  return asString(field(data, "responsecode", "code", "statuscode", "statusCode"));
}

export function callbackRequestTransactionId(payload: IntouchPayload) {
  const data = nestedPayload(payload);
  return asString(field(data, "requesttransactionid", "requestTransactionId", "request_transaction_id"));
}

export function callbackProviderTransactionId(payload: IntouchPayload) {
  const data = nestedPayload(payload);
  return asString(field(data, "transactionid", "transactionId", "transaction_id"));
}

export function callbackReferenceNo(payload: IntouchPayload) {
  const data = nestedPayload(payload);
  return asString(field(data, "referenceno", "referenceNo", "referenceid", "referenceId"));
}

export function callbackStatusMessage(payload: IntouchPayload) {
  const data = nestedPayload(payload);
  return asString(field(data, "status", "statusdesc", "message", "description"));
}

export async function requestIntouchPayment(input: IntouchPaymentInput) {
  const mobilePhone = formatRwandaMobilePhone(input.mobilePhone);
  if (!mobilePhone) throw new Error("A valid MTN Mobile Money phone number is required.");

  const requestTransactionId = input.requestTransactionId || createIntouchRequestId("MRC-RCV");
  const fields = {
    ...signedFields(),
    amount: String(Math.round(Number(input.amount))),
    mobilephone: mobilePhone,
    requesttransactionid: requestTransactionId,
    callbackurl: input.callbackUrl || getIntouchCallbackUrl()
  };

  const response = await postForm("/api/requestpayment/", fields);
  return { ...response, requestTransactionId, mobilePhone };
}

export async function requestIntouchDeposit(input: IntouchDepositInput) {
  const mobilePhone = formatRwandaMobilePhone(input.mobilePhone);
  if (!mobilePhone) throw new Error("A valid MTN Mobile Money phone number is required.");

  const requestTransactionId = input.requestTransactionId || createIntouchRequestId("MRC-SND");
  const fields = {
    ...signedFields(),
    amount: String(Math.round(Number(input.amount))),
    withdrawcharge: "1",
    reason: input.reason || "MR Creativist payout",
    sid: "1",
    mobilephone: mobilePhone,
    requesttransactionid: requestTransactionId
  };

  const response = await postForm("/api/requestdeposit/", fields);
  return { ...response, requestTransactionId, mobilePhone };
}

export async function getIntouchTransactionStatus(input: IntouchStatusInput) {
  if (!input.requestTransactionId && !input.transactionId) {
    throw new Error("A request transaction ID or provider transaction ID is required.");
  }

  return postJson("/api/gettransactionstatus/", {
    ...signedFields(),
    requesttransactionid: input.requestTransactionId ?? "",
    transactionid: input.transactionId ?? ""
  });
}

export async function getIntouchBalance() {
  const response = await postForm("/api/getbalance/", signedFields());
  const balance = Number(field(response.data, "balance", "availablebalance", "availableBalance") ?? 0);

  return {
    ...response,
    balance: Number.isFinite(balance) ? balance : 0
  };
}
