export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/threads/new", "/sealed", "/profile", "/admin/:path*", "/notifications", "/settings"],
};
