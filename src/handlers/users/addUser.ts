import { FastifyReply, FastifyRequest } from "fastify";
import { usersTable } from "../../db/schema.js";
import { AppFailedResponse, AppSuccessResponse } from "src/types.js";
import validator from "validator";

export const addUserHandler = async (
  request: FastifyRequest<{
    Body: {
      email: string;
    };
  }>,
  reply: FastifyReply,
) => {
  try {
    if (!validator.isEmail(request.body.email)) {
      const response: AppFailedResponse = {
        status: "error",
        message: "Invalid email address",
      };
      return reply.code(400).send(response);
    }
    const user: typeof usersTable.$inferInsert = {
      email: request.body.email,
    };
    const insertedUsers = await request.db
      .insert(usersTable)
      .values(user)
      .returning();
    const response: AppSuccessResponse<typeof usersTable.$inferSelect> = {
      status: "success",
      data: insertedUsers[0],
    };
    return reply.code(200).send(response);
  } catch (error) {
    console.error(error);
    const response: AppFailedResponse = {
      status: "error",
      message: "Internal server error",
    };
    return reply.code(500).send(response);
  }
};
