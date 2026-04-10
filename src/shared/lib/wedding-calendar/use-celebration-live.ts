"use client";

import {useSyncExternalStore} from "react";

import {isCelebrationLive} from "./internal/resolve-instants";

function subscribe(onStoreChange: () => void): () => void {
    const win = typeof window !== "undefined" ? window : undefined;
    const onFocusOrVisible = () => {
        onStoreChange();
    };
    win?.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    const intervalId = window.setInterval(onStoreChange, 60_000);
    return () => {
        win?.removeEventListener("focus", onFocusOrVisible);
        document.removeEventListener("visibilitychange", onFocusOrVisible);
        window.clearInterval(intervalId);
    };
}

function getCelebrationLiveSnapshot(): boolean {
    return isCelebrationLive(new Date());
}

/**
 * Reactive “celebration has started” flag for client gating. Subscribes to a one-minute tick
 * plus window focus / tab visibility so long-lived tabs update after {@link isCelebrationLive} crosses.
 */
export function useCelebrationLive(): boolean {
    return useSyncExternalStore(
        subscribe,
        getCelebrationLiveSnapshot,
        getCelebrationLiveSnapshot,
    );
}
