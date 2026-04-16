'use client'

import {Button} from '@shared/ui'
import React from "react";

/** Matches `RsvpSection` (`id="rsvp"`) and `SiteNavigation` scroll behavior. */
const RSVP_SECTION_ID = 'rsvp'

type Props = Readonly<{
    children: React.ReactNode
}>

export function HeroGoToRsvpButton({children}: Props) {
    return (
        <Button
            variant="primary"
            size="md"
            onClick={() => {
                document
                    .querySelector(`#${RSVP_SECTION_ID}`)
                    ?.scrollIntoView({behavior: 'smooth'})
            }}
        >
            {children}
        </Button>
    )
}
