import type {AdminPhotoRow} from "@features/admin-gallery-delete";

export type AdminGalleryPhotoRow = AdminPhotoRow & {
    uploadedAtLabel: string;
};
