import { defineConfig } from "@playwright/test";

export default defineConfig({
  workers: 1,
  retries: 2,
  fullyParallel: false,
  testDir: "./e2e",
});
