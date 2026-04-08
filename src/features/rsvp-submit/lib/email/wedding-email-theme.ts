/**
 * Colours and typography for transactional RSVP HTML emails.
 * Keep hex values aligned with `app/globals.css` `@theme` (primary, surfaces, text, borders, fonts).
 */
export const WEDDING_EMAIL_THEME = {
    primary: "#C9A69A",
    primaryLight: "#E8D5CF",
    bgBase: "#FDFAF7",
    bgSection: "#F5F0E8",
    textPrimary: "#2C2420",
    textSecondary: "#6B5C54",
    border: "#E8DDD8",
    white: "#FFFFFF",
    /** Web fonts + safe fallbacks for clients that block remote fonts */
    fontDisplay: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
    fontBody: "'Lato', system-ui, -apple-system, Segoe UI, sans-serif",
} as const;

/** Google Fonts stylesheet for HTML emails (optional for clients). */
export const WEDDING_EMAIL_GOOGLE_FONTS_HREF =
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Lato:wght@400;700&display=swap";
