import orchestrator from "tests/orchestrator";

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runningPendingMigrations();
});

describe("GET /api/v1/users/{username}", () => {
  describe("De user", () => {
    describe("Search an user", () => {
      test("Existing user with exact case match", async () => {
        const user = {
          username: "testuser",
          email: "email@test.com",
          password: "testpassword",
        };
        const createdUserData = await orchestrator.createUser(user);
        const activationToken = await orchestrator.createActivationToken(
          createdUserData.createdUser.id,
        );
        const activatedUserAndTokenData =
          await orchestrator.activateUserAndToken(
            createdUserData.createdUser.id,
            activationToken.id,
          );
        const session = await orchestrator.createSession(
          createdUserData.createdUser.id,
        );

        const response = await fetch(
          `http://localhost:3000/api/v1/users/${createdUserData.inputValues.username}`,
          {
            headers: { Cookie: `session_id=${session.token}` },
          },
        );
        expect(response.status).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: createdUserData.createdUser.id,
          username: createdUserData.inputValues.username,
          email: createdUserData.inputValues.email,
          features: [
            "create:session",
            "read:session",
            "read:user",
            "update:user",
          ],
          created_at: createdUserData.createdUser.created_at.toISOString(),
          updated_at:
            activatedUserAndTokenData.activatedUser.updated_at.toISOString(),
        });
      });

      test("Existing user with case mismatch", async () => {
        const user = {
          username: "Testuser",
          email: "email@test.com",
          password: "testpassword",
        };
        const createdUserData = await orchestrator.createUser(user);
        const activationToken = await orchestrator.createActivationToken(
          createdUserData.createdUser.id,
        );
        const activatedUserAndTokenData =
          await orchestrator.activateUserAndToken(
            createdUserData.createdUser.id,
            activationToken.id,
          );
        const session = await orchestrator.createSession(
          createdUserData.createdUser.id,
        );

        const response = await fetch(
          `http://localhost:3000/api/v1/users/${createdUserData.inputValues.username}`,
          {
            headers: { Cookie: `session_id=${session.token}` },
          },
        );
        expect(response.status).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: createdUserData.createdUser.id,
          username: "testuser",
          email: createdUserData.inputValues.email,
          features: [
            "create:session",
            "read:session",
            "read:user",
            "update:user",
          ],
          created_at: createdUserData.createdUser.created_at.toISOString(),
          updated_at:
            activatedUserAndTokenData.activatedUser.updated_at.toISOString(),
        });
      });

      test("User does not exist", async () => {
        const createdUserData = await orchestrator.createUser();
        const activationToken = await orchestrator.createActivationToken(
          createdUserData.createdUser.id,
        );
        await orchestrator.activateUserAndToken(
          createdUserData.createdUser.id,
          activationToken.id,
        );
        const session = await orchestrator.createSession(
          createdUserData.createdUser.id,
        );

        const response = await fetch(
          "http://localhost:3000/api/v1/users/unexistentuser",
          {
            headers: { Cookie: `session_id=${session.token}` },
          },
        );

        const responseBody = await response.json();
        expect(response.status).toBe(404);
        expect(responseBody.message).toBe("User not found.");
        expect(responseBody.action).toBe(
          "Please provide an already registered user.",
        );
        expect(responseBody.status_code).toBe(404);
      });
    });
  });
  describe("Anonymous user", () => {
    describe("Search an user", () => {
      test("Existing user with exact case match", async () => {
        const createdUserData = await orchestrator.createUser();

        const response = await fetch(
          `http://localhost:3000/api/v1/users/${createdUserData.inputValues.username}`,
        );
        expect(response.status).toBe(403);
        const responseBody = await response.json();
        expect(responseBody.message).toBe(
          "You do not have permission to execute this action.",
        );
        expect(responseBody.action).toBe(
          "Verify if your user has the feature read:user.",
        );
        expect(responseBody.status_code).toBe(403);
      });
    });
  });
});
