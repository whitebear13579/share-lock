import { NextRequest, NextResponse } from "next/server";

/*

    Server-side authentication middleware

    This middleware protects routes by verifying session cookies on the server
    before any page content is rendered, preventing unauthorized access to
    protected page structures even if client-side checks are bypassed.

*/

const PROTECTED_ROUTES = [
    "/dashboard",
    "/dashboard/files",
    "/dashboard/settings",
];

const AUTH_ROUTES = [
    "/login",
    "/signup",
    "/reset-password",
];


const SESSION_COOKIE_NAME = "__session";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/image") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    if (pathname.startsWith("/share/")) {
        return NextResponse.next();
    }

    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    const hasSession = !!sessionCookie;

    const isProtectedRoute = PROTECTED_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
    );

    if (isProtectedRoute && !hasSession) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    const isAuthRoute = AUTH_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
    );

    if (isAuthRoute && hasSession) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
