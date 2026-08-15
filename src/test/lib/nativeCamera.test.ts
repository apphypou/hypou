import { describe, expect, it } from "vitest";
import { detectMediaFormatFromBytes, resolveNativeMediaFileType } from "@/lib/nativeCamera";

describe("detectMediaFormatFromBytes", () => {
  it("detects JPEG data even when iOS reports a stale HEIC MIME type", () => {
    expect(detectMediaFormatFromBytes(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpg");
  });

  it("detects a real HEIC file from its ISO media brand", () => {
    expect(detectMediaFormatFromBytes(new Uint8Array([
      0x00, 0x00, 0x00, 0x18,
      0x66, 0x74, 0x79, 0x70,
      0x68, 0x65, 0x69, 0x63,
    ]))).toBe("heic");
  });
});

describe("resolveNativeMediaFileType", () => {
  it("trusts the JPEG format returned by the iOS plugin over a stale HEIC blob type", () => {
    expect(resolveNativeMediaFileType("jpeg", "image/heic", "jpg", "image/jpeg")).toEqual({
      extension: "jpg",
      mimeType: "image/jpeg",
    });
  });

  it("preserves a fetched HEIC type when the native plugin provides no format", () => {
    expect(resolveNativeMediaFileType(undefined, "image/heic", "jpg", "image/jpeg")).toEqual({
      extension: "jpg",
      mimeType: "image/heic",
    });
  });

  it("keeps the native video format behavior unchanged", () => {
    expect(resolveNativeMediaFileType("mov", "video/quicktime", "mp4", "video/mp4")).toEqual({
      extension: "mov",
      mimeType: "video/quicktime",
    });
  });
});
