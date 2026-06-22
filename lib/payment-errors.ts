const paymentInfrastructurePatterns = [
  /IntouchPay proxy endpoints failed/i,
  /bot verification/i,
  /verifycaptcha|lsrecaptcha|recaptcha|captcha/i,
  /proxy could not be reached/i,
  /proxy timed out/i,
  /proxy-network|proxy-timeout|proxy-html|proxy-bot-verification/i,
  /server IP .*whitelist|IP .*Not Allowed/i
];

export function publicPaymentErrorMessage(
  error: unknown,
  fallback = "Payment could not be processed."
) {
  const message =
    error instanceof Error ? error.message : String(error ?? "").trim();

  if (!message) return fallback;

  if (paymentInfrastructurePatterns.some((pattern) => pattern.test(message))) {
    return "MTN MoMo is temporarily unavailable while the provider connection is being restored. Choose PayPal or Wallet, or try again later.";
  }

  return message.length > 260 ? fallback : message;
}
