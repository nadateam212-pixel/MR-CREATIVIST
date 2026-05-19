import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectMongoDB from "@/lib/mongodb";
import { loginSchema } from "@/lib/validations";
import { normalizeRoles } from "@/lib/account-roles";
import User from "@/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        await connectMongoDB();

        const user = await User.findOne({
          email: parsed.data.email.toLowerCase()
        })
          .select("+passwordHash")
          .lean();

        if (!user?.passwordHash) {
          return null;
        }

        const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);

        if (!validPassword) {
          return null;
        }

        try {
          await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
        } catch {
          // Authentication should not fail because activity tracking is temporarily unavailable.
        }

        return {
          id: String(user._id),
          email: user.email,
          name: user.name,
          image: user.profileImage,
          role: user.role,
          validatedRoles: normalizeRoles(user.validatedRoles, [user.role ?? "client"]),
          accountStatus: user.accountStatus ?? "active"
        };
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
