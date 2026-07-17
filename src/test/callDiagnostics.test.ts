import { describe, expect, it } from "vitest";
import {
  describeCallError,
  getCallRuntimeDiagnostics,
  preflightCallMedia,
  redactCallRouteState,
} from "@/lib/callDiagnostics";

describe("call diagnostics", () => {
  it("redacts LiveKit token from route state", () => {
    const safe = redactCallRouteState({
      token: "livekit-secret-token",
      url: "wss://hypou-qvr7nw1i.livekit.cloud",
      callSessionId: "call-1",
      conversationId: "conv-1",
      kind: "video",
      isCaller: true,
    });

    expect(safe).toEqual({
      hasToken: true,
      urlHost: "hypou-qvr7nw1i.livekit.cloud",
      callSessionId: "call-1",
      conversationId: "conv-1",
      kind: "video",
      isCaller: true,
    });
    expect(JSON.stringify(safe)).not.toContain("livekit-secret-token");
  });

  it("captures browser media capabilities", () => {
    const diagnostics = getCallRuntimeDiagnostics("audio", {
      isSecureContext: true,
      location: { origin: "capacitor://localhost", protocol: "capacitor:" } as Location,
      navigator: {
        userAgent: "iPhone WKWebView",
        mediaDevices: {
          getUserMedia: async () => ({} as MediaStream),
          enumerateDevices: async () => [],
        },
      } as Navigator,
    } as Window);

    expect(diagnostics).toMatchObject({
      kind: "audio",
      origin: "capacitor://localhost",
      protocol: "capacitor:",
      secureContext: true,
      mediaDevices: true,
      getUserMedia: true,
      enumerateDevices: true,
    });
  });

  it("normalizes native and LiveKit errors", () => {
    const error = Object.assign(new Error("permission denied"), {
      code: "NotAllowedError",
      reason: "permissions",
      cause: new DOMException("denied", "NotAllowedError"),
    });

    expect(describeCallError(error)).toMatchObject({
      name: "Error",
      message: "permission denied",
      code: "NotAllowedError",
      reason: "permissions",
      cause: {
        name: "NotAllowedError",
        message: "denied",
      },
    });
  });

  it("preflights audio permissions and stops tracks", async () => {
    const stopped: string[] = [];
    const stream = {
      getTracks: () => [{ stop: () => stopped.push("audio") }],
      getAudioTracks: () => [{}],
      getVideoTracks: () => [],
    } as unknown as MediaStream;
    const mediaDevices = {
      getUserMedia: async (constraints: MediaStreamConstraints) => {
        expect(constraints).toEqual({ audio: true });
        return stream;
      },
    };

    await expect(preflightCallMedia("audio", mediaDevices)).resolves.toEqual({
      audioTracks: 1,
      videoTracks: 0,
    });
    expect(stopped).toEqual(["audio"]);
  });

  it("preflights video permissions with audio and camera", async () => {
    const stream = {
      getTracks: () => [],
      getAudioTracks: () => [{}],
      getVideoTracks: () => [{}],
    } as unknown as MediaStream;
    const mediaDevices = {
      getUserMedia: async (constraints: MediaStreamConstraints) => {
        expect(constraints).toEqual({ audio: true, video: { facingMode: "user" } });
        return stream;
      },
    };

    await expect(preflightCallMedia("video", mediaDevices)).resolves.toEqual({
      audioTracks: 1,
      videoTracks: 1,
    });
  });
});
