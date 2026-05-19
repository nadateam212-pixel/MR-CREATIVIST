import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectMongoDB from "@/lib/mongodb";
import { normalizeRoles } from "@/lib/account-roles";
import { verifyAuthOtp, type AuthOtpPurpose } from "@/lib/auth-otp";
import { firebaseConfig } from "@/lib/firebase-config";
import User from "@/models/User";
import type { PlatformRole } from "@/types";

type FirebaseLookupUser = {
  localId: string;
  email?: string;
  displayName?: string;
  photoUrl?: string;
  emailVerified?: boolean;
};

async function verifyFirebaseIdToken(idToken: string) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken })
  });
  const payload = await response.json();

  if (!response.ok || !payload.users?.[0]) {
    return null;
  }

  return payload.users[0] as FirebaseLookupUser;
}

function serializeUser(user: {
  _id: unknown;
  email?: string | null;
  name?: string | null;
  profileImage?: string | null;
  role?: string;
  validatedRoles?: string[];
  accountStatus?: string;
}) {
  const role = (user.role ?? "client") as PlatformRole;

  return {
    id: String(user._id),
    email: user.email ?? "",
    name: user.name ?? "MR Creativist user",
    image: user.profileImage ?? undefined,
    role,
    validatedRoles: normalizeRoles(user.validatedRoles, [role]),
    accountStatus: (user.accountStatus ?? "active") as "active" | "suspended" | "review"
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.toLowerCase().trim() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        await connectMongoDB();
        const user = await User.findOne({ email }).select("+passwordHash name email profileImage role validatedRoles accountStatus").lean();
        if (!user?.passwordHash || user.accountStatus === "suspended") return null;

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) return null;

        await User.updateOne(
          { _id: user._id },
          {
            $set: { lastLoginAt: new Date() },
            $addToSet: { authProviders: "credentials" }
          }
        );

        return serializeUser(user);
      }
    }),
    Credentials({
      id: "email-otp",
      name: "Email OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
        purpose: { label: "Purpose", type: "text" }
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.toLowerCase() : "";
        const code = typeof credentials?.code === "string" ? credentials.code : "";
        const purpose = credentials?.purpose === "register" ? "register" : "login";

        if (!email || !code) return null;

        const otp = await verifyAuthOtp(email, purpose as AuthOtpPurpose, code);
        if (!otp.ok) return null;

        await connectMongoDB();

        const user = await User.findOneAndUpdate(
          { email },
          {
            $set: {
              emailVerifiedAt: new Date(),
              lastLoginAt: new Date()
            },
            $addToSet: { authProviders: "credentials" }
          },
          { returnDocument: "after" }
        ).lean();

        if (!user || user.accountStatus === "suspended") return null;

        return serializeUser(user);
      }
    }),
    Credentials({
      id: "firebase-google",
      name: "Google",
      credentials: {
        idToken: { label: "Firebase ID token", type: "text" }
      },
      async authorize(credentials) {
        const idToken = typeof credentials?.idToken === "string" ? credentials.idToken : "";
        if (!idToken) return null;

        const firebaseUser = await verifyFirebaseIdToken(idToken);
        const email = firebaseUser?.email?.toLowerCase();
        if (!firebaseUser?.localId || !email) return null;

        await connectMongoDB();

        const user = await User.findOneAndUpdate(
          { email },
          {
            $setOnInsert: {
              email,
              name: firebaseUser.displayName || email.split("@")[0] || "MR Creativist user",
              role: "client",
              validatedRoles: ["client"]
            },
            $set: {
              firebaseUid: firebaseUser.localId,
              ...(firebaseUser.photoUrl ? { profileImage: firebaseUser.photoUrl } : {}),
              ...(firebaseUser.emailVerified ? { emailVerifiedAt: new Date() } : {}),
              lastLoginAt: new Date()
            },
            $addToSet: { authProviders: { $each: ["firebase", "google"] } }
          },
          { upsert: true, returnDocument: "after", runValidators: true }
        ).lean();

        if (!user || user.accountStatus === "suspended") return null;

        return serializeUser(user);
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = String(user.id);
        token.role = user.role;
        token.validatedRoles = user.validatedRoles;
        token.accountStatus = user.accountStatus;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        try {
          await connectMongoDB();
          const freshUser = await User.findById(token.id).select("name email profileImage role validatedRoles accountStatus").lean();

          if (freshUser) {
            session.user.id = String(freshUser._id);
            session.user.name = freshUser.name;
            session.user.email = freshUser.email;
            session.user.image = freshUser.profileImage;
            session.user.role = freshUser.role;
            session.user.validatedRoles = normalizeRoles(freshUser.validatedRoles, [freshUser.role ?? "client"]);
            session.user.accountStatus = freshUser.accountStatus ?? "active";
            return session;
          }
        } catch {
          // Keep token data if MongoDB has a transient read issue.
        }
      }

      session.user.id = String(token.id);
      session.user.role = token.role;
      session.user.validatedRoles = token.validatedRoles;
      session.user.accountStatus = token.accountStatus;
      return session;
    }
  }
});
