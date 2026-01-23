import orchestrator from "tests/orchestrator";

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runningPendingMigrations();
});

describe("PATCH /api/v1/activations", () => {
  describe("Anonymous user", () => {
    describe("Activate user", () => {
      test("With valid token", async () => {
        const createdUserData = await orchestrator.createUser();
        const activationToken = await orchestrator.createActivationToken(
          createdUserData.createdUser.id,
        );

        const response = await fetch(
          `http://localhost:3000/api/v1/activations/${activationToken.id}`,
          {
            method: "PATCH",
          },
        );

        expect(response.status).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: activationToken.id,
          used_at: responseBody.used_at,
          user_id: createdUserData.createdUser.id,
          expires_at: responseBody.expires_at,
          created_at: activationToken.created_at.toISOString(),
          updated_at: responseBody.updated_at,
        });

        expect(responseBody.used_at).toEqual(responseBody.updated_at);
        expect(
          activationToken.updated_at < new Date(responseBody.updated_at),
        ).toBe(true);
      });

      test("Token already used", async () => {
        const createdUserData = await orchestrator.createUser();
        const activationToken = await orchestrator.createActivationToken(
          createdUserData.createdUser.id,
        );

        let response = await fetch(
          `http://localhost:3000/api/v1/activations/${activationToken.id}`,
          {
            method: "PATCH",
          },
        );
        expect(response.status).toBe(200);

        response = await fetch(
          `http://localhost:3000/api/v1/activations/${activationToken.id}`,
          {
            method: "PATCH",
          },
        );
        expect(response.status).toBe(404);

        const responseBody = await response.json();
        expect(responseBody.message).toBe("Token not found.");
        expect(responseBody.action).toBe("Please provide a valid token.");
        expect(responseBody.status_code).toBe(404);
      });

      test("With expired token", async () => {
        jest.useFakeTimers({
          now: Date.now() - 60 * 16 * 1000,
        });
        const createdUserData = await orchestrator.createUser();
        const activationToken = await orchestrator.createActivationToken(
          createdUserData.createdUser.id,
        );
        jest.useRealTimers();

        const response = await fetch(
          `http://localhost:3000/api/v1/activations/${activationToken.id}`,
          {
            method: "PATCH",
          },
        );
        expect(response.status).toBe(404);

        const responseBody = await response.json();
        expect(responseBody.message).toBe("Token not found.");
        expect(responseBody.action).toBe("Please provide a valid token.");
        expect(responseBody.status_code).toBe(404);
      });
    });
  });
  describe("Default user", () => {
    describe("Activate account", () => {
      test("Token already used", async () => {
        const createdUserData = await orchestrator.createUser();
        const activationToken = await orchestrator.createActivationToken(
          createdUserData.createdUser.id,
        );
        await orchestrator.activateUserAndToken(
          createdUserData.createdUser.id,
          activationToken.id,
        );
        const createdSession = await orchestrator.createSession(
          createdUserData.createdUser.id,
        );

        const createdUserData2 = await orchestrator.createUser();
        const activationToken2 = await orchestrator.createActivationToken(
          createdUserData2.createdUser.id,
        );

        const response = await fetch(
          `http://localhost:3000/api/v1/activations/${activationToken2.id}`,
          {
            method: "PATCH",
            headers: { Cookie: `session_id=${createdSession.token}` },
          },
        );

        expect(response.status).toBe(403);

        const responseBody = await response.json();
        expect(responseBody.message).toBe(
          "You do not have permission to execute this action.",
        );
        expect(responseBody.action).toBe(
          "Verify if your user has the feature read:activation_token.",
        );
        expect(responseBody.status_code).toBe(403);
      });
    });
  });
});
