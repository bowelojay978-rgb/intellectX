import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.intellectx.app",
  appName: "IntellectX",
  webDir: "public",
  server: {
    url: "https://intellect-x-coral.vercel.app",
    cleartext: false,
    appStartPath: "/mobile-quizzes",
    errorPath: "mobile-error.html",
  },
};

export default config;
