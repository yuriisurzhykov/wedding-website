import 'server-only'

import {
    mergePublicContactDbColumns,
    normalizeSiteSettingsRow,
    resolvePublicContactFromDb,
    SITE_FEATURE_KEYS,
    siteSettingsPatchSchema,
    siteSettingsSchema,
    type PublicContactDbRow,
    type SiteSettings,
    type SiteSettingsPatch,
} from '@entities/site-settings'
import {createServerClient} from '@shared/api/supabase/server'
import {revalidateTag} from 'next/cache'

import {SITE_SETTINGS_CACHE_TAG} from './get-site-settings'

export type UpdateSiteSettingsResult =
    | {ok: true; settings: SiteSettings}
    | {ok: false; error: string}

function mergeSnapshot(
    current: SiteSettings,
    patch: SiteSettingsPatch,
    rawContact: PublicContactDbRow,
): SiteSettings {
    const capabilities =
        patch.capabilities !== undefined
            ? {...current.capabilities, ...patch.capabilities}
            : current.capabilities
    const mergedColumns: PublicContactDbRow =
        patch.public_contact !== undefined
            ? mergePublicContactDbColumns(rawContact, patch.public_contact)
            : rawContact
    return {
        ...current,
        capabilities,
        public_contact: resolvePublicContactFromDb(mergedColumns),
    }
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
                .select('id,updated_at,public_contact_phone,public_contact_email')
                .eq('id', 'default')
                .maybeSingle(),
            supabase.from('site_feature_states').select('feature_key,state'),
        ])

        if (siteRead.error) {
            return {ok: false, error: siteRead.error.message}
        }

        const rawContact: PublicContactDbRow = {
            public_contact_phone: siteRead.data?.public_contact_phone,
            public_contact_email: siteRead.data?.public_contact_email,
        }

        const current = normalizeSiteSettingsRow(siteRead.data, featuresRead.data ?? undefined)
        const merged = mergeSnapshot(current, parsed.data, rawContact)

        const validated = siteSettingsSchema.safeParse({
            id: 'default',
            updated_at: current.updated_at,
            capabilities: merged.capabilities,
            public_contact: merged.public_contact,
        })
        if (!validated.success) {
            return {ok: false, error: validated.error.message}
        }

        const featureUpserts = SITE_FEATURE_KEYS.map((feature_key) => ({
            feature_key,
            state: validated.data.capabilities[feature_key],
        }))

        const nextPublicContactColumns =
            parsed.data.public_contact !== undefined
                ? mergePublicContactDbColumns(rawContact, parsed.data.public_contact)
                : undefined

        const settingsUpdate: {
            updated_at: string
            public_contact_phone?: string | null
            public_contact_email?: string | null
        } = {
            updated_at: new Date().toISOString(),
        }
        if (nextPublicContactColumns !== undefined) {
            settingsUpdate.public_contact_phone = nextPublicContactColumns.public_contact_phone
            settingsUpdate.public_contact_email = nextPublicContactColumns.public_contact_email
        }

        const {error: settingsWriteError} = await supabase
            .from('site_settings')
            .update(settingsUpdate)
            .eq('id', 'default')

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
                .select('id,updated_at,public_contact_phone,public_contact_email')
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
