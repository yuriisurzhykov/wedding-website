import "server-only";

/**
 * Gallery uploads: presigned browser→R2 flow and server multipart proxy (no R2 CORS).
 * Used by `app/api/upload/*`.
 */
export {
    presignGalleryUpload,
    confirmGalleryUpload,
    type PresignGalleryUploadResult,
    type ConfirmGalleryUploadResult,
} from "./api/gallery-upload";
export {
    deleteGalleryPhoto,
    type DeleteGalleryPhotoResult,
} from "./api/delete-gallery-photo";
export {
    uploadGalleryPhotoFromMultipart,
    type MultipartGalleryUploadResult,
} from "./api/gallery-multipart-upload";
export {
    loadRsvpIdentityForUpload,
    type LoadRsvpIdentityForUploadResult,
} from "./lib/load-rsvp-identity-for-upload";
