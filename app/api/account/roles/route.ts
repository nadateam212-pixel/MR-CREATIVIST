import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk, ApiError } from "@/lib/api";
import {
  accountRoles,
  elevatedAccountRoles,
  isAccountRole,
  normalizeRoles,
  roleApplicationRequirements,
  roleDashboardPaths,
  roleLabels
} from "@/lib/account-roles";
import connectMongoDB from "@/lib/mongodb";
import AccountApplication from "@/models/AccountApplication";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";

const switchSchema = z.object({
  role: z.enum(accountRoles)
});

async function getAccountState(userId: string) {
  await connectMongoDB();

  const user = await User.findById(userId).select("name email role validatedRoles accountStatus").lean();
  if (!user) throw new ApiError("Account not found.", 404);
  if (user.accountStatus === "suspended") throw new ApiError("Account is suspended.", 403);

  const [hasEnrollment, applications] = await Promise.all([
    Enrollment.exists({
      $or: [{ userId: user._id }, { learnerEmail: user.email }]
    }),
    AccountApplication.find({ userId: user._id }).sort({ updatedAt: -1 }).lean()
  ]);

  const validatedRoles = normalizeRoles(user.validatedRoles, [user.role ?? "client"]);
  const applicationByRole = new Map(applications.map((application) => [application.requestedRole, application]));

  const roles = accountRoles.map((role) => {
    const application = applicationByRole.get(role);
    const elevated = elevatedAccountRoles.includes(role as (typeof elevatedAccountRoles)[number]);
    const available =
      role === "client" ||
      validatedRoles.includes(role) ||
      (role === "student" && Boolean(hasEnrollment));
    const pending = application?.status === "pending" || application?.status === "needs_more_info";

    return {
      role,
      label: roleLabels[role],
      active: user.role === role,
      available,
      pending,
      status: available ? "available" : pending ? application.status : "locked",
      reason: available
        ? role === "student" && !validatedRoles.includes("student")
          ? "Available because you enrolled in a course."
          : "Validated for this account."
        : role === "student"
          ? "Enroll in a course to unlock student mode."
          : pending
            ? "Application is waiting for admin review."
            : "Apply and upload required documents for admin validation.",
      dashboardPath: roleDashboardPaths[role],
      requirements: elevated ? roleApplicationRequirements[role as keyof typeof roleApplicationRequirements] : [],
      applicationId: application ? String(application._id) : null
    };
  });

  return { user, roles, validatedRoles, hasEnrollment: Boolean(hasEnrollment) };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Unauthorized.", 401);

    if (session.user.role === "admin") {
      return apiOk({
        activeRole: "admin",
        isAdmin: true,
        roles: [],
        adminPath: roleDashboardPaths.admin
      });
    }

    const state = await getAccountState(session.user.id);

    return apiOk({
      activeRole: state.user.role,
      isAdmin: false,
      validatedRoles: state.validatedRoles,
      hasEnrollment: state.hasEnrollment,
      roles: state.roles
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Unauthorized.", 401);

    const body = switchSchema.parse(await request.json());
    if (!isAccountRole(body.role)) throw new ApiError("Invalid account role.", 422);
    if (session.user.role === "admin") throw new ApiError("Admin accounts cannot switch into non-admin dashboards.", 403);

    const state = await getAccountState(session.user.id);
    const target = state.roles.find((item) => item.role === body.role);

    if (!target?.available) {
      throw new ApiError(target?.reason ?? "This account mode is not available.", 403);
    }

    const update =
      body.role === "student" && state.hasEnrollment
        ? { role: body.role, $addToSet: { validatedRoles: "student" } }
        : { role: body.role };
    await User.findByIdAndUpdate(session.user.id, update, { runValidators: true });

    return apiOk({
      activeRole: body.role,
      dashboardPath: roleDashboardPaths[body.role],
      message: `Switched to ${roleLabels[body.role]} mode.`
    });
  } catch (error) {
    return apiError(error);
  }
}
