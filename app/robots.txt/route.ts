import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";

export function GET() {
  const baseUrl = getSiteUrl();
  const host = new URL(baseUrl).host;
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /dashboard/",
    "Disallow: /seller/",
    "Disallow: /instructor/",
    "Disallow: /consultant/",
    "Disallow: /freelancer/",
    "Disallow: /profile/",
    "Disallow: /messages/",
    "Disallow: /notifications/",
    "Disallow: /settings/",
    "Disallow: /api/",
    `Host: ${host}`,
    `Sitemap: ${baseUrl}/sitemap.xml`,
    ""
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain"
    }
  });
}
