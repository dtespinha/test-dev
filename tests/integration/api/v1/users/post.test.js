import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runningPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    describe("Create an user", () => {
      test("With unique data", async () => {
        const response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser",
            email: "test@test.com",
            password: "password",
          }),
        });
        expect(response.status).toBe(201);
        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: responseBody.id,
          username: "testuser",
          email: "test@test.com",
          password: responseBody.password,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
        });

        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      });

      test("Username already exists", async () => {
        let response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser",
            email: "test@test.com",
            password: "password",
          }),
        });

        expect(response.status).toBe(201);

        response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser",
            email: "test2@test.com",
            password: "password",
          }),
        });

        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.message).toBe("Username or Email already exists.");
        expect(responseBody.action).toBe(
          "Try creating with a different value.",
        );
        expect(responseBody.status_code).toBe(400);
      });

      test("Username already exists in a different case", async () => {
        let response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser",
            email: "test@test.com",
            password: "password",
          }),
        });

        expect(response.status).toBe(201);

        response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "Testuser",
            email: "test@test.com",
            password: "password",
          }),
        });

        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.message).toBe("Username or Email already exists.");
        expect(responseBody.action).toBe(
          "Try creating with a different value.",
        );
        expect(responseBody.status_code).toBe(400);
      });

      test("Email already exists", async () => {
        let response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser",
            email: "test@test.com",
            password: "password",
          }),
        });

        expect(response.status).toBe(201);

        response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser2",
            email: "test@test.com",
            password: "password",
          }),
        });

        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.message).toBe("Username or Email already exists.");
        expect(responseBody.action).toBe(
          "Try creating with a different value.",
        );
        expect(responseBody.status_code).toBe(400);
      });

      test("Email already exists with a different case", async () => {
        let response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser",
            email: "test@test.com",
            password: "password",
          }),
        });

        expect(response.status).toBe(201);

        response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser2",
            email: "Test@test.com",
            password: "password",
          }),
        });

        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.message).toBe("Username or Email already exists.");
        expect(responseBody.action).toBe(
          "Try creating with a different value.",
        );
        expect(responseBody.status_code).toBe(400);
      });
    });
  });
});
