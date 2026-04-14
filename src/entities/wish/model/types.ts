/** Row shape from `wishes` (Supabase). */
export type WishDbRow = {
    id: string;
    author_name: string;
    message: string;
    photo_r2_key: string | null;
    photo_url: string | null;
    guest_account_id?: string | null;
    created_at: string;
};

/** Safe view for the wishes feed. */
export type WishView = {
    id: string;
    authorName: string;
    message: string;
    photoUrl: string | null;
    createdAt: string;
};
