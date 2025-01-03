import { eq } from "drizzle-orm";
import { db } from "./db/index.js";
import { usersTable } from "./db/schema.js";
import { setUpFastify } from "./index.js";
import { FastifyInstance } from "fastify";
import { faker } from "@faker-js/faker";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "./handlers/users/listUsers.js";

const UUIDv4Regex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("Integration tests", () => {
  let app: FastifyInstance;
  const validEmail = "john.doe@gmail.com";

  const createExpectedUser = (email: string) =>
    expect.objectContaining({
      id: expect.stringMatching(UUIDv4Regex),
      email,
    });

  const createUser = (email: string) =>
    app.inject({
      method: "POST",
      url: "/v1/users",
      body: { email },
    });

  const findUsersByEmail = (email: string) =>
    db.select().from(usersTable).where(eq(usersTable.email, email));

  beforeEach(async () => {
    app = await setUpFastify();
  });

  describe("User creation", () => {
    it("saves user to database", async () => {
      const response = await createUser(validEmail);
      const users = await findUsersByEmail(validEmail);

      expect(users).toEqual([createExpectedUser(validEmail)]);
      expect(response.statusCode).toBe(200);
      expect(response.json()).toStrictEqual({
        status: "success",
        data: createExpectedUser(validEmail),
      });
    });

    describe("duplicate email handling", () => {
      beforeEach(async () => {
        await createUser(validEmail);
      });

      it("prevents duplicate email", async () => {
        const response = await createUser(validEmail);
        const users = await findUsersByEmail(validEmail);

        expect(users).toEqual([createExpectedUser(validEmail)]);
        expect(response.json()).toStrictEqual({
          status: "error",
          message: "Internal server error",
        });
      });

      it("prevents duplicate email with different casing", async () => {
        const emailDifferentCase = "jOhN.DOE@GMail.com";
        const response = await createUser(emailDifferentCase);
        const users = await findUsersByEmail(validEmail);

        expect(users).toEqual([createExpectedUser(validEmail)]);
        expect(response.json()).toStrictEqual({
          status: "error",
          message: "Internal server error",
        });
      });
    });

    it("rejects invalid email format", async () => {
      const invalidEmail = "Joe Smith <email@example.com>";
      const response = await createUser(invalidEmail);
      const users = await findUsersByEmail(invalidEmail);

      expect(users).toEqual([]);
      expect(response.statusCode).toBe(400);
      expect(response.json()).toStrictEqual({
        status: "error",
        message: "Invalid email address",
      });
    });
  });

  describe("User retrieval by ID", () => {
    let userId: string;

    beforeEach(async () => {
      const response = await createUser(validEmail);
      userId = response.json().data.id;
    });

    it("retrieves existing user by id", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/v1/users/${userId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toStrictEqual({
        status: "success",
        data: {
          id: userId,
          email: validEmail,
        },
      });
    });

    it("returns empty data for non-existent user id", async () => {
      const nonExistentId = "2d4ba8f8-5f92-4ea4-8667-e5121b34b17f";
      const response = await app.inject({
        method: "GET",
        url: `/v1/users/${nonExistentId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().status).toBe("success");
      expect(response.json().data).toBeUndefined();
    });

    it("returns error for invalid uuid format", async () => {
      const invalidId = "not-a-uuid";
      const response = await app.inject({
        method: "GET",
        url: `/v1/users/${invalidId}`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toStrictEqual({
        status: "error",
        message: "Malformed user UUID",
      });
    });

    it("returns error when encountering internal db error", async () => {
      vi.spyOn(db, "select").mockImplementationOnce(() => {
        throw new Error("Integration test mock database error");
      });

      const response = await app.inject({
        method: "GET",
        url: `/v1/users/${userId}`,
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toStrictEqual({
        status: "error",
        message: "Internal server error",
      });

      vi.restoreAllMocks();
    });
  });

  describe("User retrieval via search string", () => {
    let dbOrderedUsers: { id: string; email: string }[];
    let dbUsersToSearch: { id: string; email: string }[];

    beforeEach(async () => {
      const usersToSearch = Array.from(
        { length: 25 },
        (_, i) =>
          `very_specific_user${String(i + 1).padStart(3, "0")}@specialdomain.com`,
      );
      dbUsersToSearch = usersToSearch.map((email) => createExpectedUser(email));
      const randomUsers = Array.from({ length: 50 }, () =>
        faker.internet.email(),
      );
      const unshuffledUsers = [...randomUsers, ...usersToSearch];
      const shuffledUsers = unshuffledUsers
        .map((value) => ({ value, sort: Math.random() }))
        .toSorted((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
      await Promise.all(shuffledUsers.map((email) => createUser(email)));
      dbOrderedUsers = shuffledUsers
        .toSorted((a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1))
        .map((email) => createExpectedUser(email));
    });

    const getPaginatedUsers = async ({
      searchStr,
      pageSize,
      expectedUsers,
      expectedPageSize = DEFAULT_PAGE_SIZE,
      expectedTotalIterations,
    }: {
      searchStr?: string;
      pageSize?: string | number;
      expectedUsers: typeof dbOrderedUsers;
      expectedPageSize?: number;
      expectedTotalIterations: number;
    }) => {
      let cursor: string | undefined;
      let iteration = 0;
      let allRetrievedUsers: { id: string; email: string }[] = [];

      do {
        const url = new URL("/v1/users", "http://localhost");
        if (searchStr) url.searchParams.append("searchStr", searchStr);
        if (pageSize) url.searchParams.append("pageSize", pageSize.toString());
        if (cursor) url.searchParams.append("cursor", cursor);

        const response = await app.inject({
          method: "GET",
          url: url.pathname + url.search,
        });

        const responseJson = response.json();
        expect(response.statusCode).toBe(200);
        expect(responseJson.status).toBe("success");
        expect(responseJson.pageSize).toBe(expectedPageSize);
        expect(responseJson.data).toStrictEqual(
          expectedUsers.slice(
            iteration * expectedPageSize,
            (iteration + 1) * expectedPageSize,
          ),
        );

        allRetrievedUsers = [...allRetrievedUsers, ...responseJson.data];
        cursor = responseJson.cursor;
        iteration++;

        if (iteration < expectedTotalIterations) {
          expect(cursor).toBeDefined();
        } else {
          expect(cursor).toBeUndefined();
        }
      } while (cursor !== undefined);

      expect(iteration).toBe(expectedTotalIterations);
      expect(allRetrievedUsers).toStrictEqual(expectedUsers);
    };

    it.each([
      { description: "empty searchStr", searchStr: "" },
      { description: "undefined searchStr", searchStr: undefined },
    ])(
      "retrieves with pagination all users if $description",
      async ({ searchStr }) => {
        await getPaginatedUsers({
          searchStr,
          expectedUsers: dbOrderedUsers,
          expectedTotalIterations: 8,
        });
      },
    );

    it("retrieves with pagination only users matching searchStr", async () => {
      await getPaginatedUsers({
        searchStr: "specialdomain.com",
        expectedUsers: dbUsersToSearch,
        expectedTotalIterations: 3,
      });
    });

    it.each([
      {
        description: "custom pageSize",
        pageSize: 5,
        expectedPageSize: 5,
        expectedTotalIterations: 15,
      },
      {
        description: "invalid pageSize",
        pageSize: "not-a-number",
        expectedPageSize: DEFAULT_PAGE_SIZE,
        expectedTotalIterations: 8,
      },
      {
        description: "pageSize greater than MAX_PAGE_SIZE",
        pageSize: 150,
        expectedPageSize: MAX_PAGE_SIZE,
        expectedTotalIterations: 1,
      },
    ])(
      "handles $description correctly",
      async ({ pageSize, expectedPageSize, expectedTotalIterations }) => {
        await getPaginatedUsers({
          pageSize,
          expectedUsers: dbOrderedUsers,
          expectedPageSize,
          expectedTotalIterations,
        });
      },
    );

    it("returns error when encountering internal db error", async () => {
      vi.spyOn(db, "select").mockImplementationOnce(() => {
        throw new Error("Integration test mock database error");
      });

      const response = await app.inject({
        method: "GET",
        url: "/v1/users",
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toStrictEqual({
        status: "error",
        message: "Internal server error",
      });

      vi.restoreAllMocks();
    });
  });
});
