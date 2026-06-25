import { revalidatePath } from "next/cache";
import { clearPublicQueryCache } from "@/lib/platform-db";

type PublicContentKind = "course" | "product" | "gig" | "shop" | "job" | "consulting" | "blog";

const PUBLIC_PATHS: Record<PublicContentKind, string[]> = {
  course: ["/", "/courses"],
  product: ["/", "/marketplace"],
  gig: ["/", "/freelancers"],
  shop: ["/", "/business-directory"],
  job: ["/", "/jobs"],
  consulting: ["/", "/consulting"],
  blog: ["/blog"]
};

function slugPath(kind: PublicContentKind, slug?: unknown) {
  if (!slug) return [];

  const value = encodeURIComponent(String(slug));
  if (kind === "course") return [`/courses/${value}`, `/courses/${value}/preview`, `/courses/${value}/curriculum`, `/courses/${value}/enroll`];
  if (kind === "product") return [`/marketplace/product/${value}`, `/marketplace/product/${value}/buy`];
  if (kind === "consulting") return [`/consulting/${value}`, `/consulting/${value}/book`];
  if (kind === "blog") return [`/blog/${value}`];

  return [];
}

export function revalidatePublicContent(kind: PublicContentKind, slug?: unknown) {
  const paths = new Set(["/sitemap.xml", "/search", ...PUBLIC_PATHS[kind], ...slugPath(kind, slug)]);

  clearPublicQueryCache();

  for (const path of paths) {
    try {
      revalidatePath(path, "page");
    } catch {
      // Revalidation is best-effort for route handlers and should not break writes.
    }
  }
}

