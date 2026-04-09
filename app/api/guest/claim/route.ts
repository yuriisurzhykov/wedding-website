import {handleGuestClaimGet} from "@features/guest-session/server";

/**
 * Delegates to {@link handleGuestClaimGet} — HTTP adapter only.
 */
export async function GET(request: Request) {
    return handleGuestClaimGet(request);
}
