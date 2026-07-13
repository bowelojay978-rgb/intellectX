import { describe, expect, it } from "vitest";

import {
  STAFF_MEDIA_POSTER,
  STAFF_MEDIA_VIDEO,
  assertStaffMediaMetadata,
  maxStaffPosterBytes,
  maxStaffVideoBytes,
} from "../../convex/lib/staffMediaPolicy";

describe("staff media policy", () => {
  it("accepts supported video formats within the size limit", () => {
    for (const contentType of ["video/mp4", "video/webm", "video/quicktime"]) {
      expect(
        assertStaffMediaMetadata(STAFF_MEDIA_VIDEO, {
          contentType,
          size: 10 * 1024 * 1024,
        }),
      ).toEqual({ contentType, size: 10 * 1024 * 1024 });
    }
  });

  it("rejects unsupported or oversized videos", () => {
    expect(() =>
      assertStaffMediaMetadata(STAFF_MEDIA_VIDEO, {
        contentType: "video/x-msvideo",
        size: 1024,
      }),
    ).toThrow(/unsupported video type/i);

    expect(() =>
      assertStaffMediaMetadata(STAFF_MEDIA_VIDEO, {
        contentType: "video/mp4",
        size: maxStaffVideoBytes + 1,
      }),
    ).toThrow(/500 mb/i);
  });

  it("accepts supported poster images and rejects invalid ones", () => {
    for (const contentType of ["image/jpeg", "image/png", "image/webp"]) {
      expect(
        assertStaffMediaMetadata(STAFF_MEDIA_POSTER, {
          contentType,
          size: 1024,
        }),
      ).toEqual({ contentType, size: 1024 });
    }

    expect(() =>
      assertStaffMediaMetadata(STAFF_MEDIA_POSTER, {
        contentType: "image/gif",
        size: 1024,
      }),
    ).toThrow(/unsupported poster type/i);

    expect(() =>
      assertStaffMediaMetadata(STAFF_MEDIA_POSTER, {
        contentType: "image/png",
        size: maxStaffPosterBytes + 1,
      }),
    ).toThrow(/10 mb/i);
  });

  it("rejects empty media or missing content types", () => {
    expect(() =>
      assertStaffMediaMetadata(STAFF_MEDIA_VIDEO, {
        contentType: "video/mp4",
        size: 0,
      }),
    ).toThrow(/empty|invalid size/i);

    expect(() =>
      assertStaffMediaMetadata(STAFF_MEDIA_VIDEO, {
        contentType: undefined,
        size: 1024,
      }),
    ).toThrow(/content type/i);
  });
});
