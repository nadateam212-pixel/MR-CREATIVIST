import { apiError, apiOk } from "@/lib/api";
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
      items: categories.sort().map((name) => ({
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
