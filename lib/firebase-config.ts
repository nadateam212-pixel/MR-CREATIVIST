const defaultFirebaseConfig = {
  apiKey: "AIzaSyC7gUWXOZuaX2FilDOvU039AjSAuQFcKic",
  authDomain: "mrcreativist.firebaseapp.com",
  projectId: "mrcreativist",
  storageBucket: "mrcreativist.firebasestorage.app",
  messagingSenderId: "403584587333",
  appId: "1:403584587333:web:b980810328d7181964b52c",
  measurementId: "G-9JCEBD2X2B"
};

const defaultVapidKey =
  "BG2HcUVQTNw5SCDzLzayQcVVtjlgOUY-jhHZ9XD83Ln6FrklH6n-UMK43DcA-iKpaBhvekfla6njEK6jsD8-UEA";

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

function readFirebaseEnv(name: string, fallback: string) {
  const value = cleanEnvValue(process.env[name]);

  if (!value || value === "undefined" || value === "null" || value.includes("...")) {
    return fallback;
  }

  return value;
}

function readApiKey() {
  const value = readFirebaseEnv("NEXT_PUBLIC_FIREBASE_API_KEY", defaultFirebaseConfig.apiKey);
  return /^AIza[0-9A-Za-z_-]{35}$/.test(value) ? value : defaultFirebaseConfig.apiKey;
}

export const firebaseConfig = {
  apiKey: readApiKey(),
  authDomain: readFirebaseEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", defaultFirebaseConfig.authDomain),
  projectId: readFirebaseEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", defaultFirebaseConfig.projectId),
  storageBucket: readFirebaseEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", defaultFirebaseConfig.storageBucket),
  messagingSenderId: readFirebaseEnv(
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    defaultFirebaseConfig.messagingSenderId
  ),
  appId: readFirebaseEnv("NEXT_PUBLIC_FIREBASE_APP_ID", defaultFirebaseConfig.appId),
  measurementId: readFirebaseEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", defaultFirebaseConfig.measurementId)
};

export const firebaseWebPushVapidKey = readFirebaseEnv("NEXT_PUBLIC_FIREBASE_VAPID_KEY", defaultVapidKey);

export const firebaseConfigStatus = {
  googleAuthReady:
    /^AIza[0-9A-Za-z_-]{35}$/.test(firebaseConfig.apiKey) &&
    Boolean(firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId),
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
};
