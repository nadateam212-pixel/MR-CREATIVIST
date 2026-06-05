import { apiError, apiOk } from "@/lib/api";
import { courseCategories } from "@/lib/course-categories";
import connectMongoDB from "@/lib/mongodb";
import Course from "@/models/Course";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function GET() {
  try {
    await connectMongoDB();
    const categories = await Course.distinct("category", { status: { $ne: "archived" } });

    return apiOk({
      items: Array.from(new Set([...courseCategories, ...categories].filter(Boolean))).sort().map((name) => ({
        id: slugify(name),
        name,
        slug: slugify(name),
        description: `${name} courses available in the live catalog.`
      }))
    });
  } catch (error) {
    return apiError(error);
  }
}
