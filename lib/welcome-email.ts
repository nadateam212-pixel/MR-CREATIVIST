import { brand } from "@/lib/brand";
import { escapeHtml, sendEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site-url";

function welcomeBody(name: string) {
  const dashboardUrl = absoluteUrl("/dashboard");
  const coursesUrl = absoluteUrl("/courses");
  const marketplaceUrl = absoluteUrl("/marketplace");
  const supportUrl = absoluteUrl("/support");
  const logoUrl = absoluteUrl(brand.logo);
  const safeName = escapeHtml(name || "there");
  const phoneLine = brand.phones.join(" / ");
  const socialLinks = Object.entries(brand.socials)
    .map(
      ([label, href]) =>
        `<a href="${href}" style="color:#1d5bd8;font-weight:700;text-decoration:none">${escapeHtml(label)}</a>`
    )
    .join(" &nbsp; ");

  return {
    text: `Hi ${name}, welcome to ${brand.name}. Your learning, marketplace, consulting, wallet, certificates, jobs, business tools, and AI workspace is ready: ${dashboardUrl}. Support: ${brand.email}. Phone: ${phoneLine}.`,
    html: `
      <div style="margin:0;background:#f3f7fc;padding:28px 0;font-family:Arial,Helvetica,sans-serif;color:#101827">
        <div style="margin:0 auto;max-width:640px;background:#ffffff;border:1px solid #dbe7f5;border-radius:16px;overflow:hidden">
          <div style="background:#0f4fd0;padding:28px 32px;color:#ffffff">
            <img src="${logoUrl}" width="64" height="64" alt="${escapeHtml(brand.name)}" style="display:block;border-radius:14px;background:#ffffff;padding:5px;margin-bottom:18px" />
            <div style="font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#cfe0ff">Your creator workspace is ready</div>
            <h1 style="margin:10px 0 0;font-size:30px;line-height:1.2;color:#ffffff">Welcome to ${escapeHtml(brand.name)}, ${safeName}</h1>
          </div>
          <div style="padding:30px 32px">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.75;color:#334155">Your account is ready for learning, selling, consulting, wallet activity, certificates, business listings, jobs, and MrCreativist.AI tools.</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#475569">Start with your dashboard, then explore courses and marketplace products built for creators, learners, freelancers, sellers, and consultants.</p>
            <div style="margin:0 0 26px">
              <a href="${dashboardUrl}" style="display:inline-block;background:#1d5bd8;color:#ffffff;padding:13px 18px;border-radius:8px;font-weight:800;text-decoration:none;margin:0 10px 10px 0">Open dashboard</a>
              <a href="${coursesUrl}" style="display:inline-block;background:#ecf4ff;color:#1047aa;padding:13px 18px;border-radius:8px;font-weight:800;text-decoration:none;margin:0 10px 10px 0">Browse courses</a>
              <a href="${marketplaceUrl}" style="display:inline-block;background:#ecfdf5;color:#047857;padding:13px 18px;border-radius:8px;font-weight:800;text-decoration:none;margin:0 0 10px 0">Visit marketplace</a>
            </div>
            <div style="border:1px solid #dbe7f5;border-radius:12px;padding:18px;background:#f8fbff">
              <p style="margin:0 0 8px;font-size:14px;font-weight:800;color:#101827">Need help?</p>
              <p style="margin:0;font-size:14px;line-height:1.7;color:#475569">Email <a href="mailto:${brand.email}" style="color:#1d5bd8;font-weight:700;text-decoration:none">${brand.email}</a>, call ${escapeHtml(phoneLine)}, or open the support center.</p>
              <p style="margin:14px 0 0"><a href="${supportUrl}" style="color:#1d5bd8;font-weight:800;text-decoration:none">Open support</a></p>
            </div>
          </div>
          <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e5edf8;font-size:12px;line-height:1.8;color:#64748b">
            <strong style="color:#101827">${escapeHtml(brand.name)}</strong><br />
            ${escapeHtml(brand.address)}<br />
            ${escapeHtml(brand.email)} · ${escapeHtml(phoneLine)}
            <div style="margin-top:12px">${socialLinks}</div>
          </div>
        </div>
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
