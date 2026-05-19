import { NextResponse } from "next/server";

const routes = [
  "",
  "/courses",
  "/marketplace",
  "/consulting",
  "/freelancers",
  "/blog",
  "/instructors",
  "/sellers",
  "/affiliate",
  "/pricing",
  "/about",
  "/contact",
  "/faq",
  "/terms",
  "/privacy",
  "/refund-policy",
  "/help-center",
  "/search"
];

export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === "" ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/xml"
    }
  });
}
