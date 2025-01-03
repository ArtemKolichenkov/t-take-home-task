import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import checkEnvironment from "./utils/checkEnvironment.js";
import { getCorsCheckFn } from "./utils/cors.js";
import { dbMiddleware } from "./db/dbMiddleware.js";
import { initDb } from "./db/index.js";
import { apiRoutes } from "./routes/index.js";

export const setUpFastify = async (opts = {}) => {
  const envOk = checkEnvironment();
  if (!envOk) {
    console.error(
      "Environmental variables check failed (check above for details)",
    );
    process.exit(1);
  }
  try {
    await initDb();
  } catch (error) {
    console.error(error);
    console.info("Database initialization failed, shutting down");
    process.exit(1);
  }

  const app = Fastify(opts);
  await app.register(cors, {
    origin: getCorsCheckFn(process.env.CORS),
  });
  app.register(dbMiddleware);
  app.register(apiRoutes, { prefix: "/v1" });

  return app;
};

export const startServer = async (app: FastifyInstance) => {
  try {
    await app.listen({
      host: process.env.HOST,
      port: parseInt(process.env.PORT, 10),
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

const fastify = await setUpFastify({
  logger: true,
});

await startServer(fastify);
