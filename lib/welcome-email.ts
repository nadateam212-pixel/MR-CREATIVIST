import { brand } from "@/lib/brand";
import { sendEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site-url";

function welcomeBody(name: string) {
  const dashboardUrl = absoluteUrl("/dashboard");

  return {
    text: `Hi ${name}, welcome to ${brand.name}. Your learning, marketplace, consulting, and wallet workspace is ready: ${dashboardUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin:0 0 12px">Welcome to ${brand.name}</h2>
        <p>Hi ${name}, your learning, marketplace, consulting, and wallet workspace is ready.</p>
        <p><a href="${dashboardUrl}" style="display:inline-block;background:#2ec4a6;color:#06111f;padding:12px 18px;border-radius:6px;font-weight:700;text-decoration:none">Open dashboard</a></p>
        <p>You can now verify your email, manage your wallet, browse courses, buy products, and receive account notifications from ${brand.name}.</p>
      </div>
    `
  };
}

export async function sendWelcomeEmail(email: string, name = "there") {
  try {
    const body = welcomeBody(name);

    return await sendEmail({
      to: email,
      subject: `Welcome to ${brand.name}`,
      text: body.text,
      html: body.html
    });
  } catch (error) {
    console.error("[welcome-email] Failed to send welcome email", error);
    return { ok: false, provider: "none" as const, message: "Welcome email failed." };
  }
}
