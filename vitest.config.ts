import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use Node environment (not jsdom)
    environment: "node",
    // Look for test files matching these patterns
    include: ["src/**/*.test.ts"],
    // Enable globals (describe, it, expect) without importing
    globals: true,
    // Timeout per test in ms
    testTimeout: 10000,
  },
});
