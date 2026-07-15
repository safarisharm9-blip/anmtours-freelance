import { clerkMiddleware } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export default clerkMiddleware((auth, req) => {
  // Skip intl for API routes - they must stay at /api/... (no locale prefix)
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  return intlMiddleware(req);
});

export const config = {
  // Match pages and API routes so Clerk's auth() is available wherever it is used.
  // API routes bypass next-intl in the middleware callback above.
  matcher: [
    "/((?!api|_next|_vercel|sitemap\\.xml|robots\\.txt|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/api/:path*",
  ],
};
