import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx, defineManifest } from "@crxjs/vite-plugin";

const manifest = defineManifest({
  manifest_version: 3,
  name: "AI Group Tabs",
  description: "Group your tabs with AI",
  version: "1.0",
  options_ui: {
    page: "options.html",
    open_in_tab: true,
  },
  action: {
    default_icon: "icon.png",
    default_popup: "popup.html",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content-script.ts"],
    },
  ],
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
  permissions: ["storage", "tabs", "tabGroups"],
  host_permissions: ["<all_urls>"],
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // @ts-ignore
    crx({ manifest }),
  ],
  server: {
    port: 5173,
  },
});
