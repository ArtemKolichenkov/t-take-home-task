import { FastifyInstance } from "fastify";
import healthCheckHandler from "../handlers/health.js";

export const healthRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/health", healthCheckHandler);
};
