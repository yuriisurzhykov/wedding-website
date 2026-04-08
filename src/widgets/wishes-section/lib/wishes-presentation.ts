import {WISHES_LIMIT_FULL, WISHES_LIMIT_PREVIEW} from "../config";

export type WishesPresentation = "preview" | "full";

export function wishesListLimitForPresentation(
    presentation: WishesPresentation,
): number {
    return presentation === "preview" ? WISHES_LIMIT_PREVIEW : WISHES_LIMIT_FULL;
}
