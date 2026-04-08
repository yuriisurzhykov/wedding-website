import type {WishDbRow, WishView} from "../model/types";

export function mapWishRowToView(row: WishDbRow): WishView {
    return {
        id: row.id,
        authorName: row.author_name,
        message: row.message,
        photoUrl: row.photo_url,
        createdAt: row.created_at,
    };
}
