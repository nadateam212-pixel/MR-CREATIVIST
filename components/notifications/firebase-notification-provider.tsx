"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { getToken, onMessage } from "firebase/messaging";
import { toast } from "sonner";
import { getFirebaseMessaging } from "@/lib/firebase-client";
import { firebaseWebPushVapidKey } from "@/lib/firebase-config";

const permissionStorageKey = "mr-creativist-fcm-prompted";

export function FirebaseNotificationProvider() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    async function setupMessaging() {
      const messaging = await getFirebaseMessaging();
      if (!messaging || cancelled) return;

      unsubscribe = onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? "New notification";
        const body = payload.notification?.body ?? "Open MR Creativist to view the latest update.";
        toast.message(title, { description: body });
      });

      const alreadyPrompted = window.localStorage.getItem(permissionStorageKey);
      if (Notification.permission === "default" && !alreadyPrompted) {
        window.localStorage.setItem(permissionStorageKey, "1");
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
        await Notification.requestPermission();
      }

      if (Notification.permission !== "granted" || cancelled) return;

      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const token = await getToken(messaging, {
        vapidKey: firebaseWebPushVapidKey,
        serviceWorkerRegistration: registration
      });

      if (!token) return;

      await fetch("/api/notifications/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
    }

    void setupMessaging().catch(() => {
      // Push is an enhancement; the in-app notification center remains the source of truth.
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [status]);

  return null;
}
