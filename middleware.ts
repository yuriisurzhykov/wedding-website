import createMiddleware from "next-intl/middleware";
import {type NextRequest, NextResponse} from "next/server";

import {readAdminSessionTokenFromCookieHeader, verifyAdminSessionJwt,} from "@features/admin-api/lib/admin-session-jwt";
import {routing} from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function isAdminUiPath(pathname: string): boolean {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
        return true;
    }
    return pathname.startsWith("/ru/admin") || pathname.startsWith("/en/admin");
}

function isAdminLoginPath(pathname: string): boolean {
    return pathname === "/admin/login" ||
        pathname === "/ru/admin/login" ||
        pathname === "/en/admin/login";
}

function buildAdminLoginUrl(request: NextRequest): URL {
    const url = request.nextUrl.clone();
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith("/ru/") || pathname === "/ru") {
        url.pathname = "/ru/admin/login";
    } else {
        url.pathname = "/admin/login";
    }
    url.search = "";
    return url;
}

/** Admin home when already signed in — matches client redirect after login (ru → `/ru/admin`, else `/admin`). */
function buildAdminDashboardUrl(request: NextRequest): URL {
    const url = request.nextUrl.clone();
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith("/ru/") || pathname === "/ru") {
        url.pathname = "/ru/admin";
    } else {
        url.pathname = "/admin";
    }
    url.search = "";
    return url;
}

export default async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith("/api/admin")) {
        return NextResponse.next();
    }

    if (isAdminUiPath(pathname)) {
        if (isAdminLoginPath(pathname)) {
            const raw = readAdminSessionTokenFromCookieHeader(
                request.headers.get("cookie"),
            );
            const allowed = raw ? await verifyAdminSessionJwt(raw) : false;
            if (allowed) {
                return NextResponse.redirect(buildAdminDashboardUrl(request));
            }
            return intlMiddleware(request);
        }
        const raw = readAdminSessionTokenFromCookieHeader(
            request.headers.get("cookie"),
        );
        const allowed = raw ? await verifyAdminSessionJwt(raw) : false;
        if (!allowed) {
            return NextResponse.redirect(buildAdminLoginUrl(request));
        }
    }

    return intlMiddleware(request);
}

export const config = {
    matcher: [
        "/((?!api|_next|_vercel|.*\\..*).*)",
        "/api/admin/:path*",
    ],
};
