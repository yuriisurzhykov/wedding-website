import type {WishView} from '@entities/wish'

export type WishesPage = {
    wishes: WishView[]
    hasMore: boolean
}

export async function fetchWishesPage(
    offset: number,
    limit: number,
): Promise<WishesPage | null> {
    const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
    })
    const res = await fetch(`/api/wishes?${params}`, {cache: 'no-store'})
    if (!res.ok) {
        return null
    }
    const data = (await res.json()) as {
        wishes?: WishView[]
        hasMore?: boolean
    }
    return {
        wishes: data.wishes ?? [],
        hasMore: Boolean(data.hasMore),
    }
}
