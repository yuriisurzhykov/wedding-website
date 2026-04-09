import type {RsvpRowInsert} from "@entities/rsvp";

/** Locale for guest confirmation strings; must match validated `locale` on the RSVP payload. */
export type GuestEmailLocale = "ru" | "en";

type GuestCopy = {
    subjectAttending: string;
    subjectNotAttending: string;
    greeting: (name: string) => string;
    leadAttending: string;
    leadNotAttending: string;
    summaryAttending: (guestCount: number) => string;
    summaryNotAttending: string;
    ceremonyLabel: string;
    venueLabel: string;
    openSite: string;
    signOff: string;
    dietaryLabel: string;
    messageLabel: string;
    /** Shown when {@link buildGuestConfirmationEmail} receives a magic-link URL. */
    magicLinkIntro: string;
    magicLinkButton: string;
};

const COPY: Record<GuestEmailLocale, GuestCopy> = {
    ru: {
        subjectAttending: "Спасибо за ответ — мы вас ждём",
        subjectNotAttending: "Спасибо, что ответили",
        greeting: (name) => `Здравствуйте, ${name}!`,
        leadAttending:
            "Мы получили ваш RSVP и с нетерпением ждём встречи на празднике.",
        leadNotAttending:
            "Нам очень жаль, что вы не сможете прийти — спасибо, что дали нам знать.",
        summaryAttending: (guestCount) =>
            guestCount <= 1
                ? "Вы отметили, что придёте."
                : `Вы отметили, что придёте, гостей (включая вас): ${guestCount}.`,
        summaryNotAttending: "Вы отметили, что не сможете присутствовать.",
        ceremonyLabel: "Церемония",
        venueLabel: "Площадка",
        openSite: "Открыть сайт",
        signOff: "С любовью,\nЮрий и Мария",
        dietaryLabel: "Питание",
        messageLabel: "Сообщение",
        magicLinkIntro:
            "Если вы откроете свадебный сайт в другом браузере или на другом устройстве, войдите по ссылке ниже — имя и email вводить не нужно.",
        magicLinkButton: "Открыть сайт как гость",
    },
    en: {
        subjectAttending: "Thank you — we can’t wait to see you",
        subjectNotAttending: "Thank you for letting us know",
        greeting: (name) => `Hello, ${name}!`,
        leadAttending:
            "We’ve received your RSVP and look forward to celebrating with you.",
        leadNotAttending:
            "We’re sorry you won’t be able to join us — thank you for letting us know.",
        summaryAttending: (guestCount) =>
            guestCount <= 1
                ? "You let us know you’ll be attending."
                : `You let us know you’ll be attending — party size (including you): ${guestCount}.`,
        summaryNotAttending: "You let us know you won’t be able to attend.",
        ceremonyLabel: "Ceremony",
        venueLabel: "Venue",
        openSite: "Open the wedding site",
        signOff: "With love,\nYurii & Mariia",
        dietaryLabel: "Dietary",
        messageLabel: "Message",
        magicLinkIntro:
            "If you open the wedding site in another browser or device, use the link below to sign in as a guest — you won’t need to re-enter your name or email.",
        magicLinkButton: "Open the site as a guest",
    },
};

/**
 * RU/EN strings for the guest confirmation email (no HTML; used by `buildGuestConfirmationEmail`).
 *
 * @param locale — `'ru'` or `'en'`.
 */
export function getGuestConfirmationCopy(locale: GuestEmailLocale): GuestCopy {
    return COPY[locale];
}

/**
 * Subject line for the guest confirmation email (attending vs not attending).
 *
 * @param row — Needs `attending` only.
 * @param locale — Copy variant.
 */
export function guestConfirmationSubject(
    row: Pick<RsvpRowInsert, "attending">,
    locale: GuestEmailLocale,
): string {
    const c = COPY[locale];
    return row.attending ? c.subjectAttending : c.subjectNotAttending;
}
