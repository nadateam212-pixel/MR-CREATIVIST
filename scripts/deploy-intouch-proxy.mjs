import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";

const CPANEL_URL =
  "https://www.mrcreativist.ca:2083/execute/Fileman/upload_files";
const PROXY_FILE_NAME = "intouch-proxy.php";

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

    $decoded = json_decode((string) $raw, true);
    $payload = is_array($decoded) ? $decoded : ['message' => (string) $raw];
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

async function main() {
  const env = await readDotEnv();
  const cpanelUser = requireValue("CPANEL_USER", process.env.CPANEL_USER);
  const cpanelPassword = requireValue(
    "CPANEL_PASSWORD",
    process.env.CPANEL_PASSWORD
  );
  const proxySecret = cleanEnvValue(
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

  const form = new FormData();
  form.set("dir", "public_html");
  form.set(
    "file-1",
    new Blob([php], { type: "application/x-httpd-php" }),
    PROXY_FILE_NAME
  );

  const auth = Buffer.from(`${cpanelUser}:${cpanelPassword}`, "utf8").toString(
    "base64"
  );
  const response = await fetch(CPANEL_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}` },
    body: form
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(
      `cPanel upload returned non-JSON response: ${text.slice(0, 200)}`
    );
  }

  if (!response.ok || payload.status !== 1) {
    throw new Error(
      `cPanel upload failed: ${JSON.stringify(payload).slice(0, 500)}`
    );
  }

  console.log(`Uploaded ${PROXY_FILE_NAME} to public_html.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
