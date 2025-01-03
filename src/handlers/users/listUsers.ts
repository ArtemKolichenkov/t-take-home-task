import { FastifyReply, FastifyRequest } from "fastify";
import { usersTable } from "../../db/schema.js";
import { AppFailedResponse, PaginatedResponse } from "src/types.js";
import { and, gt, like } from "drizzle-orm";

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

const getPageSize = (queryParamPageSize?: string) => {
  if (!queryParamPageSize) {
    return DEFAULT_PAGE_SIZE;
  }
  const pageSize = parseInt(queryParamPageSize, 10);
  if (isNaN(pageSize)) {
    return DEFAULT_PAGE_SIZE;
  }
  return pageSize > MAX_PAGE_SIZE ? MAX_PAGE_SIZE : pageSize;
};

const encodeCursor = (value: string) => Buffer.from(value).toString("base64");
const decodeCursor = (cursor: string) =>
  Buffer.from(cursor, "base64").toString("utf-8");

export const listUsersHandler = async (
  request: FastifyRequest<{
    Querystring: {
      cursor?: string;
      pageSize?: string;
      searchStr?: string;
    };
  }>,
  reply: FastifyReply,
) => {
  try {
    const decodedCursor = request.query.cursor
      ? decodeCursor(request.query.cursor)
      : undefined;
    const searchStr = request.query.searchStr ?? "";
    const pageSize = getPageSize(request.query.pageSize);

    const users = await request.db
      .select()
      .from(usersTable)
      .where(
        and(
          like(usersTable.email, `%${searchStr}%`),
          decodedCursor ? gt(usersTable.email, decodedCursor) : undefined,
        ),
      )
      .orderBy(usersTable.email)
      .limit(pageSize + 1);

    const hasMore = users.length > pageSize;
    const pagedUsers = users.slice(0, pageSize);
    const nextCursor = hasMore
      ? encodeCursor(pagedUsers[pagedUsers.length - 1].email)
      : undefined;

    const response: PaginatedResponse<(typeof usersTable.$inferSelect)[]> = {
      status: "success",
      data: pagedUsers,
      cursor: nextCursor,
      pageSize: pageSize,
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
