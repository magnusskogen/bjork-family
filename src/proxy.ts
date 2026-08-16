import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Portvakten: uten gyldig cookie havner alt på /login.
 * (Dette het `middleware.ts` før Next 16 – samme mekanisme, nytt navn.)
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const loggedIn = await verifySessionToken(token);
  const onLoginPage = request.nextUrl.pathname === "/login";

  if (!loggedIn && !onLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (loggedIn && onLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|webmanifest)$).*)"],
};
