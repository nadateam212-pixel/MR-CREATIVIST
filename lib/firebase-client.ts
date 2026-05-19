"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";
import { firebaseConfig } from "@/lib/firebase-config";

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export async function getFirebaseMessaging() {
  if (typeof window === "undefined") return null;
  if (!(await isSupported())) return null;

  return getMessaging(getFirebaseApp());
}
