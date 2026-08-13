import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    exclude: ["tests/e2e/**", "node_modules/**", "lib/**"],
    coverage: {
      reporter: ["text", "json-summary"],
    },
  },
});
