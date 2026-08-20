import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Android mobile workflow", () => {
  it("exposes explicit Android commands", () => {
    const pkg = JSON.parse(readSource("package.json"));

    expect(pkg.scripts["mobile:doctor:android"]).toBe("node scripts/mobile-doctor.mjs --android");
    expect(pkg.scripts["mobile:sync-android"]).toBe("node scripts/release-android.mjs --sync-only");
    expect(pkg.scripts["android:dev"]).toBe("node scripts/release-android.mjs --run");
    expect(pkg.scripts["android:debug-apk"]).toBe("node scripts/release-android.mjs --debug-apk");
  });

  it("keeps iOS as the default doctor and validates Android explicitly", () => {
    const doctor = readSource("scripts/mobile-doctor.mjs");

    expect(doctor).toContain('const platform = process.argv.includes("--android") ? "android" : "ios"');
    expect(doctor).toContain('platforms/android-36');
    expect(doctor).toContain('platform-tools/adb');
    expect(doctor).toContain('android/gradlew');
    expect(doctor).toContain('/Volumes/ADATA SC735/Android/sdk');
    expect(doctor).toContain('/Volumes/ADATA SC735/Applications/Android Studio.app/Contents/jbr/Contents/Home');
  });

  it("builds and syncs before every explicit Android action", () => {
    const script = readSource("scripts/release-android.mjs");

    expect(script).toContain('["run", "mobile:doctor:android"]');
    expect(script).toContain('["run", "build:mobile"]');
    expect(script).toContain('[...capacitor, "sync", "android"]');
    expect(script).toContain('mode === "--sync-only"');
    expect(script).toContain('mode === "--run"');
    expect(script).toContain('mode === "--debug-apk"');
    expect(script).toContain('"assembleDebug"');
    expect(script).toContain('ANDROID_AVD_HOME: androidAvdHome');
  });
});
