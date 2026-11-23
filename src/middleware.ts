import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/onboarding",
  "/dashboard",
  "/memories",
  "/letters",
  "/calendar",
  "/check-in",
  "/garden",
  "/bucket-list",
  "/quiz",
  "/playlist",
  "/love-jar",
  "/chat",
  "/timeline",
  "/virtual-hug",
  "/ai-assistant",
  "/settings",
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasSession = Boolean(request.cookies.get("olw_session")?.value);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
