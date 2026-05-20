import { NextResponse } from "next/server";
import { getBlogPosts, getConsultingServices, getCourses, getProducts, slugify } from "@/lib/platform-db";
import { getSiteUrl } from "@/lib/site-url";

const routes = [
  "",
  "/courses",
  "/business-directory",
  "/jobs",
  "/ai-tools",
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

type SitemapRecord = {
  slug?: string;
  category?: string;
};

export const revalidate = 3600;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function urlNode(baseUrl: string, route: string, priority = route === "" ? "1.0" : "0.8", changefreq = "weekly") {
  return `  <url>
    <loc>${escapeXml(`${baseUrl}${route}`)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export async function GET() {
  const baseUrl = getSiteUrl();
  const [courses, products, posts, consultants] = await Promise.all([
    getCourses({ limit: 200 }),
    getProducts({ limit: 200 }),
    getBlogPosts({ limit: 200 }),
    getConsultingServices({ limit: 200 })
  ]);
  const courseCategoryRoutes = Array.from(
    new Set(courses.map((course: SitemapRecord) => course.category).filter((category: unknown): category is string => Boolean(category)))
  )
    .map((category) => `/courses/categories/${slugify(category)}`);
  const productCategoryRoutes = Array.from(
    new Set(products.map((product: SitemapRecord) => product.category).filter((category: unknown): category is string => Boolean(category)))
  )
    .map((category) => `/marketplace/categories/${slugify(category)}`);
  const dynamicRoutes = [
    ...courses
      .filter((course: SitemapRecord) => Boolean(course.slug))
      .map((course: SitemapRecord) => `/courses/${course.slug}`),
    ...courseCategoryRoutes,
    ...products
      .filter((product: SitemapRecord) => Boolean(product.slug))
      .map((product: SitemapRecord) => `/marketplace/product/${product.slug}`),
    ...productCategoryRoutes,
    ...posts
      .filter((post: SitemapRecord) => Boolean(post.slug))
      .map((post: SitemapRecord) => `/blog/${post.slug}`),
    ...consultants
      .filter((consultant: SitemapRecord) => Boolean(consultant.slug))
      .map((consultant: SitemapRecord) => `/consulting/${consultant.slug}`)
  ].filter(Boolean);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...routes, ...dynamicRoutes].map((route) => urlNode(baseUrl, route)).join("\n")}
</urlset>`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/xml"
    }
  });
}
