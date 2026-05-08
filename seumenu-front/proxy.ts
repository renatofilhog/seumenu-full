import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_COOKIE = "seumenu_access_token";
const SAAS_TOKEN_COOKIE = "seumenu_saas_access_token";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/painel") && !pathname.startsWith("/painel/login")) {
    const token = request.cookies.get(TOKEN_COOKIE)?.value;
    if (token) {
      return NextResponse.next();
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/painel/login";
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/smmanageapps") && !pathname.startsWith("/smmanageapps/login")) {
    const token = request.cookies.get(SAAS_TOKEN_COOKIE)?.value;
    if (token) {
      return NextResponse.next();
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/smmanageapps/login";
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
