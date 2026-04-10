"use client";

import {createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState,} from "react";

import type {GuestSessionClientSnapshot} from "../lib/client-snapshot";
import type {GuestSessionPublicErrorCode} from "../lib/guest-session-error";
import {parseGuestSessionPostJson} from "../lib/parse-guest-session-post-json";

export type GuestSessionStatus = "loading" | "anonymous" | "authenticated";

export type ApplyGuestSessionFromApiBody = (body: {
    sessionEstablished: boolean;
    session?: GuestSessionClientSnapshot;
}) => void;

export type GuestSessionRestoreResult =
    | { ok: true }
    | {
    ok: false;
    kind: "validation";
    fieldErrors: Record<string, string[] | undefined>;
    formErrors: string[];
}
    | {
    ok: false;
    kind: "guest_error";
    code: GuestSessionPublicErrorCode;
    retryAfterSec?: number;
};

type GuestSessionContextValue = {
    status: GuestSessionStatus;
    session: GuestSessionClientSnapshot | null;
    /** Merge §4 session fields from an API JSON body (e.g. `POST /api/rsvp` success). */
    applyFromApiBody: ApplyGuestSessionFromApiBody;
    /**
     * `POST /api/guest/session` with RSVP name + email; updates state from §4 JSON on success (plan §8.3).
     */
    restoreSession: (input: {
        name: string;
        email: string;
    }) => Promise<GuestSessionRestoreResult>;
};

const GuestSessionContext = createContext<GuestSessionContextValue | null>(null);

/**
 * Hydrates guest session from `GET /api/guest/session` and allows instant UI updates from
 * successful `POST /api/rsvp` / restore responses without a second round-trip (plan §3.3, §4).
 */
export function GuestSessionProvider({children}: { children: ReactNode }) {
    const [status, setStatus] = useState<GuestSessionStatus>("loading");
    const [session, setSession] = useState<GuestSessionClientSnapshot | null>(null);

    const applyFromApiBody: ApplyGuestSessionFromApiBody = useCallback((body) => {
        if (body.sessionEstablished && body.session) {
            setSession(body.session);
            setStatus("authenticated");
        } else {
            setSession(null);
            setStatus("anonymous");
        }
    }, []);

    const restoreSession = useCallback(
        async (input: { name: string; email: string }): Promise<GuestSessionRestoreResult> => {
            let res: Response;
            try {
                res = await fetch("/api/guest/session", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    credentials: "same-origin",
                    body: JSON.stringify({
                        name: input.name.trim(),
                        email: input.email.trim(),
                    }),
                });
            } catch {
                return {ok: false, kind: "guest_error", code: "request_failed"};
            }

            const data: unknown = await res.json().catch(() => null);
            const parsed = parseGuestSessionPostJson(data);

            if (res.ok && parsed.kind === "success") {
                applyFromApiBody({
                    sessionEstablished: true,
                    session: parsed.body.session,
                });
                return {ok: true};
            }

            if (parsed.kind === "validation") {
                return {
                    ok: false,
                    kind: "validation",
                    fieldErrors: parsed.body.fieldErrors,
                    formErrors: parsed.body.formErrors,
                };
            }

            if (parsed.kind === "guest_error") {
                return {
                    ok: false,
                    kind: "guest_error",
                    code: parsed.body.error.code,
                    retryAfterSec: parsed.body.error.retryAfterSec,
                };
            }

            return {ok: false, kind: "guest_error", code: "server_error"};
        },
        [applyFromApiBody],
    );

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const res = await fetch("/api/guest/session", {credentials: "same-origin"});
                const data: unknown = await res.json().catch(() => null);
                if (cancelled) {
                    return;
                }
                if (
                    res.ok &&
                    data &&
                    typeof data === "object" && (data as {
                        sessionEstablished?: boolean
                    }).sessionEstablished && (data as { session?: GuestSessionClientSnapshot }).session &&
                    typeof (data as { session: { displayName?: unknown } }).session.displayName ===
                    "string" &&
                    typeof (data as { session: { attending?: unknown } }).session.attending ===
                    "boolean"
                ) {
                    applyFromApiBody({
                        sessionEstablished: true,
                        session: (data as { session: GuestSessionClientSnapshot }).session,
                    });
                    return;
                }
                setSession(null);
                setStatus("anonymous");
            } catch {
                if (!cancelled) {
                    setSession(null);
                    setStatus("anonymous");
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [applyFromApiBody]);

    const value = useMemo(
        () => ({status, session, applyFromApiBody, restoreSession}),
        [status, session, applyFromApiBody, restoreSession],
    );

    return (
        <GuestSessionContext.Provider value={value}>{children}</GuestSessionContext.Provider>
    );
}

export function useGuestSession(): GuestSessionContextValue {
    const ctx = useContext(GuestSessionContext);
    if (!ctx) {
        throw new Error("useGuestSession must be used within GuestSessionProvider");
    }
    return ctx;
}
