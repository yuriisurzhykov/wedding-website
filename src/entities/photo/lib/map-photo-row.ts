import type {GalleryPhotoView, PhotoDbRow} from "../model/types";

export function mapPhotoRowToGalleryView(row: PhotoDbRow): GalleryPhotoView {
    return {
        id: row.id,
        publicUrl: row.public_url,
        uploaderName: row.uploader_name,
        uploadedAt: row.uploaded_at,
    };
}
