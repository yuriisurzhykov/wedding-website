import type {AdminEmailSendInput} from "@features/admin-email-dispatch";
import type {
    EmailSenderCreateInput,
    EmailSenderUpdateInput,
} from "@features/admin-email-senders";
import type {EmailTemplateCreateInput, EmailTemplateUpdateInput} from "@features/admin-email-templates";

export type AdminEmailApiError = Readonly<{
    ok: false;
    status: number;
    data: unknown;
}>;

export type AdminEmailApiOk<T> = Readonly<{ok: true; data: T}>;

export async function fetchAdminEmailTemplates(): Promise<
    AdminEmailApiOk<{templates: unknown[]}> | AdminEmailApiError
> {
    const res = await fetch("/api/admin/email/templates", {
        credentials: "include",
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {ok: true, data: data as {templates: unknown[]}};
}

export async function postAdminEmailTemplate(
    body: EmailTemplateCreateInput,
): Promise<AdminEmailApiOk<{template: unknown}> | AdminEmailApiError> {
    const res = await fetch("/api/admin/email/templates", {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {ok: true, data: data as {template: unknown}};
}

export async function patchAdminEmailTemplate(
    id: string,
    body: EmailTemplateUpdateInput,
): Promise<AdminEmailApiOk<{template: unknown}> | AdminEmailApiError> {
    const res = await fetch(`/api/admin/email/templates/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {ok: true, data: data as {template: unknown}};
}

export async function deleteAdminEmailTemplate(
    id: string,
): Promise<AdminEmailApiOk<{ok: boolean}> | AdminEmailApiError> {
    const res = await fetch(`/api/admin/email/templates/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {ok: true, data: data as {ok: boolean}};
}

export async function postAdminEmailSend(
    body: AdminEmailSendInput,
): Promise<
    | AdminEmailApiOk<{
          ok: boolean;
          mode: string;
          sent: number;
          failed: number;
          capped_total?: number;
      }>
    | AdminEmailApiError
> {
    const res = await fetch("/api/admin/email/send", {
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
        data: data as {
            ok: boolean;
            mode: string;
            sent: number;
            failed: number;
            capped_total?: number;
        },
    };
}

export async function fetchAdminEmailSenders(): Promise<
    AdminEmailApiOk<{senders: unknown[]}> | AdminEmailApiError
> {
    const res = await fetch("/api/admin/email/senders", {
        credentials: "include",
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {ok: true, data: data as {senders: unknown[]}};
}

export async function postAdminEmailSender(
    body: EmailSenderCreateInput,
): Promise<AdminEmailApiOk<{sender: unknown}> | AdminEmailApiError> {
    const res = await fetch("/api/admin/email/senders", {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {ok: true, data: data as {sender: unknown}};
}

export async function patchAdminEmailSender(
    id: string,
    body: EmailSenderUpdateInput,
): Promise<AdminEmailApiOk<{sender: unknown}> | AdminEmailApiError> {
    const res = await fetch(`/api/admin/email/senders/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {ok: true, data: data as {sender: unknown}};
}

export async function deleteAdminEmailSender(
    id: string,
): Promise<AdminEmailApiOk<{ok: boolean}> | AdminEmailApiError> {
    const res = await fetch(`/api/admin/email/senders/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {ok: true, data: data as {ok: boolean}};
}

export async function fetchAdminEmailLog(): Promise<
    AdminEmailApiOk<{log: unknown[]}> | AdminEmailApiError
> {
    const res = await fetch("/api/admin/email/log?limit=80", {
        credentials: "include",
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        return {ok: false, status: res.status, data};
    }
    return {ok: true, data: data as {log: unknown[]}};
}
