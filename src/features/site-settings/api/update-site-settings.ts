import 'server-only'

import {
    normalizeSiteSettingsRow,
    siteSettingsPatchSchema,
    siteSettingsSchema,
    type SiteSettings,
    type SiteSettingsPatch,
} from '@entities/site-settings'
import {createServerClient} from '@shared/api/supabase/server'
import {revalidateTag} from 'next/cache'

import {SITE_SETTINGS_CACHE_TAG} from './get-site-settings'

export type UpdateSiteSettingsResult =
    | {ok: true; settings: SiteSettings}
    | {ok: false; error: string}

function mergePatch(current: SiteSettings, patch: SiteSettingsPatch): SiteSettings {
    const next: SiteSettings = {
        ...current,
        capabilities: {...current.capabilities, ...patch.capabilities},
        schedule_program:
            patch.schedule_program !== undefined ? patch.schedule_program : current.schedule_program,
    }
    return next
}

/**
 * Persists a partial update to `site_settings` (service role). Validates patch, merges with the current row, then
 * revalidates the site-settings cache tag.
 *
 * Call only from trusted server code (e.g. authenticated admin API).
 */
export async function updateSiteSettings(patch: unknown): Promise<UpdateSiteSettingsResult> {
    const parsed = siteSettingsPatchSchema.safeParse(patch)
    if (!parsed.success) {
        return {ok: false, error: parsed.error.message}
    }

    try {
        const supabase = createServerClient()

        const {data: row, error: readError} = await supabase
            .from('site_settings')
            .select('id,updated_at,capabilities,schedule_program')
            .eq('id', 'default')
            .maybeSingle()

        if (readError) {
            return {ok: false, error: readError.message}
        }

        const current = normalizeSiteSettingsRow(row)
        const merged = mergePatch(current, parsed.data)

        const validated = siteSettingsSchema.safeParse({
            id: 'default',
            updated_at: current.updated_at,
            capabilities: merged.capabilities,
            schedule_program: merged.schedule_program,
        })
        if (!validated.success) {
            return {ok: false, error: validated.error.message}
        }

        const {data: updated, error: writeError} = await supabase
            .from('site_settings')
            .upsert(
                {
                    id: 'default',
                    capabilities: validated.data.capabilities,
                    schedule_program: validated.data.schedule_program,
                },
                {onConflict: 'id'},
            )
            .select('id,updated_at,capabilities,schedule_program')
            .single()

        if (writeError) {
            return {ok: false, error: writeError.message}
        }

        revalidateTag(SITE_SETTINGS_CACHE_TAG, 'max')

        const settings = normalizeSiteSettingsRow(updated)

        return {ok: true, settings}
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        return {ok: false, error: message}
    }
}
