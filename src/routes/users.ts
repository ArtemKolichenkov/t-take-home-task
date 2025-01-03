import { FastifyInstance } from "fastify";
import {
  addUserHandler,
  getUserByIdHandler,
  listUsersHandler,
} from "../handlers/users/index.js";

export const usersRoutes = async (fastify: FastifyInstance) => {
  fastify.post("/users", addUserHandler);
  fastify.get("/users", listUsersHandler);
  fastify.get("/users/:id", getUserByIdHandler);
};
