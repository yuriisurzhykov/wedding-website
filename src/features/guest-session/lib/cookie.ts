import "server-only";

import type {GuestSessionRuntimeConfig} from "./get-guest-session-config";
import {getGuestSessionRuntimeConfig} from "./get-guest-session-config";

export type GuestSessionCookieDescriptor = {
    name: string;
    value: string;
    options: {
        httpOnly: true;
        secure: boolean;
        sameSite: "lax" | "strict" | "none";
        path: string;
        maxAge: number;
    };
};

/**
 * Extracts the opaque session token from a `Cookie` header value, or `null`.
 */
export function extractGuestSessionTokenFromCookieHeader(
    cookieHeader: string | null | undefined,
    cookieName: string,
): string | null {
    if (!cookieHeader) {
        return null;
    }
    const parts = cookieHeader.split(";").map((s) => s.trim());
    const prefix = `${cookieName}=`;
    for (const part of parts) {
        if (part.startsWith(prefix)) {
            const raw = part.slice(prefix.length);
            try {
                return decodeURIComponent(raw);
            } catch {
                return raw;
            }
        }
    }
    return null;
}

/**
 * Reads the guest session token from a Request (e.g. Route Handler `request.headers`).
 */
export function extractGuestSessionTokenFromRequest(
    request: Pick<Request, "headers">,
    config: Pick<GuestSessionRuntimeConfig, "cookieName"> = getGuestSessionRuntimeConfig(),
): string | null {
    return extractGuestSessionTokenFromCookieHeader(
        request.headers.get("cookie"),
        config.cookieName,
    );
}

/**
 * Descriptor for `NextResponse.cookies.set` / `cookies().set` — sets the HttpOnly session cookie.
 */
export function getGuestSessionCookieDescriptor(
    rawToken: string,
    config: GuestSessionRuntimeConfig = getGuestSessionRuntimeConfig(),
): GuestSessionCookieDescriptor {
    return {
        name: config.cookieName,
        value: rawToken,
        options: {
            httpOnly: true,
            secure: config.secure,
            sameSite: config.sameSite,
            path: "/",
            maxAge: config.maxAgeSec,
        },
    };
}

/**
 * Clears the guest session cookie (e.g. sign-out).
 */
export function getClearGuestSessionCookieDescriptor(
    config: Pick<GuestSessionRuntimeConfig, "cookieName" | "secure" | "sameSite"> = getGuestSessionRuntimeConfig(),
): GuestSessionCookieDescriptor {
    return {
        name: config.cookieName,
        value: "",
        options: {
            httpOnly: true,
            secure: config.secure,
            sameSite: config.sameSite,
            path: "/",
            maxAge: 0,
        },
    };
}
