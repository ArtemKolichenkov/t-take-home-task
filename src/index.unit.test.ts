import { setUpFastify, startServer } from "./index.js";

vi.mock("pg", async () => {
  const mockConnect = vi.fn();
  const mockQuery = vi.fn();

  class Pool {
    connect = mockConnect;
    query = mockQuery;
    end = vi.fn();
  }

  return {
    Pool,
    default: {
      Pool,
    },
    mockConnect,
    mockQuery,
  };
});

vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: vi.fn(),
}));

vi.mock("drizzle-orm/node-postgres/migrator", () => ({
  migrate: vi.fn(),
}));

const allowedOrigin1 = "https://allowed-origin.com";
const allowedOrigin2 = "https://another-allowed-origin.com";

describe("index.ts", () => {
  describe("CORS", () => {
    const originalEnvCors = process.env.CORS;

    beforeEach(async () => {
      // @ts-expect-error mocks are obviously not included in pg types
      const { mockConnect, mockQuery } = await import("pg");
      mockConnect.mockResolvedValue(undefined);
      mockQuery.mockResolvedValue({ rows: [] });

      const { drizzle } = await import("drizzle-orm/node-postgres");
      const { migrate } = await import("drizzle-orm/node-postgres/migrator");
      vi.mocked(drizzle).mockReturnValue({} as ReturnType<typeof drizzle>);
      vi.mocked(migrate).mockResolvedValue(undefined);
    });

    afterAll(() => {
      process.env["CORS"] = originalEnvCors;
    });

    it("should allow requests from allowed origin", async () => {
      process.env["CORS"] = allowedOrigin1;
      const app = await setUpFastify();
      const response = await app.inject({
        method: "GET",
        url: "/v1/health",
        headers: {
          Origin: allowedOrigin1,
        },
      });
      expect(response.statusCode).toStrictEqual(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        allowedOrigin1,
      );
      expect(response.json()).toEqual({ health: "OK" });
    });

    it("should allow requests from multiple allowed origins", async () => {
      process.env["CORS"] = `${allowedOrigin1} ${allowedOrigin2}`;
      const app = await setUpFastify();
      const response = await app.inject({
        method: "GET",
        url: "/v1/health",
        headers: {
          Origin: allowedOrigin1,
        },
      });
      expect(response.statusCode).toStrictEqual(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        allowedOrigin1,
      );
      expect(response.json()).toEqual({ health: "OK" });
      const response2 = await app.inject({
        method: "GET",
        url: "/v1/health",
        headers: {
          Origin: allowedOrigin2,
        },
      });
      expect(response2.statusCode).toStrictEqual(200);
      expect(response2.headers["access-control-allow-origin"]).toBe(
        allowedOrigin2,
      );
      expect(response2.json()).toEqual({ health: "OK" });
    });

    it("should allow requests from wildcard (all) origins", async () => {
      process.env["CORS"] = "*";
      const app = await setUpFastify();
      const response = await app.inject({
        method: "GET",
        url: "/v1/health",
        headers: {
          Origin: allowedOrigin1,
        },
      });
      expect(response.statusCode).toStrictEqual(200);
      expect(response.headers["access-control-allow-origin"]).toBe("*");
      expect(response.json()).toEqual({ health: "OK" });
    });

    it("should allow requests from localhost", async () => {
      process.env["CORS"] = allowedOrigin1;
      const app = await setUpFastify();
      const response = await app.inject({
        method: "GET",
        url: "/v1/health",
        headers: {
          Origin: "http://localhost:3000",
        },
      });
      expect(response.statusCode).toStrictEqual(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000",
      );
      expect(response.json()).toEqual({ health: "OK" });
    });

    it("should respond to preflight request with correct headers", async () => {
      process.env["CORS"] = allowedOrigin1;
      const app = await setUpFastify();
      const response = await app.inject({
        method: "OPTIONS",
        url: "/v1/health",
        headers: {
          Origin: allowedOrigin1,
          "Access-Control-Request-Method": "GET",
        },
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers["access-control-allow-origin"]).toBe(
        allowedOrigin1,
      );
      expect(response.headers["access-control-allow-methods"]).toContain("GET");
    });

    it("should deny requests from disallowed origin", async () => {
      process.env["CORS"] = allowedOrigin1;
      const app = await setUpFastify();
      const response = await app.inject({
        method: "GET",
        url: "/v1/health",
        headers: {
          Origin: "httpw://disallowed-origin.com",
        },
      });

      expect(response.statusCode).toBe(403);
      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
      expect(response.json()).toEqual({
        statusCode: 403,
        error: "Forbidden",
        message: "Forbidden",
      });
    });
  });
  describe("Server initialization", () => {
    it("fails to start a server if DB connection failed", async () => {
      // @ts-expect-error mocks are obviously not included in pg types
      const { mockConnect } = await import("pg");
      mockConnect.mockRejectedValueOnce(new Error("Mock DB connection failed"));

      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);

      await setUpFastify();

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
    it("fails to start a server if DB migration failed", async () => {
      // @ts-expect-error mocks are obviously not included in pg types
      const { mockConnect } = await import("pg");
      mockConnect.mockResolvedValue(undefined);

      const { migrate } = await import("drizzle-orm/node-postgres/migrator");
      vi.mocked(migrate).mockRejectedValueOnce(
        new Error("Mock migration failed"),
      );

      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);

      await setUpFastify();

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
    it("fails when server fails to start listening", async () => {
      // @ts-expect-error mocks are obviously not included in pg types
      const { mockConnect, mockQuery } = await import("pg");
      mockConnect.mockResolvedValue(undefined);
      mockQuery.mockResolvedValue({ rows: [] });

      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);

      const app = await setUpFastify();
      const logSpy = vi.spyOn(app.log, "error");

      vi.spyOn(app, "listen").mockRejectedValueOnce(
        new Error("Failed to start server"),
      );

      await startServer(app);

      expect(logSpy).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1);

      logSpy.mockRestore();
      mockExit.mockRestore();
    });
    it("fails to start a server if environmental variables check failed", async () => {
      const originalHost = process.env.HOST;
      process.env.HOST = "invalid:host";

      const mockExit = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);

      await setUpFastify();

      expect(mockExit).toHaveBeenCalledWith(1);

      process.env.HOST = originalHost;
      mockExit.mockRestore();
    });
  });
});
