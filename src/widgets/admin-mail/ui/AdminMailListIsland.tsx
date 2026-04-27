"use client";

import {Link, usePathname} from "@/i18n/navigation";
import type {AdminInboundEmailListItem} from "@features/admin-inbox";
import {cn} from "@shared/lib/cn";
import {Button} from "@shared/ui/Button";
import {useTranslations} from "next-intl";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";

import {fetchAdminMailList} from "../lib/fetch-admin-mail-api";

function senderPrimary(row: AdminInboundEmailListItem): string {
    return row.from_name?.trim() || row.from_address;
}

const POLL_INTERVAL_MS = 60_000;

type Props = Readonly<{
    initialEmails: AdminInboundEmailListItem[];
    initialNextCursor: string | null;
}>;

function extractSelectedId(pathname: string): string | undefined {
    const m = pathname.match(/\/admin\/mail\/([0-9a-f-]{36})/i);
    return m?.[1];
}

export function AdminMailListIsland({initialEmails, initialNextCursor}: Props) {
    const t = useTranslations("admin.mail");
    const pathname = usePathname();
    const selectedId = extractSelectedId(pathname);

    const [emails, setEmails] = useState(initialEmails);
    const [nextCursor, setNextCursor] = useState(initialNextCursor);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setEmails(initialEmails);
        setNextCursor(initialNextCursor);
    }, [initialEmails, initialNextCursor]);

    const pollInFlight = useRef(false);

    const pollLatest = useCallback(async () => {
        if (pollInFlight.current) return;
        pollInFlight.current = true;
        try {
            const res = await fetchAdminMailList({limit: 50});
            if (res.ok) {
                setEmails(res.data.emails);
                setNextCursor(res.data.nextCursor);
            }
        } finally {
            pollInFlight.current = false;
        }
    }, []);

    useEffect(() => {
        if (typeof document === "undefined") return;
        let timer: ReturnType<typeof setInterval> | null = null;

        const stop = () => {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        };

        const tick = () => {
            if (document.visibilityState === "visible") {
                void pollLatest();
            }
        };

        const start = () => {
            stop();
            timer = setInterval(tick, POLL_INTERVAL_MS);
        };

        const onVisibility = () => {
            if (document.visibilityState === "visible") {
                void pollLatest();
                start();
            } else {
                stop();
            }
        };

        start();
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            stop();
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [pollLatest]);

    const loadMore = useCallback(async () => {
        if (!nextCursor || loading) {
            return;
        }
        setLoading(true);
        try {
            const res = await fetchAdminMailList({cursor: nextCursor});
            if (!res.ok) {
                return;
            }
            setEmails((prev) => [...prev, ...res.data.emails]);
            setNextCursor(res.data.nextCursor);
        } finally {
            setLoading(false);
        }
    }, [nextCursor, loading]);

    const sorted = useMemo(() => {
        return [...emails].sort((a, b) => {
            if (a.status === "unread" && b.status !== "unread") {
                return -1;
            }
            if (a.status !== "unread" && b.status === "unread") {
                return 1;
            }
            return new Date(b.received_at).getTime() - new Date(a.received_at).getTime();
        });
    }, [emails]);

    if (sorted.length === 0) {
        return <p className="p-3 text-body text-text-secondary">{t("list.empty")}</p>;
    }

    return (
        <div className="flex flex-col">
            <ul className="max-h-[min(70vh,560px)] divide-y divide-border overflow-y-auto">
                {sorted.map((row) => {
                    const active = row.id === selectedId;
                    const sender = senderPrimary(row);
                    const hasName = Boolean(row.from_name?.trim());
                    const subject = row.subject?.trim() || t("list.noSubject");
                    return (
                        <li key={row.id}>
                            <Link
                                href={`/admin/mail/${row.id}`}
                                className={cn(
                                    "block px-3 py-3 text-left transition-colors",
                                    active
                                        ? "bg-primary/10 text-text-primary"
                                        : "hover:bg-bg-section text-text-secondary",
                                    row.status === "unread" && "font-semibold text-text-primary",
                                )}
                            >
                                <span className="block truncate text-small leading-snug text-text-primary">
                                    {sender}
                                </span>
                                <span className="mt-1 block line-clamp-2 text-small leading-snug text-text-secondary">
                                    {subject}
                                </span>
                                {hasName ? (
                                    <span className="mt-1 block truncate text-caption text-text-muted">
                                        {row.from_address}
                                    </span>
                                ) : null}
                            </Link>
                        </li>
                    );
                })}
            </ul>
            {nextCursor ? (
                <div className="border-t border-border p-2">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        disabled={loading}
                        onClick={() => void loadMore()}
                    >
                        {loading ? t("list.loadMoreLoading") : t("list.loadMore")}
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
