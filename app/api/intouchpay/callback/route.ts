import { applyIntouchCallback } from "@/lib/platform-ledger";

async function readCallbackPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return request.json();
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const payload = Object.fromEntries(formData.entries());
    const wrapped = payload.jsonpayload;

    if (typeof wrapped === "string") {
      try {
        return { ...payload, jsonpayload: JSON.parse(wrapped) };
      } catch {
        return payload;
      }
    }

    return payload;
  }

  const text = await request.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function POST(request: Request) {
  const payload = await readCallbackPayload(request);

  try {
    const transaction = await applyIntouchCallback(payload);

    return Response.json({
      message: "success",
      success: true,
      request_id: transaction.requestTransactionId ?? transaction.referenceId
    });
  } catch (error) {
    console.error("[intouchpay:callback] Failed to apply callback", error);

    return Response.json({
      message: "success",
      success: true,
      request_id: payload?.jsonpayload?.requesttransactionid ?? payload?.requesttransactionid ?? null
    });
  }
}

export async function GET() {
  return Response.json({ status: "ready", provider: "intouchpay", timestamp: new Date().toISOString() });
}
