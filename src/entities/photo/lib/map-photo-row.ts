import type {GalleryPhotoView, PhotoDbRow} from "../model/types";

/**
 * @param viewerGuestAccountId — When set, marks rows uploaded by the same guest account as deletable by this viewer.
 */
export function mapPhotoRowToGalleryView(
    row: PhotoDbRow,
    viewerGuestAccountId?: string | null,
): GalleryPhotoView {
    const canDelete =
        viewerGuestAccountId != null &&
        row.guest_account_id != null &&
        row.guest_account_id === viewerGuestAccountId;

    return {
        id: row.id,
        publicUrl: row.public_url,
        uploaderName: row.uploader_name,
        uploadedAt: row.uploaded_at,
        ...(canDelete ? {canDelete: true} : {}),
    };
}
