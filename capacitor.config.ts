import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.intellectx.app",
  appName: "IntellectX",
  webDir: "public",
  server: {
    url: "https://intellect-x-coral.vercel.app",
    cleartext: false
  }
};

export default config;
