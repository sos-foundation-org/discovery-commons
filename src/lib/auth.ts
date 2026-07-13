import { NextAuthOptions, getServerSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const useCredentialsDev =
  process.env.NODE_ENV === "development" &&
  !process.env.GOOGLE_CLIENT_ID &&
  !process.env.GITHUB_CLIENT_ID;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(process.env.GITHUB_CLIENT_ID
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
          }),
        ]
      : []),
    // ORCID OAuth (Task 4). Sandbox vs production host is env-controlled.
    ...(process.env.ORCID_CLIENT_ID
      ? [
          {
            id: "orcid",
            name: "ORCID",
            type: "oauth" as const,
            wellKnown: `https://${process.env.ORCID_SANDBOX === "true" ? "sandbox.orcid.org" : "orcid.org"}/.well-known/openid-configuration`,
            clientId: process.env.ORCID_CLIENT_ID,
            clientSecret: process.env.ORCID_CLIENT_SECRET,
            authorization: { params: { scope: "openid" } },
            idToken: true,
            checks: ["state" as const],
            profile(profile: { sub: string; given_name?: string; family_name?: string; email?: string }) {
              return {
                id: profile.sub,
                name: [profile.given_name, profile.family_name].filter(Boolean).join(" ") || profile.sub,
                email: profile.email,
                // ORCID iD is the OpenID `sub`.
                orcidId: profile.sub,
                orcidVerified: true,
              };
            },
          },
        ]
      : []),
    // Email + password (self-created accounts). Passwords are bcrypt-hashed
    // (see /api/auth/register). Prototype: no 2FA / email verification yet.
    CredentialsProvider({
      id: "credentials",
      name: "Email & password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    ...(useCredentialsDev
      ? [
          CredentialsProvider({
            id: "dev",
            name: "Dev Login",
            credentials: {
              email: { label: "Email", type: "email", placeholder: "dev@example.com" },
              name: { label: "Name", type: "text", placeholder: "Dev User" },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null;
              const user = await prisma.user.upsert({
                where: { email: credentials.email },
                update: {},
                create: {
                  email: credentials.email,
                  name: credentials.name || "Dev User",
                  displayName: credentials.name || "Dev User",
                  trustLevel: "contributor",
                  covenantAcceptedAt: new Date(),
                },
              });
              return { id: user.id, email: user.email, name: user.name };
            },
          }),
        ]
      : []),
  ],
  // JWT sessions everywhere (not database) so `next-auth/middleware` — which
  // only reads the JWT — can authorize protected routes (/sealed, /settings,
  // /profile, /threads/new, …). With the database strategy the middleware
  // couldn't see the session and bounced logged-in users back to sign-in.
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Persist id + profile fields onto the token at sign-in so the session
    // callback (and middleware) never has to hit the database on subsequent
    // requests — the DB is only queried once, when `user` is present.
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        (token as any).trustLevel = (dbUser as any)?.trustLevel ?? "new_member";
        (token as any).displayName =
          (dbUser as any)?.displayName ?? user.name ?? null;
        token.picture = (dbUser as any)?.image ?? token.picture ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.sub) {
        session.user.id = token.sub;
        session.user.trustLevel = (token as any).trustLevel ?? "new_member";
        session.user.displayName =
          (token as any).displayName ?? session.user.name;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  events: {
    // Persist the ORCID iD onto the user record when they link/sign-in via ORCID
    // (the PrismaAdapter's createUser doesn't carry custom profile fields).
    async signIn({ user, account }) {
      if (account?.provider === "orcid" && account.providerAccountId && user?.id) {
        await prisma.user
          .update({
            where: { id: user.id },
            data: { orcidId: account.providerAccountId, orcidVerified: true },
          })
          .catch(() => {});
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

export function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
  });
}
