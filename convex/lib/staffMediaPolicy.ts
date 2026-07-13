export const STAFF_MEDIA_VIDEO = "video" as const;
export const STAFF_MEDIA_POSTER = "poster" as const;

export type StaffMediaKind = typeof STAFF_MEDIA_VIDEO | typeof STAFF_MEDIA_POSTER;

export const maxStaffVideoBytes = 500 * 1024 * 1024;
export const maxStaffPosterBytes = 10 * 1024 * 1024;

const allowedVideoContentTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const allowedPosterContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type StaffMediaMetadata = {
  contentType?: string;
  size: number;
};

export function assertStaffMediaMetadata(kind: StaffMediaKind, metadata: StaffMediaMetadata) {
  const contentType = metadata.contentType?.trim().toLowerCase();

  if (!contentType) {
    throw new Error("Uploaded media must include a content type.");
  }

  if (!Number.isFinite(metadata.size) || metadata.size <= 0) {
    throw new Error("Uploaded media is empty or has an invalid size.");
  }

  if (kind === STAFF_MEDIA_VIDEO) {
    if (!allowedVideoContentTypes.has(contentType)) {
      throw new Error("Unsupported video type. Use MP4, WebM, or MOV.");
    }

    if (metadata.size > maxStaffVideoBytes) {
      throw new Error("Video exceeds the 500 MB upload limit.");
    }

    return { contentType, size: metadata.size };
  }

  if (!allowedPosterContentTypes.has(contentType)) {
    throw new Error("Unsupported poster type. Use JPEG, PNG, or WebP.");
  }

  if (metadata.size > maxStaffPosterBytes) {
    throw new Error("Poster image exceeds the 10 MB upload limit.");
  }

  return { contentType, size: metadata.size };
}
