import { FastifyReply, FastifyRequest } from "fastify";
import { usersTable } from "../../db/schema.js";
import { AppFailedResponse, AppSuccessResponse } from "src/types.js";
import { eq } from "drizzle-orm";
import validator from "validator";

export const getUserByIdHandler = async (
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply,
) => {
  try {
    if (!validator.isUUID(request.params.id, 4)) {
      const response: AppFailedResponse = {
        status: "error",
        message: "Malformed user UUID",
      };
      return reply.code(400).send(response);
    }
    const users = await request.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, request.params.id));
    const response: AppSuccessResponse<typeof usersTable.$inferSelect> = {
      status: "success",
    };
    if (users.length === 1) {
      response.data = users[0];
    }
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
