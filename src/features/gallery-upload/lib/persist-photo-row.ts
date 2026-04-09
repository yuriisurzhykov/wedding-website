import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

export type PersistPhotoResult =
    | {ok: true; publicUrl: string}
    | {ok: false; message: string};

/**
 * Inserts a `photos` row after a successful R2 PUT (service-role client).
 */
export async function persistPhotoRow(
    supabase: SupabaseClient,
    input: {
        r2Key: string;
        uploaderName: string;
        publicUrl: string;
        sizeBytes?: number;
        rsvpId: string;
    },
): Promise<PersistPhotoResult> {
    const {error} = await supabase.from("photos").insert({
        r2_key: input.r2Key,
        uploader_name: input.uploaderName,
        public_url: input.publicUrl,
        size_bytes: input.sizeBytes ?? null,
        rsvp_id: input.rsvpId,
    });

    if (error) {
        return {ok: false, message: error.message};
    }

    return {ok: true, publicUrl: input.publicUrl};
}
