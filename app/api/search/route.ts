import { apiError, apiOk } from "@/lib/api";
import connectMongoDB from "@/lib/mongodb";
import AITool from "@/models/AITool";
import BlogPost from "@/models/BlogPost";
import ConsultingService from "@/models/ConsultingService";
import Course from "@/models/Course";
import FreelancerProfile from "@/models/FreelancerProfile";
import JobPost from "@/models/JobPost";
import Product from "@/models/Product";
import ShopProfile from "@/models/ShopProfile";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  try {
    const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 80);
    const term = q ? new RegExp(escapeRegex(q), "i") : null;
    const publicFilter = { status: { $ne: "archived" } };

    await connectMongoDB();

    const [courses, products, consultants, jobs, shops, freelancers, posts, aiTools] = await Promise.all([
      Course.find(term ? { ...publicFilter, $or: [{ title: term }, { category: term }, { instructorName: term }, { tags: term }, { outcomes: term }] } : publicFilter)
        .select("title slug category instructorName shortDescription image rating")
        .limit(8)
        .lean(),
      Product.find(term ? { ...publicFilter, $or: [{ name: term }, { category: term }, { sellerName: term }, { type: term }, { tags: term }] } : publicFilter)
        .select("name slug category sellerName images price rating type")
        .limit(8)
        .lean(),
      ConsultingService.find(term ? { ...publicFilter, $or: [{ title: term }, { expertName: term }, { expertTitle: term }, { expertise: term }] } : publicFilter)
        .select("title slug expertName expertTitle expertise heroImage rating")
        .limit(8)
        .lean(),
      JobPost.find(term ? { ...publicFilter, $or: [{ title: term }, { companyName: term }, { category: term }, { location: term }, { skills: term }] } : publicFilter)
        .select("title slug companyName category location workplaceType employmentType skills")
        .limit(8)
        .lean(),
      ShopProfile.find(term ? { ...publicFilter, $or: [{ name: term }, { category: term }, { city: term }, { country: term }, { tags: term }, { description: term }] } : publicFilter)
        .select("name slug category city country tagline logo coverImage rating")
        .limit(8)
        .lean(),
      FreelancerProfile.find(term ? { ...publicFilter, $or: [{ name: term }, { role: term }, { specialty: term }, { location: term }, { skills: term }] } : publicFilter)
        .select("name slug role specialty location hourlyRate image rating skills")
        .limit(8)
        .lean(),
      BlogPost.find(term ? { published: true, deletedAt: { $exists: false }, $or: [{ title: term }, { excerpt: term }, { content: term }, { categoryName: term }] } : { published: true, deletedAt: { $exists: false } })
        .select("title slug excerpt categoryName image publishedAt")
        .limit(8)
        .lean(),
      AITool.find(term ? { ...publicFilter, $or: [{ name: term }, { description: term }, { category: term }, { features: term }] } : publicFilter)
        .select("name slug description category icon pricingPlan")
        .limit(8)
        .lean()
    ]);

    const results = [
      ...courses.map((item) => ({
        id: String(item._id),
        type: "course",
        title: item.title,
        subtitle: `${item.category} course by ${item.instructorName}`,
        description: item.shortDescription,
        href: `/courses/${item.slug}`,
        image: item.image
      })),
      ...products.map((item) => ({
        id: String(item._id),
        type: "product",
        title: item.name,
        subtitle: `${item.category} ${item.type ?? "product"} by ${item.sellerName}`,
        description: item.price ? `Marketplace item priced at ${item.price}` : "Marketplace item",
        href: `/marketplace/product/${item.slug}`,
        image: item.images?.[0]
      })),
      ...consultants.map((item) => ({
        id: String(item._id),
        type: "consulting",
        title: item.title,
        subtitle: `${item.expertName} - ${item.expertTitle}`,
        description: (item.expertise ?? []).slice(0, 4).join(", "),
        href: `/consulting/${item.slug}`,
        image: item.heroImage
      })),
      ...jobs.map((item) => ({
        id: String(item._id),
        type: "job",
        title: item.title,
        subtitle: `${item.companyName} - ${item.location}`,
        description: [item.employmentType, item.workplaceType, item.category].filter(Boolean).join(" / "),
        href: `/jobs?q=${encodeURIComponent(item.title ?? "")}`
      })),
      ...shops.map((item) => ({
        id: String(item._id),
        type: "business",
        title: item.name,
        subtitle: [item.category, item.city, item.country].filter(Boolean).join(" - "),
        description: item.tagline,
        href: `/business-directory?q=${encodeURIComponent(item.name ?? "")}`,
        image: item.logo || item.coverImage
      })),
      ...freelancers.map((item) => ({
        id: String(item._id),
        type: "freelancer",
        title: item.name,
        subtitle: `${item.role} - ${item.location}`,
        description: [item.specialty, ...(item.skills ?? []).slice(0, 3)].filter(Boolean).join(", "),
        href: `/freelancers?q=${encodeURIComponent(item.name ?? "")}`,
        image: item.image
      })),
      ...posts.map((item) => ({
        id: String(item._id),
        type: "blog",
        title: item.title,
        subtitle: item.categoryName,
        description: item.excerpt,
        href: `/blog/${item.slug}`,
        image: item.image
      })),
      ...aiTools.map((item) => ({
        id: String(item._id),
        type: "ai-tool",
        title: item.name,
        subtitle: `${item.category} - ${item.pricingPlan}`,
        description: item.description,
        href: `/ai-tools?tool=${encodeURIComponent(item.slug ?? item.name ?? "")}`
      }))
    ];

    return apiOk({
      q,
      results,
      groups: { courses, products, consultants, jobs, shops, freelancers, posts, aiTools },
      semantic: "full-platform-index-ready"
    });
  } catch (error) {
    return apiError(error);
  }
}
