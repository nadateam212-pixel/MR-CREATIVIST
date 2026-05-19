export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC7gUWXOZuaX2FilDOvU039AjSAuQFcKic",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mrcreativist.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mrcreativist",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mrcreativist.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "403584587333",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:403584587333:web:b980810328d7181964b52c",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-9JCEBD2X2B"
};

export const firebaseWebPushVapidKey =
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
  "BG2HcUVQTNw5SCDzLzayQcVVtjlgOUY-jhHZ9XD83Ln6FrklH6n-UMK43DcA-iKpaBhvekfla6njEK6jsD8-UEA";
