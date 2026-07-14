import type { CapacitorConfig } from "@capacitor/cli";

const bundledMobileRelease = process.env.INTELLECTX_MOBILE_BUNDLED === "true";

const remoteServerConfig: NonNullable<CapacitorConfig["server"]> = {
  url: "https://intellect-x-coral.vercel.app",
  cleartext: false,
  appStartPath: "/mobile-quizzes",
  errorPath: "mobile-error.html",
};

const config: CapacitorConfig = {
  appId: "com.intellectx.app",
  appName: "IntellectX",
  webDir: bundledMobileRelease ? "mobile-client/out" : "public",
  loggingBehavior: "debug",
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  ...(bundledMobileRelease ? {} : { server: remoteServerConfig }),
};

export default config;
