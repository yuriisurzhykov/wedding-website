import createMiddleware from "next-intl/middleware";
import {type NextRequest, NextResponse} from "next/server";

import {readAdminSessionTokenFromCookieHeader, verifyAdminSessionJwt,} from "@features/admin-api/lib/admin-session-jwt";
import {
    applySiteLocaleHintToRequest,
    NEXT_INTL_LOCALE_COOKIE,
    pathWithRussianLocalePrefix,
    resolvePreferredSiteLocaleFromAcceptLanguage,
} from "@shared/lib/i18n/negotiate-site-locale";
import {routing} from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function pathnameHasLocalePrefix(pathname: string): boolean {
    const first = pathname.split("/").filter(Boolean)[0];
    return first === "ru" || first === "en";
}

/**
 * next-intl prioritizes `NEXT_LOCALE` over `Accept-Language`, so a stale cookie
 * blocks negotiation. When there is **no** locale cookie yet, we redirect unprefixed
 * URLs straight to `/ru/...` if the header resolves to Russian — no reliance on
 * cloning `NextRequest` for that case.
 */
function redirectToRussianIfFirstVisit(request: NextRequest): NextResponse | null {
    if (pathnameHasLocalePrefix(request.nextUrl.pathname)) {
        return null;
    }
    if (request.cookies.get(NEXT_INTL_LOCALE_COOKIE)?.value) {
        return null;
    }
    if (
        resolvePreferredSiteLocaleFromAcceptLanguage(
            request.headers.get("accept-language"),
        ) !== "ru"
    ) {
        return null;
    }
    const url = request.nextUrl.clone();
    url.pathname = pathWithRussianLocalePrefix(request.nextUrl.pathname);
    return NextResponse.redirect(url);
}

function runIntlMiddleware(request: NextRequest) {
    return intlMiddleware(applySiteLocaleHintToRequest(request));
}

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

    if (process.env.DEBUG_I18N_NEGOTIATION === "1") {
        const al = request.headers.get("accept-language");
        console.log("[i18n]", {
            pathname,
            acceptLanguage: al,
            resolved: resolvePreferredSiteLocaleFromAcceptLanguage(al),
            nextLocaleCookie: request.cookies.get(NEXT_INTL_LOCALE_COOKIE)?.value ?? null,
        });
    }

    if (pathname.startsWith("/api/admin")) {
        return NextResponse.next();
    }

    const russianFirst = redirectToRussianIfFirstVisit(request);
    if (russianFirst) {
        return russianFirst;
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
            return runIntlMiddleware(request);
        }
        const raw = readAdminSessionTokenFromCookieHeader(
            request.headers.get("cookie"),
        );
        const allowed = raw ? await verifyAdminSessionJwt(raw) : false;
        if (!allowed) {
            return NextResponse.redirect(buildAdminLoginUrl(request));
        }
    }

    return runIntlMiddleware(request);
}

export const config = {
    matcher: [
        "/((?!api|_next|_vercel|.*\\..*).*)",
        "/api/admin/:path*",
    ],
};
