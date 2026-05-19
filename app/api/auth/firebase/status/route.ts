import { apiError, apiOk } from "@/lib/api";
import { firebaseConfig, firebaseConfigStatus } from "@/lib/firebase-config";

function maskKey(key: string) {
  if (key.length < 12) return "invalid";
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

async function verifyApiKey() {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: "mr-creativist-config-check" }),
      cache: "no-store"
    }
  );

  const payload = await response.json().catch(() => null);
  const message = payload?.error?.message;

  return {
    ok: message === "INVALID_ID_TOKEN",
    firebaseMessage: message || (response.ok ? "OK" : "UNKNOWN_FIREBASE_ERROR")
  };
}

export async function GET() {
  try {
    const keyCheck = firebaseConfigStatus.googleAuthReady
      ? await verifyApiKey()
      : { ok: false, firebaseMessage: "CLIENT_CONFIG_INCOMPLETE" };

    return apiOk({
      googleAuthReady: firebaseConfigStatus.googleAuthReady && keyCheck.ok,
      apiKey: maskKey(firebaseConfig.apiKey),
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      firebaseMessage: keyCheck.firebaseMessage,
      help:
        keyCheck.ok
          ? "Firebase accepted this Web API key."
          : "Update NEXT_PUBLIC_FIREBASE_API_KEY in Vercel or remove the bad override so the app can use the bundled mrcreativist key."
    });
  } catch (error) {
    return apiError(error);
  }
}
