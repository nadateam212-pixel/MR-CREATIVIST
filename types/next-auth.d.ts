import type { DefaultSession } from "next-auth";

type PlatformRole = "student" | "instructor" | "seller" | "client" | "freelancer" | "consultant" | "admin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: PlatformRole;
      validatedRoles?: PlatformRole[];
      accountStatus?: "active" | "suspended" | "review";
    } & DefaultSession["user"];
  }

  interface User {
    role: PlatformRole;
    validatedRoles?: PlatformRole[];
    accountStatus?: "active" | "suspended" | "review";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: PlatformRole;
    validatedRoles?: PlatformRole[];
    accountStatus?: "active" | "suspended" | "review";
  }
}
