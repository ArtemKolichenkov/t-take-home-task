import { FastifyInstance } from "fastify";
import { healthRoutes } from "./health.js";
import { usersRoutes } from "./users.js";

export const apiRoutes = async (fastify: FastifyInstance) => {
  fastify.register(healthRoutes);
  fastify.register(usersRoutes);
};

export * from "./health.js";
export * from "./users.js";
