import type {WishView} from '@entities/wish'

export type WishesPage = {
    wishes: WishView[]
    hasMore: boolean
}

export type WishesPageResult =
    | (WishesPage & { status: 'ok' })
    | { status: 'rate_limited' }
    | { status: 'error' }

export async function fetchWishesPage(
    offset: number,
    limit: number,
): Promise<WishesPageResult> {
    let res: Response
    try {
        const params = new URLSearchParams({
            limit: String(limit),
            offset: String(offset),
        })
        res = await fetch(`/api/wishes?${params}`, {cache: 'no-store'})
    } catch {
        return {status: 'error'}
    }
    if (res.status === 429) return {status: 'rate_limited'}
    if (!res.ok) return {status: 'error'}
    const data = (await res.json()) as {
        wishes?: WishView[]
        hasMore?: boolean
    }
    return {
        status: 'ok',
        wishes: data.wishes ?? [],
        hasMore: Boolean(data.hasMore),
    }
}
