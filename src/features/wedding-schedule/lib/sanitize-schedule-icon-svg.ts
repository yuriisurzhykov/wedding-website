import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitizes inline SVG for `schedule_items.icon_svg_inline` before INSERT/UPDATE.
 * Strips scripts and non-SVG content; call only on the server in the replace use case.
 */
export function sanitizeScheduleIconSvgInline(raw: string): string {
    const trimmed = raw.trim()
    if (!trimmed) {
        return ''
    }
    return DOMPurify.sanitize(trimmed, {
        USE_PROFILES: {svg: true, svgFilters: true},
    }).trim()
}
