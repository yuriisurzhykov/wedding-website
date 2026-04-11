import 'server-only'

import {
    normalizeSiteSettingsRow,
    SITE_FEATURE_KEYS,
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
        capabilities:
            patch.capabilities !== undefined
                ? {...current.capabilities, ...patch.capabilities}
                : current.capabilities,
        schedule_program:
            patch.schedule_program !== undefined ? patch.schedule_program : current.schedule_program,
    }
    return next
}

/**
 * Persists a partial update: `site_settings` row and `site_feature_states` rows (service role). Validates patch, merges
 * with the current snapshot, then revalidates the site-settings cache tag.
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

        const [siteRead, featuresRead] = await Promise.all([
            supabase
                .from('site_settings')
                .select('id,updated_at,schedule_program')
                .eq('id', 'default')
                .maybeSingle(),
            supabase.from('site_feature_states').select('feature_key,state'),
        ])

        if (siteRead.error) {
            return {ok: false, error: siteRead.error.message}
        }

        const current = normalizeSiteSettingsRow(siteRead.data, featuresRead.data ?? undefined)
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

        const featureUpserts = SITE_FEATURE_KEYS.map((feature_key) => ({
            feature_key,
            state: validated.data.capabilities[feature_key],
        }))

        const {error: settingsWriteError} = await supabase.from('site_settings').upsert(
            {
                id: 'default',
                schedule_program: validated.data.schedule_program,
            },
            {onConflict: 'id'},
        )

        if (settingsWriteError) {
            return {ok: false, error: settingsWriteError.message}
        }

        const {error: featuresWriteError} = await supabase
            .from('site_feature_states')
            .upsert(featureUpserts, {onConflict: 'feature_key'})

        if (featuresWriteError) {
            return {ok: false, error: featuresWriteError.message}
        }

        const [siteUpdated, featuresUpdated] = await Promise.all([
            supabase
                .from('site_settings')
                .select('id,updated_at,schedule_program')
                .eq('id', 'default')
                .single(),
            supabase.from('site_feature_states').select('feature_key,state'),
        ])

        if (siteUpdated.error) {
            return {ok: false, error: siteUpdated.error.message}
        }

        revalidateTag(SITE_SETTINGS_CACHE_TAG, 'max')

        const settings = normalizeSiteSettingsRow(siteUpdated.data, featuresUpdated.data ?? undefined)

        return {ok: true, settings}
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        return {ok: false, error: message}
    }
}
