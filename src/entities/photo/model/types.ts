/** Row shape from `photos` (Supabase). */
export type PhotoDbRow = {
    id: string;
    r2_key: string;
    uploader_name: string | null;
    public_url: string;
    size_bytes: number | null;
    uploaded_at: string;
};

/** Safe view for the home gallery grid. */
export type GalleryPhotoView = {
    id: string;
    publicUrl: string;
    uploaderName: string | null;
    uploadedAt: string;
};
