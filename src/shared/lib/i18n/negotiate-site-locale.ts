import {NextRequest} from "next/server";

/**
 * First-visit locale for `ru` | `en` is driven by the browser’s `Accept-Language`
 * (aligned with the user’s OS / browser language list), not by `defaultLocale` alone.
 *
 * next-intl does not map `uk` → `ru`; we treat `uk` like Russian for this site.
 * `defaultLocale` in routing remains only for URL shape (`as-needed`) and for cases
 * where the header is missing or lists no `ru`/`uk`/`en` preference.
 */

type LangCandidate = {subtag: string; order: number; q: number};

function parseAcceptLanguageParts(header: string): LangCandidate[] {
    const out: LangCandidate[] = [];
    let order = 0;

    for (const rawPart of header.split(",")) {
        const part = rawPart.trim();
        if (!part) {
            continue;
        }

        const [langRange, ...params] = part.split(";").map((s) => s.trim());
        if (!langRange) {
            continue;
        }

        const primary = langRange.split("-")[0]?.toLowerCase() ?? "";
        if (!primary || primary === "*") {
            continue;
        }

        let q = 1;
        for (const p of params) {
            const m = /^q\s*=\s*([\d.]+)/i.exec(p);
            if (m) {
                const parsed = Number.parseFloat(m[1]);
                if (!Number.isNaN(parsed)) {
                    q = Math.min(1, Math.max(0, parsed));
                }
                break;
            }
        }

        out.push({subtag: primary, order, q});
        order += 1;
    }

    return out;
}

function sortCandidatesByPreference(candidates: LangCandidate[]): LangCandidate[] {
    return [...candidates].sort((a, b) => {
        if (b.q !== a.q) {
            return b.q - a.q;
        }
        return a.order - b.order;
    });
}

/**
 * Compares only `ru`/`uk` vs `en` entries (ignores unsupported languages like `de`).
 * OS locale does not reach the server; the browser sends this list (often aligned
 * with its UI language order). When `q` is equal for Russian and English, prefer
 * Russian — typical for RU/UA guests whose Chrome lists both with the same weight.
 */
function resolveRuVsEnFromCandidates(
    candidates: LangCandidate[],
): "ru" | "en" | null {
    const russian = candidates.filter(
        (c) => c.subtag === "ru" || c.subtag === "uk",
    );
    const english = candidates.filter((c) => c.subtag === "en");
    const bestRu = russian.length ? sortCandidatesByPreference(russian)[0] : null;
    const bestEn = english.length ? sortCandidatesByPreference(english)[0] : null;

    if (!bestRu && !bestEn) {
        return null;
    }
    if (!bestRu) {
        return "en";
    }
    if (!bestEn) {
        return "ru";
    }
    if (bestRu.q > bestEn.q) {
        return "ru";
    }
    if (bestEn.q > bestRu.q) {
        return "en";
    }
    return "ru";
}

/**
 * Picks `ru` or `en` from `Accept-Language` by comparing Russian-group vs English
 * preferences (not “first unrelated language in the list”).
 */
export function resolvePreferredSiteLocaleFromAcceptLanguage(
    acceptLanguage: string | null,
): "ru" | "en" | null {
    if (acceptLanguage == null) {
        return null;
    }
    const trimmed = acceptLanguage.trim();
    if (!trimmed) {
        return null;
    }

    const candidates = parseAcceptLanguageParts(trimmed);
    return resolveRuVsEnFromCandidates(candidates);
}

/**
 * Rewrites `accept-language` to `ru;q=1` or `en;q=1` when the header negotiates
 * a clear preference among our locales. Otherwise leaves the request unchanged so
 * next-intl can fall back to `defaultLocale` (e.g. empty header or only `de`).
 */
export function applySiteLocaleHintToRequest(request: NextRequest): NextRequest {
    const header = request.headers.get("accept-language");
    const site = resolvePreferredSiteLocaleFromAcceptLanguage(header);
    if (site === null) {
        return request;
    }

    const headers = new Headers(request.headers);
    headers.set("accept-language", site === "ru" ? "ru;q=1" : "en;q=1");

    return new NextRequest(request.url, {
        headers,
        method: request.method,
    });
}

/** next-intl default; must stay in sync with {@link https://next-intl.dev/docs/routing/configuration#locale-cookie} */
export const NEXT_INTL_LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Path with a leading `/{locale}` segment for `localePrefix: 'as-needed'` when the
 * resolved locale is Russian (visible URL prefix).
 */
export function pathWithRussianLocalePrefix(pathname: string): string {
    if (pathname === "/" || pathname === "") {
        return "/ru";
    }
    return `/ru${pathname}`;
}
