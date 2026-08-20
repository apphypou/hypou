import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Android native configuration", () => {
  it("uses the production Hypou package and Capacitor 8 SDK levels", () => {
    const appGradle = readSource("android/app/build.gradle");
    const variables = readSource("android/variables.gradle");
    const mainActivity = readSource("android/app/src/main/java/app/hypou/mobile/MainActivity.java");

    expect(appGradle).toContain('namespace = "app.hypou.mobile"');
    expect(appGradle).toContain('applicationId "app.hypou.mobile"');
    expect(variables).toContain("minSdkVersion = 24");
    expect(variables).toContain("compileSdkVersion = 36");
    expect(variables).toContain("targetSdkVersion = 36");
    expect(mainActivity).toContain("package app.hypou.mobile;");
  });

  it("does not enable cleartext traffic in the release manifest", () => {
    const manifest = readSource("android/app/src/main/AndroidManifest.xml");

    expect(manifest).not.toContain('android:usesCleartextTraffic="true"');
  });

  it("keeps signing and Firebase files out of version control", () => {
    const gitignore = readSource("android/.gitignore");

    expect(gitignore).toMatch(/^\*\.jks$/m);
    expect(gitignore).toMatch(/^\*\.keystore$/m);
    expect(gitignore).toMatch(/^google-services\.json$/m);
  });

  it("declares Android media permissions and the native auth callback", () => {
    const manifest = readSource("android/app/src/main/AndroidManifest.xml");

    expect(manifest).toContain("android.permission.CAMERA");
    expect(manifest).toContain("android.permission.RECORD_AUDIO");
    expect(manifest).toContain('android:scheme="hypou"');
    expect(manifest).toContain('android:host="auth-callback"');
  });

  it("keeps camera and microphone hardware optional for Play compatibility", () => {
    const manifest = readSource("android/app/src/main/AndroidManifest.xml");

    expect(manifest).toContain('<uses-feature android:name="android.hardware.camera" android:required="false" />');
    expect(manifest).toContain('<uses-feature android:name="android.hardware.microphone" android:required="false" />');
  });

  it("configures the FCM channel and monochrome notification icon", () => {
    const manifest = readSource("android/app/src/main/AndroidManifest.xml");
    const strings = readSource("android/app/src/main/res/values/strings.xml");

    expect(manifest).toContain("com.google.firebase.messaging.default_notification_channel_id");
    expect(manifest).toContain("@string/default_notification_channel_id");
    expect(manifest).toContain("com.google.firebase.messaging.default_notification_icon");
    expect(manifest).toContain("@drawable/ic_stat_hypou");
    expect(strings).toContain('<string name="default_notification_channel_id">default</string>');
    expect(existsSync(join(process.cwd(), "android/app/src/main/res/drawable/ic_stat_hypou.xml"))).toBe(true);
  });
});
