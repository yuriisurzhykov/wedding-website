import {NextResponse} from "next/server";

/** Extracts the token after "Bearer " (case-insensitive), trimmed. Returns empty string if absent or malformed. */
function parseBearerToken(auth: string | null): string {
    if (!auth) return "";
    const t = auth.trim();
    if (!/^Bearer\s+/i.test(t)) return "";
    return t.replace(/^Bearer\s+/i, "").trim();
}

/**
 * Verifies `Authorization: Bearer <secret>` against an expected secret.
 * Returns a 401/500 `NextResponse` if auth fails, or `null` if auth passes.
 *
 * Usage:
 *   const authError = assertBearer(request, process.env.ADMIN_SECRET, "ADMIN_SECRET");
 *   if (authError) return authError;
 */
export function assertBearer(
    request: Request,
    secret: string | undefined,
    envVarName: string,
): NextResponse | null {
    const expected = secret?.trim() ?? "";
    if (!expected) {
        return NextResponse.json(
            {ok: false, error: `${envVarName} is not configured`},
            {status: 500},
        );
    }
    const token = parseBearerToken(request.headers.get("authorization"));
    if (!token) {
        return NextResponse.json(
            {
                ok: false,
                error: "Missing credential",
                hint: `Set header: Authorization: Bearer <${envVarName}>`,
            },
            {status: 401},
        );
    }
    if (token !== expected) {
        return NextResponse.json(
            {ok: false, error: "Invalid secret"},
            {status: 401},
        );
    }
    return null;
}
