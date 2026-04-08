'use client'

import {Toaster} from 'sonner'

/** Global toast host (Sonner). Mount once in the root layout. */
export function AppToaster() {
    return (
        <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{className: 'font-body'}}
        />
    )
}
