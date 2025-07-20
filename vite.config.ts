/// <reference types="vite/client" />
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "node20",
    outDir: "dist",
    lib: {
      entry: "src/app.ts",
      name: "DDCMSDirectFileCreator",
      fileName: "app",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "express",
        "luxon",
        "@faker-js/faker",
        "zod",
        "fs",
        "path",
        "crypto",
      ],
    },
    sourcemap: true,
    minify: false,
  },
  optimizeDeps: {
    include: [
      "express",
      "luxon",
      "@faker-js/faker",
      "zod"
    ],
    exclude: [
      "fs",
      "path",
      "crypto"
    ]
  },
  server: {
    port: 3001,
  },
});
