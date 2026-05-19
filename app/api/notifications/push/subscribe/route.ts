import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk, ApiError } from "@/lib/api";
import connectMongoDB from "@/lib/mongodb";
import UserFcmToken from "@/models/UserFcmToken";

const tokenSchema = z.object({
  token: z.string().min(20).max(4096)
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Unauthorized.", 401);

    const body = tokenSchema.parse(await request.json());

    await connectMongoDB();
    await UserFcmToken.findOneAndUpdate(
      { token: body.token },
      {
        $set: {
          userId: session.user.id,
          token: body.token,
          platform: "web",
          userAgent: request.headers.get("user-agent") ?? "",
          lastSeenAt: new Date()
        },
        $unset: { disabledAt: "" }
      },
      { upsert: true, returnDocument: "after" }
    );

    return apiOk({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) throw new ApiError("Unauthorized.", 401);

    const body = tokenSchema.parse(await request.json());

    await connectMongoDB();
    await UserFcmToken.updateOne({ userId: session.user.id, token: body.token }, { disabledAt: new Date() });

    return apiOk({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
