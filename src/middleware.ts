export { default } from "next-auth/middleware";

// Whitelist approach: everything is protected EXCEPT these public routes.
// Forgetting to add a new page fails-closed (requires login) instead of
// failing-open (unprotected).
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes handle their own auth)
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, robots.txt, sitemap.xml
     * - Public pages listed below
     */
    "/((?!api/|api$|_next/|favicon\\.ico|robots\\.txt|sitemap\\.xml|avatars/|$|about$|about/|auth/|auth$|verify/|share/|legal/).*)",
  ],
};
