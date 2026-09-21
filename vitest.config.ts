import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: [
      // No Node/jsdom o par react-router + react-router/dom vira duas instâncias (contextos
      // diferentes). Nos testes usamos o RouterProvider "puro"; no navegador (Vite) não há esse problema.
      { find: "react-router/dom", replacement: "react-router" },
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
    ],
  },
  test: { include: ["src/**/*.test.{ts,tsx}"] },
});
