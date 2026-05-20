import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { env } from "@/lib/env";

function serviceAccountFromEnv() {
  const json = env("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (json) {
    return JSON.parse(json);
  }

  const projectId = env("FIREBASE_PROJECT_ID") || env("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  const clientEmail = env("FIREBASE_CLIENT_EMAIL");
  const privateKey = env("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) return null;

  return { projectId, clientEmail, privateKey };
}

export function getFirebaseAdminMessaging() {
  const serviceAccount = serviceAccountFromEnv();
  if (!serviceAccount) return null;

  const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
  return getMessaging(app);
}
