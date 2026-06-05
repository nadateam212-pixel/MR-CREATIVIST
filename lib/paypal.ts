import { env } from "@/lib/env";
import { absoluteUrl } from "@/lib/site-url";

type PayPalLink = {
  href: string;
  rel: string;
  method?: string;
};

type PayPalOrderResponse = {
  id: string;
  status: string;
  links?: PayPalLink[];
};

function paypalMode() {
  return env("PAYPAL_MODE", "sandbox").toLowerCase() === "live" ? "live" : "sandbox";
}

function paypalBaseUrl() {
  return paypalMode() === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function paypalCredentials() {
  const mode = paypalMode();
  const clientId = mode === "live" ? env("PAYPAL_LIVE_CLIENT_ID") : env("PAYPAL_SANDBOX_CLIENT_ID");
  const clientSecret = mode === "live" ? env("PAYPAL_LIVE_CLIENT_SECRET") : env("PAYPAL_SANDBOX_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("PayPal is not configured. Add PayPal client ID and secret.");
  }

  return { clientId, clientSecret };
}

function amountString(value: number) {
  return Math.max(0, Number(value ?? 0)).toFixed(2);
}

export function paypalCurrency() {
  return env("PAYPAL_CURRENCY", "USD").toUpperCase();
}

export async function createPayPalOrder(input: {
  amount: number;
  description: string;
  referenceId: string;
  returnPath?: string;
  cancelPath?: string;
}) {
  const token = await getPayPalAccessToken();
  const currency = paypalCurrency();
  const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.referenceId,
          description: input.description.slice(0, 120),
          amount: {
            currency_code: currency,
            value: amountString(input.amount)
          }
        }
      ],
      application_context: {
        brand_name: "MR Creativist",
        landing_page: "LOGIN",
        user_action: "PAY_NOW",
        return_url: absoluteUrl(input.returnPath ?? `/api/payments/paypal?reference=${encodeURIComponent(input.referenceId)}`),
        cancel_url: absoluteUrl(input.cancelPath ?? "/marketplace/cart?paypal=cancelled")
      }
    })
  });
  const payload = (await response.json()) as PayPalOrderResponse & { message?: string };

  if (!response.ok) {
    throw new Error(payload.message || "PayPal order creation failed.");
  }

  return {
    ...payload,
    approvalUrl: payload.links?.find((link) => link.rel === "approve")?.href ?? "",
    currency
  };
}

export async function capturePayPalOrder(orderId: string) {
  if (!orderId) throw new Error("PayPal order ID is required.");

  const token = await getPayPalAccessToken();
  const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  const payload = (await response.json()) as PayPalOrderResponse & { message?: string };

  if (!response.ok) {
    throw new Error(payload.message || "PayPal capture failed.");
  }

  return payload;
}

async function getPayPalAccessToken() {
  const { clientId, clientSecret } = paypalCredentials();
  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ grant_type: "client_credentials" })
  });
  const payload = (await response.json()) as { access_token?: string; error_description?: string };

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || "PayPal authentication failed.");
  }

  return payload.access_token;
}
