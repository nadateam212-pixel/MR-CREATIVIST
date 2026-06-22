import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";

const DEFAULT_CPANEL_URLS = [
  "https://myhosting.zubahost.com:2083/execute/Fileman/upload_files",
  "https://194.163.174.55:2083/execute/Fileman/upload_files",
  "https://cpanel.mrcreativist.ca:2083/execute/Fileman/upload_files",
  "http://myhosting.zubahost.com:2082/execute/Fileman/upload_files",
  "http://194.163.174.55:2082/execute/Fileman/upload_files",
  "http://cpanel.mrcreativist.ca:2082/execute/Fileman/upload_files"
];
const PROXY_FILE_NAME = "intouch-proxy.php";
const CLEAN_PROXY_DIR = "intouch-pay";
const CLEAN_PROXY_FILE_NAME = "index.php";
const HTACCESS_FILE_NAME = ".htaccess";
const CPANEL_FETCH_ATTEMPTS = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanEnvValue(value = "") {
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function cleanProxySecret(value = "") {
  return cleanEnvValue(value).replace(
    /^(?:INTOUCH_PROXY_SECRET|PROXY_SECRET)\s*=\s*/i,
    ""
  ).trim();
}

function splitList(value = "") {
  return String(value)
    .split(/[\n,]+/)
    .map((item) => cleanEnvValue(item))
    .filter(Boolean);
}

async function readDotEnv() {
  const content = await readFile(".env", "utf8");
  const values = new Map();

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=(.*)$/);
    if (!match) continue;
    values.set(match[1], cleanEnvValue(match[2]));
  }

  return values;
}

function phpString(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

function requireValue(name, value) {
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function saveUrlForUploadUrl(cpanelUrl) {
  return cpanelUrl.replace(
    /\/execute\/Fileman\/upload_files(?:\?.*)?$/i,
    "/execute/Fileman/save_file_content"
  );
}

function api2UrlForUploadUrl(cpanelUrl) {
  const url = new URL(cpanelUrl);
  url.pathname = "/json-api/cpanel";
  url.search = "";
  return String(url);
}

async function fetchWithRetry(url, options) {
  let lastError;

  for (let attempt = 1; attempt <= CPANEL_FETCH_ATTEMPTS; attempt += 1) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      const detail = error?.cause?.code || error?.message || "request failed";
      console.warn(
        `cPanel request failed (${attempt}/${CPANEL_FETCH_ATTEMPTS}) ${url}: ${detail}`
      );
      if (attempt < CPANEL_FETCH_ATTEMPTS) await sleep(5000 * attempt);
    }
  }

  throw lastError;
}

function buildHtaccess() {
  return `<IfModule LiteSpeed>
RewriteEngine On
RewriteRule .* - [E=verifycaptcha:off]
</IfModule>

<IfModule mod_headers.c>
Header always set Cache-Control "no-store"
Header always set X-Robots-Tag "noindex, nofollow"
</IfModule>
`;
}

function buildProxy({ username, accountNo, partnerPassword, proxySecret }) {
  return `<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const INTOUCH_BASE_URL = 'https://www.intouchpay.co.rw';
const INTOUCH_USERNAME = '${phpString(username)}';
const INTOUCH_ACCOUNT_NO = '${phpString(accountNo)}';
const INTOUCH_PARTNER_PASSWORD = '${phpString(partnerPassword)}';
const PROXY_SECRET = '${phpString(proxySecret)}';
const REQUEST_TIMEOUT_SECONDS = 25;

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function read_input(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $json = json_decode($raw, true);

    if (is_array($json)) {
        return $json;
    }

    return $_POST ?: [];
}

function utc_timestamp(): string
{
    return gmdate('YmdHis');
}

function signed_fields(): array
{
    $timestamp = utc_timestamp();

    return [
        'username' => INTOUCH_USERNAME,
        'timestamp' => $timestamp,
        'accountno' => INTOUCH_ACCOUNT_NO,
        'password' => hash('sha256', INTOUCH_USERNAME . INTOUCH_ACCOUNT_NO . INTOUCH_PARTNER_PASSWORD . $timestamp),
    ];
}

function normalize_phone(string $value): string
{
    $digits = preg_replace('/\\D+/', '', $value) ?: '';

    if (strlen($digits) === 12 && str_starts_with($digits, '250')) {
        return $digits;
    }

    if (strlen($digits) === 10 && str_starts_with($digits, '0')) {
        return '25' . $digits;
    }

    if (strlen($digits) === 9 && str_starts_with($digits, '7')) {
        return '250' . $digits;
    }

    return $digits;
}

function required_string(array $input, array $keys): string
{
    foreach ($keys as $key) {
        if (array_key_exists($key, $input) && trim((string) $input[$key]) !== '') {
            return trim((string) $input[$key]);
        }
    }

    return '';
}

function intouch_call(string $path, array $fields, bool $json = false): array
{
    $ch = curl_init(INTOUCH_BASE_URL . $path);
    $body = $json ? json_encode($fields, JSON_UNESCAPED_SLASHES) : http_build_query($fields);
    $headers = [$json ? 'Content-Type: application/json' : 'Content-Type: application/x-www-form-urlencoded'];

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => REQUEST_TIMEOUT_SECONDS,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => $body,
    ]);

    $raw = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpStatus = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($raw === false) {
        return [
            'success' => false,
            'responsecode' => 'proxy-curl',
            'message' => 'Proxy could not reach IntouchPay.',
            'detail' => $curlError,
            'proxy_http_status' => 502,
        ];
    }

    $rawString = (string) $raw;
    if (preg_match('/<!doctype html|<html[\s>]|<body[\s>]|<script[\s>]|<form[\s>]/i', $rawString)) {
        $isBotVerification = preg_match('/bot verification|lsrecaptcha|recaptcha|captcha|imunify|verify you are human/i', $rawString) === 1;
        return [
            'success' => false,
            'responsecode' => $isBotVerification ? 'proxy-bot-verification' : 'proxy-html',
            'message' => $isBotVerification
                ? 'The IntouchPay upstream request returned a bot verification page instead of JSON.'
                : 'The IntouchPay upstream request returned HTML instead of JSON.',
            'detail' => trim(preg_replace('/\s+/', ' ', strip_tags($rawString))),
            'proxy_http_status' => $httpStatus,
        ];
    }

    $decoded = json_decode($rawString, true);
    $payload = is_array($decoded) ? $decoded : ['message' => $rawString];
    $payload['proxy_http_status'] = $httpStatus;

    if ($httpStatus >= 400 && !isset($payload['responsecode'])) {
        $payload['responsecode'] = (string) $httpStatus;
    }

    return $payload;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    respond(200, [
        'success' => true,
        'message' => 'MR Creativist IntouchPay proxy is ready.',
        'server_ip_hint' => $_SERVER['SERVER_ADDR'] ?? null,
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['success' => false, 'message' => 'Method not allowed.']);
}

$providedSecret = $_SERVER['HTTP_X_INTOUCH_PROXY_SECRET'] ?? '';
if ($providedSecret === '' || !hash_equals(PROXY_SECRET, $providedSecret)) {
    respond(401, ['success' => false, 'message' => 'Unauthorized proxy request.']);
}

$input = read_input();
$action = strtolower(required_string($input, ['action']));

if ($action === 'ping') {
    respond(200, [
        'success' => true,
        'message' => 'MR Creativist IntouchPay proxy is ready.',
        'server_ip_hint' => $_SERVER['SERVER_ADDR'] ?? null,
        'php_version' => PHP_VERSION,
    ]);
}

if ($action === 'getbalance') {
    respond(200, intouch_call('/api/getbalance/', signed_fields()));
}

if ($action === 'gettransactionstatus') {
    $requestTransactionId = required_string($input, ['requestTransactionId', 'requesttransactionid', 'request_transaction_id']);
    $transactionId = required_string($input, ['transactionId', 'transactionid', 'transaction_id']);
    if ($requestTransactionId === '' && $transactionId === '') {
        respond(400, ['success' => false, 'message' => 'A transaction reference is required.']);
    }

    respond(200, intouch_call('/api/gettransactionstatus/', signed_fields() + [
        'requesttransactionid' => $requestTransactionId,
        'transactionid' => $transactionId,
    ], true));
}

if ($action === 'requestpayment' || $action === 'requestdeposit') {
    $amount = (int) round((float) required_string($input, ['amount']));
    $mobilePhone = normalize_phone(required_string($input, ['mobilePhone', 'mobilephone', 'mtnNumber', 'phone']));
    $requestTransactionId = required_string($input, ['requestTransactionId', 'requesttransactionid', 'request_transaction_id']);

    if ($amount <= 0) {
        respond(400, ['success' => false, 'message' => 'Amount must be greater than zero.']);
    }

    if ($mobilePhone === '') {
        respond(400, ['success' => false, 'message' => 'MTN number is required.']);
    }

    if ($requestTransactionId === '') {
        respond(400, ['success' => false, 'message' => 'Request transaction ID is required.']);
    }

    if ($action === 'requestpayment') {
        $callbackUrl = required_string($input, ['callbackUrl', 'callbackurl', 'callback_url']);
        respond(200, intouch_call('/api/requestpayment/', signed_fields() + [
            'amount' => (string) $amount,
            'mobilephone' => $mobilePhone,
            'requesttransactionid' => $requestTransactionId,
            'callbackurl' => $callbackUrl,
        ]));
    }

    $reason = required_string($input, ['reason']) ?: 'MR Creativist payout';
    respond(200, intouch_call('/api/requestdeposit/', signed_fields() + [
        'amount' => (string) $amount,
        'withdrawcharge' => required_string($input, ['withdrawcharge']) ?: '1',
        'reason' => $reason,
        'sid' => required_string($input, ['sid']) ?: '1',
        'mobilephone' => $mobilePhone,
        'requesttransactionid' => $requestTransactionId,
    ]));
}

respond(400, ['success' => false, 'message' => 'Unknown proxy action.']);
`;
}

async function saveFileContent({ cpanelUrl, auth, dir, file, content, signal }) {
  const form = new URLSearchParams();
  form.set("dir", dir);
  form.set("file", file);
  form.set("from_charset", "UTF-8");
  form.set("to_charset", "UTF-8");
  form.set("content", content);

  const response = await fetchWithRetry(saveUrlForUploadUrl(cpanelUrl), {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form,
    signal
  });
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(
      `cPanel save returned non-JSON response: ${text.slice(0, 200)}`
    );
  }

  if (!response.ok || payload.status !== 1) {
    throw new Error(
      `cPanel save failed for ${dir}/${file}: ${JSON.stringify(payload).slice(0, 500)}`
    );
  }

  return payload;
}

async function createDirectory({ cpanelUrl, cpanelUser, auth, path, name, signal }) {
  const form = new URLSearchParams();
  form.set("cpanel_jsonapi_user", cpanelUser);
  form.set("cpanel_jsonapi_apiversion", "2");
  form.set("cpanel_jsonapi_module", "Fileman");
  form.set("cpanel_jsonapi_func", "mkdir");
  form.set("path", path);
  form.set("name", name);
  form.set("permissions", "0755");

  const response = await fetchWithRetry(api2UrlForUploadUrl(cpanelUrl), {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form,
    signal
  });
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(
      `cPanel mkdir returned non-JSON response: ${text.slice(0, 200)}`
    );
  }

  const serialized = JSON.stringify(payload);
  const result =
    payload?.cpanelresult?.event?.result ??
    payload?.result?.status ??
    payload?.status;

  if (!response.ok || (result !== 1 && !/already exists|file exists/i.test(serialized))) {
    throw new Error(
      `cPanel mkdir failed for ${path}/${name}: ${serialized.slice(0, 500)}`
    );
  }

  return payload;
}

async function deployProxyFiles({ cpanelUrl, cpanelUser, auth, php, signal }) {
  await createDirectory({
    cpanelUrl,
    cpanelUser,
    auth,
    path: "public_html",
    name: CLEAN_PROXY_DIR,
    signal
  });

  await Promise.all([
    saveFileContent({
      cpanelUrl,
      auth,
      dir: "public_html",
      file: PROXY_FILE_NAME,
      content: php,
      signal
    }),
    saveFileContent({
      cpanelUrl,
      auth,
      dir: `public_html/${CLEAN_PROXY_DIR}`,
      file: CLEAN_PROXY_FILE_NAME,
      content: php,
      signal
    }),
    saveFileContent({
      cpanelUrl,
      auth,
      dir: `public_html/${CLEAN_PROXY_DIR}`,
      file: HTACCESS_FILE_NAME,
      content: buildHtaccess(),
      signal
    })
  ]);
}

async function main() {
  const env = await readDotEnv();
  const cpanelUser = requireValue("CPANEL_USER", process.env.CPANEL_USER);
  const cpanelPassword = requireValue(
    "CPANEL_PASSWORD",
    process.env.CPANEL_PASSWORD
  );
  const proxySecret = cleanProxySecret(
    await readFile(".intouch-proxy-secret.local", "utf8")
  );

  const php = buildProxy({
    username: requireValue("INTOUCH_USERNAME", env.get("INTOUCH_USERNAME")),
    accountNo: requireValue(
      "INTOUCH_ACCOUNT_NO",
      env.get("INTOUCH_ACCOUNT_NO")
    ),
    partnerPassword: requireValue(
      "INTOUCH_PARTNER_PASSWORD",
      env.get("INTOUCH_PARTNER_PASSWORD")
    ),
    proxySecret: requireValue("INTOUCH_PROXY_SECRET", proxySecret)
  });

  const auth = Buffer.from(`${cpanelUser}:${cpanelPassword}`, "utf8").toString(
    "base64"
  );
  const cpanelUrls = [
    ...splitList(process.env.CPANEL_URLS),
    cleanEnvValue(process.env.CPANEL_URL),
    ...DEFAULT_CPANEL_URLS
  ].filter(Boolean);
  const uniqueCpanelUrls = Array.from(new Set(cpanelUrls));
  let lastError;

  for (const cpanelUrl of uniqueCpanelUrls) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    try {
      console.log(`Trying cPanel endpoint: ${cpanelUrl}`);
      await deployProxyFiles({
        cpanelUrl,
        cpanelUser,
        auth,
        php,
        signal: controller.signal
      });
      clearTimeout(timeout);
      console.log(`Deployed ${PROXY_FILE_NAME} and ${CLEAN_PROXY_DIR}/${CLEAN_PROXY_FILE_NAME}.`);
      return;
    } catch (error) {
      lastError = error;
      console.warn(`cPanel endpoint failed: ${error?.message || error}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("No cPanel endpoint succeeded.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
