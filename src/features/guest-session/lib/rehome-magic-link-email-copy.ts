/** Locale for companion rehome transactional mail; aligns with `GET /api/guest/claim?locale=`. */
export type GuestRehomeEmailLocale = "en" | "ru";

type Copy = {
    subject: string;
    greeting: (displayName: string) => string;
    lead: string;
    magicLinkIntro: string;
    magicLinkButton: string;
    signOff: string;
};

const COPY: Record<GuestRehomeEmailLocale, Copy> = {
    en: {
        subject: "Sign in to the wedding site",
        greeting: (displayName) => `Hello, ${displayName}!`,
        lead: "Use the button below to open the site on this device. The link is personal to you.",
        magicLinkIntro:
            "If someone else submitted the RSVP for your party, this link signs you in with your own email — no need to enter your name again.",
        magicLinkButton: "Open the site as a guest",
        signOff: "With love,\nYurii & Mariia",
    },
    ru: {
        subject: "Вход на свадебный сайт",
        greeting: (displayName) => `Здравствуйте, ${displayName}!`,
        lead: "Нажмите кнопку ниже, чтобы открыть сайт на этом устройстве. Ссылка предназначена только для вас.",
        magicLinkIntro:
            "Если RSVP за вашу компанию отправил кто-то другой, эта ссылка войдёт за вас с вашим email — вводить имя снова не нужно.",
        magicLinkButton: "Открыть сайт как гость",
        signOff: "С любовью,\nЮрий и Мария",
    },
};

export function getGuestRehomeMagicLinkCopy(locale: GuestRehomeEmailLocale): Copy {
    return COPY[locale];
}
