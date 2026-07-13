import { describe, expect, it } from "vitest";
import { evaluateAndroidStoreRelease } from "../../scripts/check-android-store-release.mjs";

const validEnv = {
  ANDROID_KEYSTORE_PATH: "release/intellectx.jks",
  ANDROID_KEYSTORE_PASSWORD: "store-secret",
  ANDROID_KEY_ALIAS: "intellectx",
  ANDROID_KEY_PASSWORD: "key-secret",
  APP_VERSION_CODE: "42",
  APP_VERSION_NAME: "1.2.0",
};

const bundledCapacitorConfig = `
const bundledMobileRelease = process.env.INTELLECTX_MOBILE_BUNDLED === "true";
const remoteServerConfig = { url: "https://intellect-x-coral.vercel.app" };
const config = {
  appId: "com.intellectx.app",
  webDir: bundledMobileRelease ? "mobile-client/out" : "public",
  ...(bundledMobileRelease ? {} : { server: remoteServerConfig }),
};
`;

const signedAndroidBuild = `
def releaseKeystorePath = System.getenv('ANDROID_KEYSTORE_PATH')
def releaseKeystorePassword = System.getenv('ANDROID_KEYSTORE_PASSWORD')
def releaseKeyAlias = System.getenv('ANDROID_KEY_ALIAS')
def releaseKeyPassword = System.getenv('ANDROID_KEY_PASSWORD')
android {
  defaultConfig {
    applicationId "com.intellectx.app"
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
    }
  }
}
`;

const androidStrings = `
<resources>
  <string name="package_name">com.intellectx.app</string>
</resources>
`;

describe("Android store-release preflight", () => {
  it("passes when signing, versioning, package identity, and bundled delivery are complete", () => {
    const report = evaluateAndroidStoreRelease({
      env: validEnv,
      capacitorConfig: bundledCapacitorConfig,
      androidBuildGradle: signedAndroidBuild,
      androidStrings,
      bundledEntryExists: true,
      keystoreExists: true,
    });

    expect(report.errors).toEqual([]);
    expect(report.packageId).toBe("com.intellectx.app");
    expect(report.webDir).toBe("mobile-client/out");
  });

  it("fails when release signing secrets are missing or the keystore cannot be found", () => {
    const report = evaluateAndroidStoreRelease({
      env: {
        ...validEnv,
        ANDROID_KEYSTORE_PASSWORD: "",
      },
      capacitorConfig: bundledCapacitorConfig,
      androidBuildGradle: signedAndroidBuild,
      androidStrings,
      bundledEntryExists: true,
      keystoreExists: false,
    });

    expect(report.errors).toEqual(
      expect.arrayContaining([
        "missing ANDROID_KEYSTORE_PASSWORD",
        "ANDROID_KEYSTORE_PATH does not point to an existing keystore file",
      ]),
    );
  });

  it("fails when explicit store version values are invalid or missing", () => {
    const report = evaluateAndroidStoreRelease({
      env: {
        ...validEnv,
        APP_VERSION_CODE: "0",
        APP_VERSION_NAME: "",
      },
      capacitorConfig: bundledCapacitorConfig,
      androidBuildGradle: signedAndroidBuild,
      androidStrings,
      bundledEntryExists: true,
      keystoreExists: true,
    });

    expect(report.errors).toEqual(
      expect.arrayContaining(["APP_VERSION_CODE must be at least 1", "missing APP_VERSION_NAME"]),
    );
  });

  it("rejects package identity drift", () => {
    const report = evaluateAndroidStoreRelease({
      env: validEnv,
      capacitorConfig: bundledCapacitorConfig.replace("com.intellectx.app", "com.example.other"),
      androidBuildGradle: signedAndroidBuild,
      androidStrings,
      bundledEntryExists: true,
      keystoreExists: true,
    });

    expect(report.errors).toContain(
      "Capacitor appId, Android applicationId, and package_name must match exactly",
    );
  });

  it("rejects missing bundled release mode, wrong output directory, and active remote delivery", () => {
    const report = evaluateAndroidStoreRelease({
      env: validEnv,
      capacitorConfig: `
        const config = {
          appId: "com.intellectx.app",
          webDir: "public",
          server: { url: "https://intellect-x-coral.vercel.app" },
        };
      `,
      androidBuildGradle: signedAndroidBuild,
      androidStrings,
      bundledEntryExists: false,
      keystoreExists: true,
    });

    expect(report.errors).toEqual(
      expect.arrayContaining([
        "Capacitor config must expose an explicit INTELLECTX_MOBILE_BUNDLED release mode",
        'production bundled Capacitor webDir must be "mobile-client/out"',
        "validated bundled mobile index.html is missing",
        "bundled production mode must not activate a remote server.url",
      ]),
    );
  });
});
