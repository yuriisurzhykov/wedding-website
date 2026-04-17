import "server-only";

import {createServerClient} from "@shared/api/supabase/server";

export type WebhookSubscriptionStatus = {
    webhookId: string | null;
    endpointUrl: string | null;
    /** True when a signing secret is stored (value is never returned). */
    signingSecretPresent: boolean;
    filterEmail: string | null;
    lastSyncedAt: string | null;
    lastSyncError: string | null;
};

export type GetWebhookSubscriptionStatusResult =
    | { ok: true; status: WebhookSubscriptionStatus }
    | { ok: false; error: string };

/**
 * Reads the singleton `resend_webhook_subscription` row (service role). Safe for admin UI; does not expose the signing
 * secret.
 */
export async function getWebhookSubscriptionStatus(): Promise<GetWebhookSubscriptionStatusResult> {
    try {
        const supabase = createServerClient();
        const {data, error} = await supabase
            .from("resend_webhook_subscription")
            .select(
                "webhook_id, endpoint_url, signing_secret, filter_email, last_synced_at, last_sync_error",
            )
            .eq("id", "default")
            .maybeSingle();

        if (error) {
            return {ok: false, error: error.message};
        }

        if (!data) {
            return {
                ok: true,
                status: {
                    webhookId: null,
                    endpointUrl: null,
                    signingSecretPresent: false,
                    filterEmail: null,
                    lastSyncedAt: null,
                    lastSyncError: null,
                },
            };
        }

        const signing = data.signing_secret?.trim();

        return {
            ok: true,
            status: {
                webhookId: data.webhook_id?.trim() || null,
                endpointUrl: data.endpoint_url?.trim() || null,
                signingSecretPresent: Boolean(signing),
                filterEmail: data.filter_email?.trim() || null,
                lastSyncedAt: data.last_synced_at ?? null,
                lastSyncError: data.last_sync_error?.trim() || null,
            },
        };
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, error: message};
    }
}
