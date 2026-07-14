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
  // Exclude API routes (except /api/bookings which needs Clerk auth), static files, and Next.js internals
  matcher: [
    "/((?!api|_next|_vercel|sitemap\\.xml|robots\\.txt|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/api/bookings",
  ],
};
