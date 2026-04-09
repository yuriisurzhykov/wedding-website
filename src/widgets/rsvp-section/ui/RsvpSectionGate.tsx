"use client";

import type {ReactNode} from "react";

import {useGuestSession} from "@features/guest-session";

type Props = Readonly<{
    children: ReactNode;
}>;

/**
 * Renders RSVP only for visitors **without** an active guest session.
 * While status is `loading` or `authenticated`, outputs nothing (avoids flashing the form for signed-in guests).
 */
export function RsvpSectionGate({children}: Props) {
    const {status} = useGuestSession();

    if (status !== "anonymous") {
        return null;
    }

    return <>{children}</>;
}
