import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./src/setup.integration.ts"],
    poolOptions: {
      threads: {
        singleThread: true,
        execArgv: ["--env-file=.env.test"],
      },
      forks: { singleFork: true, execArgv: ["--env-file=.env.test"] },
    },
    include: ["./src/**/*.integration.test.ts"],
    exclude: ["./src/**/*.unit.test.ts"],
    reporters: ["verbose"],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage/integration",
      exclude: [
        "drizzle.config.ts",
        "eslint.config.js",
        "vitest.config.integration.ts",
        "vitest.config.unit.ts",
        "./src/setup.unit.ts",
        "**/*.integration.test.ts",
        "**/*.unit.test.ts",
        "./src/index.integration.test.ts",
        "./dist/",
        "./coverage/",
      ],
    },
    mockReset: true,
  },
});
