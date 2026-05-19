import { z } from "zod";
import User from "@/models/User";
import { jsonError, jsonOk, parsePagination, readJson, requireMongo, requireRole } from "@/lib/mongo-api";

const userSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.email(),
  role: z.enum(["student", "instructor", "seller", "client", "freelancer", "consultant", "admin"]).default("client"),
  validatedRoles: z.array(z.enum(["student", "instructor", "seller", "client", "freelancer", "consultant", "admin"])).default(["client"]),
  profileImage: z.url().optional(),
  bio: z.string().max(1200).optional(),
  location: z.string().max(160).optional(),
  phone: z.string().max(40).optional()
});

export async function GET(request: Request) {
  try {
    await requireMongo();
    await requireRole(request, ["admin"]);
    const { limit, skip, q } = parsePagination(request);
    const filter: Record<string, unknown> = {};

    if (q) {
      const term = new RegExp(q, "i");
      filter.$or = [{ name: term }, { email: term }, { role: term }];
    }

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter)
    ]);

    return jsonOk({ items, total });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMongo();
    await requireRole(request, ["admin"]);
    const body = userSchema.parse(await readJson(request));
    const user = await User.create(body);

    return jsonOk(user, 201);
  } catch (error) {
    return jsonError(error);
  }
}
