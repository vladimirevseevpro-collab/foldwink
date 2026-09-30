import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.neuralvoid.foldwink",
  appName: "Foldwink",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  ios: {
    preferredContentMode: "mobile",
    allowsLinkPreview: false,
    backgroundColor: "#0c0f0d",
  },
};

export default config;
