import { describe, it, expect, beforeEach } from "vitest";
import checkEnvironment, { requiredEnvVars } from "./checkEnvironment.js";

describe("checkEnvironment", () => {
  const originalEnv = { ...process.env };
  const validEnvVars = {
    HOST: "localhost",
    PORT: "3000",
    DB_URL: "postgres://localhost",
    CORS: "*",
  };

  beforeEach(() => {
    for (const key of requiredEnvVars) {
      delete process.env[key];
    }
  });

  afterAll(() => {
    process.env = { ...originalEnv };
  });

  it.each([
    {
      scenario: "no env variables set",
      envVars: {},
      expected: false,
    },
    {
      scenario: "missing DB_URL",
      envVars: { HOST: "localhost", PORT: "3000" },
      expected: false,
    },
    {
      scenario: "missing PORT",
      envVars: { HOST: "localhost", DB_URL: "postgres://localhost" },
      expected: false,
    },
    {
      scenario: "all required variables set",
      envVars: validEnvVars,
      expected: true,
    },
    {
      scenario: "all required plus optional variables",
      envVars: { ...validEnvVars, OPTIONAL_VAR: "something" },
      expected: true,
    },
    {
      scenario: "invalid HOST (not an IP or localhost)",
      envVars: { ...validEnvVars, HOST: "invalid-host" },
      expected: false,
    },
    {
      scenario: "valid HOST (IP address)",
      envVars: { ...validEnvVars, HOST: "192.168.1.1" },
      expected: true,
    },
    {
      scenario: "invalid PORT (not a number)",
      envVars: { ...validEnvVars, PORT: "invalid-port" },
      expected: false,
    },
    {
      scenario: "invalid PORT (out of range)",
      envVars: { ...validEnvVars, PORT: "99999" },
      expected: false,
    },
  ])("returns $expected when $scenario", ({ envVars, expected }) => {
    Object.entries(envVars).forEach(([key, value]) => {
      process.env[key] = value;
    });
    expect(checkEnvironment()).toBe(expected);
  });
});
