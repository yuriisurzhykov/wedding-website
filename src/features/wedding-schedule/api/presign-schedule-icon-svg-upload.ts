import "server-only";

import {createPresignedScheduleIconSvgPutUrl} from "@shared/api/r2";

import {
    parseScheduleIconSvgPresignBody,
} from "../lib/validate-schedule-icon-svg-presign-payload";

export type PresignScheduleIconSvgUploadResult =
    | {ok: true; url: string; key: string; publicUrl: string}
    | {
          ok: false;
          kind: "validation";
          fieldErrors: Record<string, string[] | undefined>;
          formErrors: string[];
      }
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "r2"; message: string};

/**
 * Admin-only presign for uploading a schedule row icon as SVG to R2.
 * Browser sends `PUT` with body bytes and `Content-Type: image/svg+xml`.
 */
export async function presignScheduleIconSvgUpload(
    rawBody: unknown,
): Promise<PresignScheduleIconSvgUploadResult> {
    const parsed = parseScheduleIconSvgPresignBody(rawBody);
    if (!parsed.ok) {
        const flat = parsed.error.flatten();
        return {
            ok: false,
            kind: "validation",
            fieldErrors: flat.fieldErrors,
            formErrors: flat.formErrors,
        };
    }

    try {
        return {ok: true, ...(await createPresignedScheduleIconSvgPutUrl())};
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (
            message.includes("R2:") ||
            message.includes("R2_ACCOUNT") ||
            message.includes("R2_PUBLIC_URL")
        ) {
            return {ok: false, kind: "config", message};
        }
        return {ok: false, kind: "r2", message};
    }
}
