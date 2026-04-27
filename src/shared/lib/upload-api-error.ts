/**
 * Typed error thrown when an upload-related API call (`/api/upload/*`) returns
 * a non-OK HTTP response. Carries the original status so callers can branch
 * on 429 / 413 / 403 and show the right translated toast.
 */
export class UploadApiError extends Error {
    readonly httpStatus: number

    constructor(message: string, httpStatus: number) {
        super(message)
        this.name = 'UploadApiError'
        this.httpStatus = httpStatus
    }
}
