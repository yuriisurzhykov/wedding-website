import type {GalleryPhotoView, PhotoDbRow} from "../model/types";

/**
 * @param viewerRsvpId — When set, marks rows uploaded under the same RSVP as deletable by this viewer.
 */
export function mapPhotoRowToGalleryView(
    row: PhotoDbRow,
    viewerRsvpId?: string | null,
): GalleryPhotoView {
    const canDelete =
        viewerRsvpId != null &&
        row.rsvp_id != null &&
        row.rsvp_id === viewerRsvpId;

    return {
        id: row.id,
        publicUrl: row.public_url,
        uploaderName: row.uploader_name,
        uploadedAt: row.uploaded_at,
        ...(canDelete ? {canDelete: true} : {}),
    };
}
