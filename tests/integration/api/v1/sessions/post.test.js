import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runningPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    describe("Authenticate an user", () => {
      test("With correct email and password", async () => {
        const createdUserData = await orchestrator.createUser();

        const response = await fetch(`http://localhost:3000/api/v1/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: createdUserData.inputValues.email,
            password: createdUserData.inputValues.password,
          }),
        });
        expect(response.status).toBe(201);
        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: responseBody.id,
          user_id: createdUserData.createdUser.id,
          token: responseBody.token,
          expires_at: responseBody.expires_at,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
        expect(Date.parse(responseBody.expires_at)).not.toBeNaN();

        const createdAt = new Date(responseBody.created_at);
        const expiresAt = new Date(responseBody.expires_at);
        const diffInDays =
          (expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffInDays).toBeCloseTo(30, 0);
      });

      test("With invalid email and valid password", async () => {
        const createdUserData = await orchestrator.createUser();

        const response = await fetch(`http://localhost:3000/api/v1/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "invalid@email.com",
            password: createdUserData.inputValues.password,
          }),
        });
        expect(response.status).toBe(401);
        const responseBody = await response.json();
        expect(responseBody.name).toBe("UnauthorizedError");
        expect(responseBody.message).toBe("Authentication failed.");
        expect(responseBody.action).toBe(
          "Verify provided email and password and try again.",
        );
        expect(responseBody.status_code).toBe(401);
      });

      test("With valid email and invalid password", async () => {
        const createdUserData = await orchestrator.createUser();

        const response = await fetch(`http://localhost:3000/api/v1/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: createdUserData.inputValues.email,
            password: "passworddd",
          }),
        });
        expect(response.status).toBe(401);
        const responseBody = await response.json();
        expect(responseBody.name).toBe("UnauthorizedError");
        expect(responseBody.message).toBe("Authentication failed.");
        expect(responseBody.action).toBe(
          "Verify provided email and password and try again.",
        );
        expect(responseBody.status_code).toBe(401);
      });

      test("With invalid email and password", async () => {
        await orchestrator.createUser();

        const response = await fetch(`http://localhost:3000/api/v1/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "userrrr",
            password: "passworddd",
          }),
        });
        expect(response.status).toBe(401);
        const responseBody = await response.json();
        expect(responseBody.name).toBe("UnauthorizedError");
        expect(responseBody.message).toBe("Authentication failed.");
        expect(responseBody.action).toBe(
          "Verify provided email and password and try again.",
        );
        expect(responseBody.status_code).toBe(401);
      });
    });
  });
});
