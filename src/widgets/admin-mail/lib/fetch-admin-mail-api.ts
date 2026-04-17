import type {InboundEmailAttachmentRow, InboundEmailRow, ReplyTemplateRow} from "@entities/inbound-email";
import type {AdminInboundEmailListItem} from "@features/admin-inbox";
import type {ReplyTemplateCreateInput, ReplyTemplateUpdateInput} from "@features/admin-reply-templates";

export type AdminMailApiError = Readonly<{
    ok: false;
    status: number;
    data: unknown;
}>;

export type AdminMailApiOk<T> = Readonly<{ok: true; data: T}>;

function readErrorMessage(data: unknown, fallback: string): string {
    if (
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as {error: unknown}).error === "string"
    ) {
        return (data as {error: string}).error;
    }
    return fallback;
}

export function getAdminMailErrorMessage(data: unknown, fallback: string): string {
    return readErrorMessage(data, fallback);
}

export async function fetchAdminMailList(args?: {
    cursor?: string | null;
    limit?: number;
}): Promise<
    | AdminMailApiOk<{emails: AdminInboundEmailListItem[]; nextCursor: string | null}>
    | AdminMailApiError
> {
    const params = new URLSearchParams();
    if (args?.cursor) {
        params.set("cursor", args.cursor);
    }
    if (args?.limit != null) {
        params.set("limit", String(args.limit));
    }
    const q = params.toString();
    const res = await fetch(`/api/admin/mail${q ? `?${q}` : ""}`, {
        credentials: "include",
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {
        ok: true,
        data: data as {emails: AdminInboundEmailListItem[]; nextCursor: string | null},
    };
}

export async function fetchAdminMailDetail(
    id: string,
): Promise<
    AdminMailApiOk<{email: InboundEmailRow; attachments: InboundEmailAttachmentRow[]}> | AdminMailApiError
> {
    const res = await fetch(`/api/admin/mail/${encodeURIComponent(id)}`, {
        credentials: "include",
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {
        ok: true,
        data: data as {email: InboundEmailRow; attachments: InboundEmailAttachmentRow[]},
    };
}

export async function patchAdminMailStatus(
    id: string,
    status: "unread" | "read" | "archived",
): Promise<AdminMailApiOk<{ok: boolean; status: string}> | AdminMailApiError> {
    const res = await fetch(`/api/admin/mail/${encodeURIComponent(id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({status}),
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {ok: true, data: data as {ok: boolean; status: string}};
}

export async function deleteAdminMail(id: string): Promise<AdminMailApiOk<{ok: boolean}> | AdminMailApiError> {
    const res = await fetch(`/api/admin/mail/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {ok: true, data: data as {ok: boolean}};
}

export async function postAdminMailReply(
    id: string,
    body: {
        template_id?: string | null;
        subject?: string;
        heading: string;
        body_html: string;
    },
): Promise<
    | AdminMailApiOk<{ok: boolean; reply_id: string; resend_email_id: string | null}>
    | AdminMailApiError
> {
    const res = await fetch(`/api/admin/mail/${encodeURIComponent(id)}/reply`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {
        ok: true,
        data: data as {ok: boolean; reply_id: string; resend_email_id: string | null},
    };
}

export async function fetchAdminReplyTemplates(): Promise<
    AdminMailApiOk<{templates: ReplyTemplateRow[]}> | AdminMailApiError
> {
    const res = await fetch("/api/admin/mail/templates", {
        credentials: "include",
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {ok: true, data: data as {templates: ReplyTemplateRow[]}};
}

export async function postAdminReplyTemplate(
    body: ReplyTemplateCreateInput,
): Promise<AdminMailApiOk<{template: ReplyTemplateRow}> | AdminMailApiError> {
    const res = await fetch("/api/admin/mail/templates", {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {ok: true, data: data as {template: ReplyTemplateRow}};
}

export async function patchAdminReplyTemplate(
    id: string,
    body: ReplyTemplateUpdateInput,
): Promise<AdminMailApiOk<{template: ReplyTemplateRow}> | AdminMailApiError> {
    const res = await fetch(`/api/admin/mail/templates/${encodeURIComponent(id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {ok: true, data: data as {template: ReplyTemplateRow}};
}

export async function deleteAdminReplyTemplate(
    id: string,
): Promise<AdminMailApiOk<{ok: boolean}> | AdminMailApiError> {
    const res = await fetch(`/api/admin/mail/templates/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {ok: true, data: data as {ok: boolean}};
}

export async function fetchAdminMailWebhookStatus(): Promise<
    AdminMailApiOk<{
        status: {
            webhookId: string | null;
            endpointUrl: string | null;
            signingSecretPresent: boolean;
            filterEmail: string | null;
            lastSyncedAt: string | null;
            lastSyncError: string | null;
        };
    }>
    | AdminMailApiError
> {
    const res = await fetch("/api/admin/mail/webhook-sync", {
        credentials: "include",
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {
        ok: true,
        data: data as {
            status: {
                webhookId: string | null;
                endpointUrl: string | null;
                signingSecretPresent: boolean;
                filterEmail: string | null;
                lastSyncedAt: string | null;
                lastSyncError: string | null;
            };
        },
    };
}

export async function postAdminMailWebhookSync(): Promise<AdminMailApiOk<{ok: boolean}> | AdminMailApiError> {
    const res = await fetch("/api/admin/mail/webhook-sync", {
        method: "POST",
        credentials: "include",
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {ok: true, data: data as {ok: boolean}};
}
