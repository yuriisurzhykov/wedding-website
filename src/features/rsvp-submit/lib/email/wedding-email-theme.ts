/**
 * Colours and typography for transactional RSVP HTML emails.
 * Aligned with the guest confirmation DB template (sage CTA, warm paper surfaces).
 */
export const WEDDING_EMAIL_THEME = {
    primary: "#758461",
    primaryLight: "#E8E6D8",
    bgBase: "#F5F0E7",
    bgSection: "#FCF9F4",
    textPrimary: "#404040",
    textSecondary: "#70645C",
    border: "#DDD4CB",
    white: "#FFFFFF",
    /** Web fonts + safe fallbacks for clients that block remote fonts */
    fontDisplay: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
    fontBody: "'Lato', system-ui, -apple-system, Segoe UI, sans-serif",
} as const;

/** Google Fonts stylesheet for HTML emails (optional for clients). */
export const WEDDING_EMAIL_GOOGLE_FONTS_HREF =
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Great+Vibes&family=Lato:wght@300;400;700&display=swap";
