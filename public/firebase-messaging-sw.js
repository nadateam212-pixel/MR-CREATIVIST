/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyC7gUWXOZuaX2FilDOvU039AjSAuQFcKic",
  authDomain: "mrcreativist.firebaseapp.com",
  projectId: "mrcreativist",
  storageBucket: "mrcreativist.firebasestorage.app",
  messagingSenderId: "403584587333",
  appId: "1:403584587333:web:b980810328d7181964b52c",
  measurementId: "G-9JCEBD2X2B"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "MR Creativist";
  const options = {
    body: payload.notification?.body || "You have a new update.",
    icon: "/icons/logo.png",
    badge: "/icons/logo.png",
    data: {
      url: payload.fcmOptions?.link || payload.data?.url || "/notifications"
    }
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/notifications";
  event.waitUntil(clients.openWindow(url));
});
