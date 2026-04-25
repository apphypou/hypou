import { describe, it, expect } from "vitest";
import {
  validateImageFile,
  validateVideoFile,
  validateAudioFile,
  validateChatMedia,
  isHeicFile,
} from "@/lib/fileValidation";

const makeFile = (name: string, type: string, sizeBytes: number) => {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type });
  return new File([blob], name, { type });
};

describe("fileValidation", () => {
  it("01 aceita JPEG válido", () => {
    expect(validateImageFile(makeFile("a.jpg", "image/jpeg", 1024))).toBeNull();
  });
  it("02 aceita PNG", () => {
    expect(validateImageFile(makeFile("a.png", "image/png", 1024))).toBeNull();
  });
  it("03 aceita WebP", () => {
    expect(validateImageFile(makeFile("a.webp", "image/webp", 1024))).toBeNull();
  });
  it("04 rejeita GIF", () => {
    expect(validateImageFile(makeFile("a.gif", "image/gif", 1024))).toMatch(/não permitido/);
  });
  it("05 rejeita imagem >5MB", () => {
    expect(validateImageFile(makeFile("a.jpg", "image/jpeg", 6 * 1024 * 1024))).toMatch(/5MB/);
  });
  it("06 aceita MP4 50MB exato", () => {
    expect(validateVideoFile(makeFile("v.mp4", "video/mp4", 50 * 1024 * 1024))).toBeNull();
  });
  it("07 rejeita vídeo >50MB", () => {
    expect(validateVideoFile(makeFile("v.mp4", "video/mp4", 51 * 1024 * 1024))).toMatch(/50MB/);
  });
  it("08 rejeita MOV (não suportado)", () => {
    expect(validateVideoFile(makeFile("v.mov", "video/quicktime", 1024))).toMatch(/não permitido/);
  });
  it("09 aceita áudio webm", () => {
    expect(validateAudioFile(makeFile("a.webm", "audio/webm", 1024))).toBeNull();
  });
  it("10 rejeita áudio >10MB", () => {
    expect(validateAudioFile(makeFile("a.webm", "audio/webm", 11 * 1024 * 1024))).toMatch(/10MB/);
  });
  it("11 validateChatMedia roteia para imagem", () => {
    expect(validateChatMedia(makeFile("x.png", "image/png", 100), "image")).toBeNull();
  });
  it("12 validateChatMedia roteia para vídeo", () => {
    expect(validateChatMedia(makeFile("x.mp4", "video/mp4", 100), "video")).toBeNull();
  });
  it("13 validateChatMedia roteia para áudio", () => {
    expect(validateChatMedia(makeFile("x.webm", "audio/webm", 100), "audio")).toBeNull();
  });
  it("14 detecta HEIC pelo MIME", () => {
    expect(isHeicFile(makeFile("foto.heic", "image/heic", 100))).toBe(true);
  });
  it("15 detecta HEIC pela extensão (iOS Safari sem MIME)", () => {
    expect(isHeicFile(makeFile("foto.HEIC", "", 100))).toBe(true);
  });
  it("16 aceita HEIC dentro do limite (15MB)", () => {
    expect(validateImageFile(makeFile("foto.heic", "image/heic", 1024))).toBeNull();
  });
  it("17 rejeita HEIC acima de 15MB", () => {
    expect(validateImageFile(makeFile("foto.heic", "image/heic", 16 * 1024 * 1024))).toMatch(/15MB/);
  });
});
