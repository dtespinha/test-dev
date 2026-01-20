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
        const userInputValues = {
          username: "testuser",
          email: "test@test.com",
          password: "password",
        };
        const response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userInputValues),
        });
        expect(response.status).toBe(201);
        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: responseBody.id,
          username: userInputValues.username,
          email: userInputValues.email,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
        });

        const correctPasswordMatch =
          await orchestrator.checkUserPasswordInDatabase(userInputValues);
        expect(correctPasswordMatch).toBe(true);
        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      });

      test("With unique data - username starts with number", async () => {
        const userInputValues = {
          username: "1test",
          email: "test@test.com",
          password: "password",
        };
        let response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userInputValues),
        });

        expect(response.status).toBe(201);
        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: responseBody.id,
          username: userInputValues.username,
          email: userInputValues.email,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
        });

        const correctPasswordMatch =
          await orchestrator.checkUserPasswordInDatabase(userInputValues);
        expect(correctPasswordMatch).toBe(true);
        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      });

      test("With unique data - password with maximum allowed size", async () => {
        const userInputValues = {
          username: "testuser",
          email: "test@test.com",
          password:
            "passwordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpassword",
        };
        let response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userInputValues),
        });

        expect(response.status).toBe(201);
        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: responseBody.id,
          username: userInputValues.username,
          email: userInputValues.email,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
        });

        const correctPasswordMatch =
          await orchestrator.checkUserPasswordInDatabase(userInputValues);
        expect(correctPasswordMatch).toBe(true);
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
        expect(responseBody.message).toBe("Username already exists.");
        expect(responseBody.action).toBe(
          "Please provide a different username.",
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
        expect(responseBody.message).toBe("Username already exists.");
        expect(responseBody.action).toBe(
          "Please provide a different username.",
        );
        expect(responseBody.status_code).toBe(400);
      });

      test("Empty username", async () => {
        let response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "",
            email: "test@test.com",
            password: "password",
          }),
        });

        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.message).toBe("Username is required.");
        expect(responseBody.action).toBe(
          "Username must be 3-20 characters long and contain only letters, numbers, and underscores.",
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
        expect(responseBody.message).toBe("Email already exists.");
        expect(responseBody.action).toBe("Please provide a different email.");
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
        expect(responseBody.message).toBe("Email already exists.");
        expect(responseBody.action).toBe("Please provide a different email.");
        expect(responseBody.status_code).toBe(400);
      });

      test("Empty email", async () => {
        let response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "test",
            email: "",
            password: "password",
          }),
        });

        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.message).toBe("Email is required.");
        expect(responseBody.action).toBe(
          "Please provide a valid email address.",
        );
        expect(responseBody.status_code).toBe(400);
      });

      test("Empty password", async () => {
        let response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "test",
            email: "test@test.com",
            password: "",
          }),
        });

        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.message).toBe("Password is invalid.");
        expect(responseBody.action).toBe(
          "Please provide a password with less than 72 characters.",
        );
        expect(responseBody.status_code).toBe(400);
      });

      test("Invalid username - too short", async () => {
        let response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "ab",
            email: "test@test.com",
            password: "SecurePass123",
          }),
        });

        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.message).toBe("Username is invalid.");
        expect(responseBody.action).toBe(
          "Username must be 3-20 characters long and contain only letters, numbers, and underscores.",
        );
        expect(responseBody.status_code).toBe(400);
      });

      test("Invalid username - too long", async () => {
        let response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "thisusernameistoolongforthesystem",
            email: "test@test.com",
            password: "SecurePass123",
          }),
        });

        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.message).toBe("Username is invalid.");
        expect(responseBody.action).toBe(
          "Username must be 3-20 characters long and contain only letters, numbers, and underscores.",
        );
        expect(responseBody.status_code).toBe(400);
      });

      test("Invalid username - contains special characters", async () => {
        let response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "test@user",
            email: "test@test.com",
            password: "SecurePass123",
          }),
        });

        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.message).toBe("Username is invalid.");
        expect(responseBody.action).toBe(
          "Username must be 3-20 characters long and contain only letters, numbers, and underscores.",
        );
        expect(responseBody.status_code).toBe(400);
      });

      test("Invalid email - missing @", async () => {
        let response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "test",
            email: "testtest.com",
            password: "SecurePass123",
          }),
        });

        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.message).toBe("Email is invalid.");
        expect(responseBody.action).toBe(
          "Please provide a valid email address.",
        );
        expect(responseBody.status_code).toBe(400);
      });

      test("Invalid email - missing domain", async () => {
        let response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "test",
            email: "test@test",
            password: "SecurePass123",
          }),
        });

        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.message).toBe("Email is invalid.");
        expect(responseBody.action).toBe(
          "Please provide a valid email address.",
        );
        expect(responseBody.status_code).toBe(400);
      });

      test("Invalid email - contains spaces", async () => {
        let response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "test",
            email: "test @test.com",
            password: "SecurePass123",
          }),
        });

        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.message).toBe("Email is invalid.");
        expect(responseBody.action).toBe(
          "Please provide a valid email address.",
        );
        expect(responseBody.status_code).toBe(400);
      });

      test("Invalid password - contains more than 72 characters", async () => {
        let response = await fetch("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "test",
            email: "test@test.com",
            password:
              "passwordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordp",
          }),
        });

        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.message).toBe("Password is invalid.");
        expect(responseBody.action).toBe(
          "Please provide a password with less than 72 characters.",
        );
        expect(responseBody.status_code).toBe(400);
      });
    });
  });
});
