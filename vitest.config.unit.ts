import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./src/setup.unit.ts"],
    poolOptions: {
      threads: { execArgv: ["--env-file=.env.test"] },
      forks: { execArgv: ["--env-file=.env.test"] },
    },
    include: ["./src/**/*.unit.test.ts"],
    exclude: [".src/**/*.integration.test.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage/unit",
      exclude: [
        "drizzle.config.ts",
        "eslint.config.js",
        "vitest.config.integration.ts",
        "vitest.config.unit.ts",
        "./src/setup.integration.ts",
        "**/*.integration.test.ts",
        "**/*.unit.test.ts",
        "./dist/",
        "./coverage/",
      ],
    },
  },
});
