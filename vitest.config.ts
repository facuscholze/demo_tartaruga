import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      // Los módulos marcados "server-only" se prueban igual en Node.
      "server-only": resolve(__dirname, "./tests/stubs/server-only.ts"),
      "@": resolve(__dirname, "./src"),
      "@content": resolve(__dirname, "./content"),
    },
  },
});
