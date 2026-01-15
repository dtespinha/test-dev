import orchestrator from "tests/orchestrator";

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runningPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    describe("Authenticate an user", () => {
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
