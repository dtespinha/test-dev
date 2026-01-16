import orchestrator from "tests/orchestrator";

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runningPendingMigrations();
});

describe("GET /api/v1/users/{username}", () => {
  describe("Anonymous user", () => {
    describe("Search an user", () => {
      test("Existing user with exact case match", async () => {
        const user = {
          username: "testuser",
          email: "email@test.com",
          password: "test",
        };
        const createUserData = await orchestrator.createUser(user);

        const response = await fetch(
          `http://localhost:3000/api/v1/users/${createUserData.inputValues.username}`,
        );
        expect(response.status).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: createUserData.createdUser.id,
          username: createUserData.inputValues.username,
          email: createUserData.inputValues.email,
          created_at: `${new Date(createUserData.createdUser.created_at).toISOString()}`,
          updated_at: `${new Date(createUserData.createdUser.updated_at).toISOString()}`,
        });
      });

      test("Existing user with case mismatch", async () => {
        const user = {
          username: "Testuser",
          email: "email@test.com",
          password: "test",
        };
        const createUserData = await orchestrator.createUser(user);

        const response = await fetch(
          `http://localhost:3000/api/v1/users/${createUserData.inputValues.username}`,
        );
        expect(response.status).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: createUserData.createdUser.id,
          username: "testuser",
          email: createUserData.inputValues.email,
          created_at: `${new Date(createUserData.createdUser.created_at).toISOString()}`,
          updated_at: `${new Date(createUserData.createdUser.updated_at).toISOString()}`,
        });
      });

      test("User does not exist", async () => {
        const response = await fetch(
          "http://localhost:3000/api/v1/users/unexistentuser",
        );

        const responseBody = await response.json();
        expect(response.status).toBe(404);
        expect(responseBody.message).toBe("User not found.");
        expect(responseBody.action).toBe(
          "Please provide a already registered user.",
        );
        expect(responseBody.status_code).toBe(404);
      });
    });
  });
});
