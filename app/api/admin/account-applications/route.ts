import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk, ApiError } from "@/lib/api";
import { roleApplicationRequirements } from "@/lib/account-roles";
import connectMongoDB from "@/lib/mongodb";
import AccountApplication from "@/models/AccountApplication";
import User from "@/models/User";

const reviewSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(["approved", "rejected", "needs_more_info"]),
  adminNotes: z.string().max(2000).optional()
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new ApiError("Unauthorized.", 401);
  if (session.user.role !== "admin") throw new ApiError("Admin access required.", 403);
  return session;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const filter = status && status !== "all" ? { status } : {};
    const items = await AccountApplication.find(filter).sort({ updatedAt: -1 }).limit(100).lean();

    return apiOk({ items: items.map((item) => ({ ...item, id: String(item._id) })) });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin();
    const body = reviewSchema.parse(await request.json());

    await connectMongoDB();

    const application = await AccountApplication.findById(body.applicationId);
    if (!application) throw new ApiError("Application not found.", 404);

    if (body.status === "approved") {
      const requirements = roleApplicationRequirements[application.requestedRole as keyof typeof roleApplicationRequirements] ?? [];
      if ((application.documents ?? []).length < requirements.length) {
        throw new ApiError("Required documents are incomplete. Request more information first.", 422);
      }

      await User.findByIdAndUpdate(application.userId, {
        accountStatus: "active",
        $addToSet: { validatedRoles: application.requestedRole }
      });
    }

    application.status = body.status;
    application.adminNotes = body.adminNotes ?? "";
    application.reviewedBy = session.user.id;
    application.reviewedAt = new Date();
    await application.save();

    return apiOk({
      application: { ...application.toObject(), id: String(application._id) },
      message: body.status === "approved" ? "Account role validated." : "Application review saved."
    });
  } catch (error) {
    return apiError(error);
  }
}
