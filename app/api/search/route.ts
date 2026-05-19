import { apiError, apiOk } from "@/lib/api";
import connectMongoDB from "@/lib/mongodb";
import ConsultingService from "@/models/ConsultingService";
import Course from "@/models/Course";
import Product from "@/models/Product";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  try {
    const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 80);
    const term = q ? new RegExp(escapeRegex(q), "i") : null;

    await connectMongoDB();

    const [courses, products, consultants] = await Promise.all([
      Course.find(term ? { status: "published", $or: [{ title: term }, { category: term }, { instructorName: term }] } : { status: "published" })
        .select("title slug category instructorName image rating")
        .limit(5)
        .lean(),
      Product.find(term ? { status: "published", $or: [{ name: term }, { category: term }, { sellerName: term }] } : { status: "published" })
        .select("name slug category sellerName images price rating")
        .limit(5)
        .lean(),
      ConsultingService.find(term ? { status: "published", $or: [{ title: term }, { expertName: term }, { expertise: term }] } : { status: "published" })
        .select("title slug expertName expertTitle expertise heroImage rating")
        .limit(5)
        .lean()
    ]);

    return apiOk({ q, courses, products, consultants, semantic: "embeddings-ready" });
  } catch (error) {
    return apiError(error);
  }
}
