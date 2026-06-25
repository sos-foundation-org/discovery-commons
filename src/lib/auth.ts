import { NextAuthOptions, getServerSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
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
    ...(useCredentialsDev
      ? [
          CredentialsProvider({
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
  session: {
    strategy: useCredentialsDev ? "jwt" : "database",
  },
  callbacks: {
    async session({ session, user, token }) {
      if (session.user) {
        if (useCredentialsDev && token) {
          session.user.id = token.sub!;
          const dbUser = await prisma.user.findUnique({ where: { id: token.sub! } });
          session.user.trustLevel = (dbUser as any)?.trustLevel ?? "new_member";
          session.user.displayName = (dbUser as any)?.displayName ?? session.user.name;
        } else if (user) {
          session.user.id = user.id;
          session.user.trustLevel = (user as any).trustLevel ?? "new_member";
          session.user.displayName = (user as any).displayName ?? session.user.name;
        }
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
