import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk, ApiError } from "@/lib/api";
import { isElevatedAccountRole, roleApplicationProfiles, roleApplicationRequirements } from "@/lib/account-roles";
import connectMongoDB from "@/lib/mongodb";
import AccountApplication from "@/models/AccountApplication";
import User from "@/models/User";

const documentUrlSchema = z.string().min(1).max(500).refine(
  (value) => value.startsWith("/api/uploads/") || z.url().safeParse(value).success,
  "Use a valid uploaded document or external URL."
);

const documentSchema = z.object({
  label: z.string().min(2).max(160),
  fileName: z.string().max(220).optional(),
  url: documentUrlSchema,
  kind: z.enum(["identity", "credential", "portfolio", "business", "policy", "other"]).default("other"),
  assetId: z.string().max(120).optional(),
  description: z.string().max(500).optional()
});

const applicationSchema = z.object({
  requestedRole: z.enum(["instructor", "seller", "freelancer", "consultant"]),
  professionalTitle: z.string().min(2).max(160),
  organization: z.string().max(160).optional(),
  phone: z.string().max(40).optional(),
  website: z.url().optional().or(z.literal("")),
  summary: z.string().min(30).max(2500),
  experienceYears: z.coerce.number().int().min(0).max(80).default(0),
  roleDetails: z.record(z.string(), z.unknown()).default({}),
  documents: z.array(documentSchema).min(1)
});

function validateRoleDetails(requestedRole: keyof typeof roleApplicationProfiles, details: Record<string, unknown>) {
  const profile = roleApplicationProfiles[requestedRole];
  const normalized: Record<string, string> = {};

  for (const field of profile.detailFields) {
    const rawValue = details[field.name];
    const value = rawValue === undefined || rawValue === null ? "" : String(rawValue).trim();

    if (field.required && !value) {
      throw new ApiError(`${field.label} is required.`, 422);
    }

    if (field.minLength && value && value.length < field.minLength) {
      throw new ApiError(`${field.label} must be at least ${field.minLength} characters.`, 422);
    }

    if (field.type === "url" && value && !z.url().safeParse(value).success) {
      throw new ApiError(`${field.label} must be a valid URL.`, 422);
    }

    if (field.type === "number" && value) {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue < 0) {
        throw new ApiError(`${field.label} must be a valid positive number.`, 422);
      }
    }

    if (field.type === "select" && value && field.options?.length && !field.options.includes(value)) {
      throw new ApiError(`${field.label} is not a valid option.`, 422);
    }

    normalized[field.name] = value;
  }

  return normalized;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Unauthorized.", 401);

    await connectMongoDB();

    const items = await AccountApplication.find({ userId: session.user.id }).sort({ updatedAt: -1 }).lean();
    return apiOk({ items: items.map((item) => ({ ...item, id: String(item._id) })) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Unauthorized.", 401);
    if (session.user.role === "admin") throw new ApiError("Admin accounts do not apply for account modes.", 403);

    const body = applicationSchema.parse(await request.json());
    if (!isElevatedAccountRole(body.requestedRole)) throw new ApiError("Invalid requested role.", 422);

    const requirements = roleApplicationRequirements[body.requestedRole];
    const uploadedLabels = new Set(body.documents.filter((document) => document.url).map((document) => document.label));
    const missingRequirements = requirements.filter((requirement) => !uploadedLabels.has(requirement));
    if (missingRequirements.length) {
      throw new ApiError(`Upload all required documents: ${requirements.join(", ")}.`, 422);
    }
    const roleDetails = validateRoleDetails(body.requestedRole, body.roleDetails);

    await connectMongoDB();

    const user = await User.findById(session.user.id).select("name email validatedRoles").lean();
    if (!user) throw new ApiError("Account not found.", 404);
    if ((user.validatedRoles ?? []).includes(body.requestedRole)) {
      throw new ApiError("This account mode is already validated.", 409);
    }

    const application = await AccountApplication.findOneAndUpdate(
      {
        userId: user._id,
        requestedRole: body.requestedRole,
        status: { $in: ["pending", "needs_more_info", "rejected"] }
      },
      {
        ...body,
        roleDetails,
        website: body.website || undefined,
        userId: user._id,
        applicantName: user.name,
        applicantEmail: user.email,
        status: "pending",
        adminNotes: ""
      },
      { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return apiOk({
      application: { ...application.toObject(), id: String(application._id) },
      message: "Application submitted for admin validation."
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}
