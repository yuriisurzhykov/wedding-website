import "server-only";

import {createServerClient} from "@shared/api/supabase/server";
import {assertR2UploadConfig} from "@shared/api/r2";

import {parseWishSubmitPayload} from "../lib/validate-wish-payload";
import {persistWishRow} from "../lib/persist-wish-row";

export type SubmitWishResult =
    | {ok: true}
    | {
          ok: false;
          kind: "validation";
          fieldErrors: Record<string, string[] | undefined>;
          formErrors: string[];
      }
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "database"; message: string};

/**
 * Validates JSON and inserts into `wishes` (service role). Optional `photoR2Key` must
 * refer to an object already uploaded under `photos/`; `photo_url` is derived from `R2_PUBLIC_URL`.
 */
export async function submitWish(rawBody: unknown): Promise<SubmitWishResult> {
    const parsed = parseWishSubmitPayload(rawBody);
    if (!parsed.ok) {
        const flat = parsed.error.flatten();
        return {
            ok: false,
            kind: "validation",
            fieldErrors: flat.fieldErrors,
            formErrors: flat.formErrors,
        };
    }

    const {authorName, message, photoR2Key} = parsed.data;

    let photoUrl: string | null = null;
    if (photoR2Key) {
        try {
            const {publicUrlBase} = assertR2UploadConfig();
            photoUrl = `${publicUrlBase}/${photoR2Key}`;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            return {ok: false, kind: "config", message: msg};
        }
    }

    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const saved = await persistWishRow(supabase, {
        authorName,
        message,
        photoR2Key: photoR2Key ?? null,
        photoUrl,
    });

    if (!saved.ok) {
        return {ok: false, kind: "database", message: saved.message};
    }

    return {ok: true};
}
