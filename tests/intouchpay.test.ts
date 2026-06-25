import { afterEach, describe, expect, it, vi } from "vitest";
import {
  requestIntouchDeposit,
  requestIntouchPayment
} from "@/lib/intouchpay";

const originalEnv = { ...process.env };

function configureIntouchEnv(overrides: Record<string, string> = {}) {
  process.env.INTOUCH_USERNAME = "test-user";
  process.env.INTOUCH_ACCOUNT_NO = "250260008842";
  process.env.INTOUCH_PARTNER_PASSWORD = "test-password";
  process.env.INTOUCH_BASE_URL = "https://www.intouchpay.co.rw";
  process.env.INTOUCH_TIMEOUT_MS = "20000";
  process.env.INTOUCH_ALLOW_DIRECT_FALLBACK = "false";

  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }
}

function jsonResponse(payload: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  );
}

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe("IntouchPay request payloads", () => {
  it("sends mobilephoneno to the cPanel proxy for customer payment requests", async () => {
    configureIntouchEnv({
      INTOUCH_USE_PROXY: "true",
      INTOUCH_PROXY_URL: "https://proxy.example.test/intouch-pay/index.php",
      INTOUCH_PROXY_SECRET: "secret"
    });

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() =>
        jsonResponse({ success: true, responsecode: "1000" })
      );

    await requestIntouchPayment({
      amount: 500,
      mobilePhone: "0788819111",
      requestTransactionId: "MRC-RCV-TEST",
      callbackUrl: "https://mrcreativist.ca/api/intouchpay/callback"
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({
      action: "requestpayment",
      amount: "500",
      mobilephoneno: "250788819111",
      requesttransactionid: "MRC-RCV-TEST",
      callbackurl: "https://mrcreativist.ca/api/intouchpay/callback"
    });
    expect(body).not.toHaveProperty("mobilephone");
  });

  it("tries the sibling cPanel proxy file when the configured endpoint is blocked", async () => {
    configureIntouchEnv({
      INTOUCH_USE_PROXY: "true",
      INTOUCH_PROXY_URL:
        "https://myhosting.zubahost.com/~mrcreati/intouch-pay/index.php",
      INTOUCH_PROXY_SECRET: "secret"
    });

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(() =>
        Promise.resolve(
          new Response("<html><body>Bot verification</body></html>", {
            status: 200,
            headers: { "Content-Type": "text/html" }
          })
        )
      )
      .mockImplementationOnce(() =>
        jsonResponse({ success: true, responsecode: "1000" })
      );

    await requestIntouchPayment({
      amount: 500,
      mobilePhone: "0788819111",
      requestTransactionId: "MRC-RCV-TEST",
      callbackUrl: "https://mrcreativist.ca/api/intouchpay/callback"
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://myhosting.zubahost.com/~mrcreati/intouch-pay/index.php"
    );
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
      "https://myhosting.zubahost.com/~mrcreati/intouch-proxy.php"
    );
  });

  it("uses the configured cPanel host header for ZubaHost proxy calls", async () => {
    configureIntouchEnv({
      INTOUCH_USE_PROXY: "true",
      INTOUCH_PROXY_URL:
        "https://myhosting.zubahost.com/~mrcreati/intouch-pay/index.php",
      INTOUCH_PROXY_HOST: "mrcreativist.ca",
      INTOUCH_PROXY_SECRET: "secret"
    });

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() =>
        jsonResponse({ success: true, responsecode: "1000" })
      );

    await requestIntouchPayment({
      amount: 500,
      mobilePhone: "0788819111",
      requestTransactionId: "MRC-RCV-TEST",
      callbackUrl: "https://mrcreativist.ca/api/intouchpay/callback"
    });

    expect(
      (fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>).Host
    ).toBe("mrcreativist.ca");
  });

  it("sends mobilephoneno directly to IntouchPay when no proxy is configured", async () => {
    configureIntouchEnv({ INTOUCH_USE_PROXY: "false" });

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() =>
        jsonResponse({ success: true, responsecode: "2001" })
      );

    await requestIntouchDeposit({
      amount: 1000,
      mobilePhone: "0788819111",
      requestTransactionId: "MRC-SND-TEST",
      reason: "MR Creativist payout"
    });

    const body = fetchMock.mock.calls[0]?.[1]?.body;
    expect(body).toBeInstanceOf(URLSearchParams);
    const params = body as URLSearchParams;
    expect(params.get("mobilephoneno")).toBe("250788819111");
    expect(params.has("mobilephone")).toBe(false);
    expect(params.get("requesttransactionid")).toBe("MRC-SND-TEST");
  });
});
