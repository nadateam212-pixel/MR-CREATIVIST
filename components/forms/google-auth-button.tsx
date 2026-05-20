"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { firebaseConfigStatus } from "@/lib/firebase-config";

export function GoogleAuthButton({
  label = "Continue with Google",
  callbackUrl = ""
}: {
  label?: string;
  callbackUrl?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const safeCallbackUrl =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") && !callbackUrl.includes("://")
      ? callbackUrl
      : "";

  function toCurrentOriginPath(value?: string | null) {
    const fallback = safeCallbackUrl || "/dashboard";
    if (!value) return fallback;

    try {
      const url = new URL(value, window.location.origin);
      if (url.origin !== window.location.origin && !["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
        return fallback;
      }
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return fallback;
    }
  }

  function getGoogleErrorMessage(error: unknown) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";
    const rawMessage = error instanceof Error ? error.message : "";
    const normalizedError = `${code} ${rawMessage}`.toLowerCase();

    if (code === "auth/unauthorized-domain") {
      const host = typeof window !== "undefined" ? window.location.hostname : "this domain";
      return `Google sign-in is blocked in Firebase for ${host}. Add ${host} and mrcreativist.vercel.app to Firebase Auth authorized domains. You can use email and password now.`;
    }

    if (
      code === "auth/api-key-not-valid.-please-pass-a-valid-api-key." ||
      code === "auth/invalid-api-key" ||
      normalizedError.includes("api-key-not-valid") ||
      normalizedError.includes("invalid api key")
    ) {
      return "Google sign-in is not ready because the Firebase Web API key is invalid. Use email and password now, then update NEXT_PUBLIC_FIREBASE_API_KEY in Vercel.";
    }

    if (code === "auth/popup-closed-by-user") {
      return "Google sign-in was cancelled.";
    }

    if (code === "auth/popup-blocked") {
      return "The browser blocked the Google sign-in popup. Allow popups or use email and password.";
    }

    return rawMessage || "Google sign-in failed. Use email and password instead.";
  }

  async function continueWithGoogle() {
    if (!firebaseConfigStatus.googleAuthReady) {
      const message = "Google sign-in is not configured yet. Use email and password while Firebase settings are updated.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(getFirebaseAuth(), provider);
      const idToken = await credential.user.getIdToken();
      const result = await signIn("firebase-google", {
        idToken,
        redirect: false,
        callbackUrl: safeCallbackUrl || "/dashboard",
        redirectTo: safeCallbackUrl || "/dashboard"
      });

      if (result?.error) {
        throw new Error("Google sign-in failed. Try again.");
      }

      toast.success("Signed in with Google.");
      router.refresh();
      window.location.assign(toCurrentOriginPath(result?.url));
    } catch (error) {
      const message = getGoogleErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => void continueWithGoogle()} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <span className="grid size-5 place-items-center rounded-full bg-white text-sm font-black text-slate-900">G</span>}
        {label}
      </Button>
      {errorMessage ? <p className="rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">{errorMessage}</p> : null}
    </div>
  );
}
