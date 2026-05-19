import connectMongoDB from "@/lib/mongodb";
import { getFirebaseAdminMessaging } from "@/lib/firebase-admin";
import Notification from "@/models/Notification";
import UserFcmToken from "@/models/UserFcmToken";

type NotificationInput = {
  userId: string;
  title: string;
  body: string;
  type?: "system" | "course" | "order" | "booking" | "message";
  metadata?: Record<string, unknown>;
};

export async function notifyUser({ userId, title, body, type = "system", metadata = {} }: NotificationInput) {
  await connectMongoDB();

  const notification = await Notification.create({
    userId,
    title,
    body,
    type,
    metadata
  });

  await sendFirebasePush(userId, title, body, metadata);

  return notification;
}

async function sendFirebasePush(userId: string, title: string, body: string, metadata: Record<string, unknown>) {
  const messaging = getFirebaseAdminMessaging();
  if (!messaging) return;

  const tokens = await UserFcmToken.find({ userId, disabledAt: { $exists: false } })
    .select("token")
    .sort({ lastSeenAt: -1 })
    .limit(20)
    .lean();

  const tokenValues = tokens.map((item) => item.token).filter(Boolean);
  if (!tokenValues.length) return;

  const response = await messaging.sendEachForMulticast({
    tokens: tokenValues,
    notification: { title, body },
    data: Object.fromEntries(
      Object.entries(metadata)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)])
    ),
    webpush: {
      fcmOptions: {
        link: typeof metadata.url === "string" ? metadata.url : "/notifications"
      }
    }
  });

  const failedTokens = response.responses
    .map((item, index) => (!item.success ? tokenValues[index] : ""))
    .filter(Boolean);

  if (failedTokens.length) {
    await UserFcmToken.updateMany({ token: { $in: failedTokens } }, { disabledAt: new Date() });
  }
}
