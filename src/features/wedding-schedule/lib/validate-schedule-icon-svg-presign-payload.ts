import "server-only";

import {SCHEDULE_ICON_SVG_UPLOAD_MAX_BYTES} from "@entities/wedding-schedule";
import {z} from "zod";

export const scheduleIconSvgPresignBodySchema = z
    .object({
        size: z
            .number()
            .int()
            .positive()
            .max(
                SCHEDULE_ICON_SVG_UPLOAD_MAX_BYTES,
                "SVG too large for schedule icon upload",
            ),
    })
    .strict()

export type ScheduleIconSvgPresignBody = z.infer<typeof scheduleIconSvgPresignBodySchema>

export function parseScheduleIconSvgPresignBody(
    raw: unknown,
):
    | {ok: true; data: ScheduleIconSvgPresignBody}
    | {ok: false; error: z.ZodError} {
    const result = scheduleIconSvgPresignBodySchema.safeParse(raw)
    if (!result.success) {
        return {ok: false, error: result.error}
    }
    return {ok: true, data: result.data}
}
