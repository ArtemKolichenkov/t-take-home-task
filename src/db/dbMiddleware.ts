import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { db } from "../db/index.js";

declare module "fastify" {
  interface FastifyRequest {
    db: typeof db;
  }
}

export const dbMiddleware = fp(async (fastify: FastifyInstance) => {
  fastify.addHook("onRequest", async (request) => {
    request.db = db;
  });
});
