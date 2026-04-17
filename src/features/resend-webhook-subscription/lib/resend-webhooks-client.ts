import "server-only";

const RESEND_API_BASE = "https://api.resend.com";

/** Subscribes the app to Resend inbound (`email.received`) deliveries. */
export const RESEND_INBOUND_WEBHOOK_EVENTS = ["email.received"] as const;

export type ResendWebhookRecord = {
    object: "webhook";
    id: string;
    created_at?: string;
    status: "enabled" | "disabled";
    endpoint: string;
    events: string[];
    signing_secret?: string;
};

type ResendWebhookListResponse = {
    object: "list";
    has_more?: boolean;
    data: Array<{
        id: string;
        created_at?: string;
        status: "enabled" | "disabled";
        endpoint: string;
        events: string[];
    }>;
};

type ResendErrorBody = {
    message?: string;
    name?: string;
};

function parseJson(raw: string): unknown {
    if (!raw) {
        return null;
    }
    try {
        return JSON.parse(raw) as unknown;
    } catch {
        return null;
    }
}

function errorMessageFromBody(json: unknown, fallback: string): string {
    if (json && typeof json === "object" && "message" in json) {
        const m = (json as ResendErrorBody).message;
        if (typeof m === "string" && m.trim()) {
            return m.trim();
        }
    }
    return fallback;
}

export type ResendWebhooksClientResult<T> =
    | { ok: true; data: T }
    | { ok: false; status: number; message: string };

async function request<T>(
    apiKey: string,
    path: string,
    init?: RequestInit,
): Promise<ResendWebhooksClientResult<T>> {
    const res = await fetch(`${RESEND_API_BASE}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            ...init?.headers,
        },
    });

    const text = await res.text();
    const json = parseJson(text);

    if (!res.ok) {
        return {
            ok: false,
            status: res.status,
            message: errorMessageFromBody(json, res.statusText || "Resend API error"),
        };
    }

    return {ok: true, data: json as T};
}

export function createResendWebhooksClient(apiKey: string) {
    return {
        listWebhooks(): Promise<ResendWebhooksClientResult<ResendWebhookListResponse>> {
            return request(apiKey, "/webhooks", {method: "GET"});
        },

        getWebhook(webhookId: string): Promise<ResendWebhooksClientResult<ResendWebhookRecord>> {
            return request(apiKey, `/webhooks/${encodeURIComponent(webhookId)}`, {method: "GET"});
        },

        createWebhook(body: {
            endpoint: string;
            events: readonly string[];
        }): Promise<ResendWebhooksClientResult<ResendWebhookRecord>> {
            return request(apiKey, "/webhooks", {
                method: "POST",
                body: JSON.stringify({
                    endpoint: body.endpoint,
                    events: [...body.events],
                }),
            });
        },

        updateWebhook(
            webhookId: string,
            body: {
                endpoint?: string;
                events?: string[];
                status?: "enabled" | "disabled";
            },
        ): Promise<ResendWebhooksClientResult<ResendWebhookRecord>> {
            return request(apiKey, `/webhooks/${encodeURIComponent(webhookId)}`, {
                method: "PATCH",
                body: JSON.stringify(body),
            });
        },
    };
}

export type ResendWebhooksClient = ReturnType<typeof createResendWebhooksClient>;
