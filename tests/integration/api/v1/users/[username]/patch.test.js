import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runningPendingMigrations();
});

describe("PATCH /api/v1/users/{username}", () => {
  describe("Default user", () => {
    describe("Update an user", () => {
      test("With unique username", async () => {
        const user = {
          username: "testuser",
        };
        const createdUserData = await orchestrator.createUser({ ...user });
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
          `http://localhost:3000/api/v1/users/${user.username}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Cookie: `session_id=${session.token}`,
            },
            body: JSON.stringify({
              username: "testuser2",
            }),
          },
        );
        expect(response.status).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: responseBody.id,
          username: "testuser2",
          email: createdUserData.inputValues.email,
          features: [
            "create:session",
            "read:session",
            "read:user",
            "edit:user",
          ],
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
        });

        const correctPasswordMatch =
          await orchestrator.checkUserPasswordInDatabase({
            ...createdUserData.inputValues,
            username: "testuser2",
          });
        expect(correctPasswordMatch).toBe(true);
        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      });

      test("With unique email", async () => {
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
          `http://localhost:3000/api/v1/users/${createdUserData.inputValues.username}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Cookie: `session_id=${session.token}`,
            },
            body: JSON.stringify({
              email: "email2@test.com",
            }),
          },
        );
        expect(response.status).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: responseBody.id,
          username: createdUserData.inputValues.username,
          email: "email2@test.com",
          features: [
            "create:session",
            "read:session",
            "read:user",
            "edit:user",
          ],
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
        });

        const correctPasswordMatch =
          await orchestrator.checkUserPasswordInDatabase({
            ...createdUserData.inputValues,
          });
        expect(correctPasswordMatch).toBe(true);
        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      });

      test("With unique password", async () => {
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
          `http://localhost:3000/api/v1/users/${createdUserData.inputValues.username}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Cookie: `session_id=${session.token}`,
            },
            body: JSON.stringify({
              password: "newpassword",
            }),
          },
        );
        expect(response.status).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: responseBody.id,
          username: createdUserData.inputValues.username,
          email: createdUserData.inputValues.email,
          features: [
            "create:session",
            "read:session",
            "read:user",
            "edit:user",
          ],
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
        });

        const correctPasswordMatch =
          await orchestrator.checkUserPasswordInDatabase({
            ...createdUserData.inputValues,
            password: "newpassword",
          });
        expect(correctPasswordMatch).toBe(true);
        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      });

      test("With unique password but same username and email", async () => {
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
          `http://localhost:3000/api/v1/users/${createdUserData.inputValues.username}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Cookie: `session_id=${session.token}`,
            },
            body: JSON.stringify({
              username: createdUserData.inputValues.username,
              email: createdUserData.inputValues.email,
              password: "newpassword",
            }),
          },
        );
        expect(response.status).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: responseBody.id,
          username: createdUserData.inputValues.username,
          email: createdUserData.inputValues.email,
          features: [
            "create:session",
            "read:session",
            "read:user",
            "edit:user",
          ],
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
        });

        const correctPasswordMatch =
          await orchestrator.checkUserPasswordInDatabase({
            ...createdUserData.inputValues,
            password: "newpassword",
          });
        expect(correctPasswordMatch).toBe(true);
        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      });

      test("Username not found", async () => {
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
          `http://localhost:3000/api/v1/users/user`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Cookie: `session_id=${session.token}`,
            },
            body: JSON.stringify({
              username: "testuser",
            }),
          },
        );
        expect(response.status).toBe(404);
        const responseBody = await response.json();
        expect(responseBody.message).toBe("User not found.");
        expect(responseBody.action).toBe(
          "Please provide an already registered user.",
        );
        expect(responseBody.status_code).toBe(404);
      });

      test("Username already exists", async () => {
        const createdUserData = await orchestrator.createUser();
        const createdUserData2 = await orchestrator.createUser();

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
          `http://localhost:3000/api/v1/users/${createdUserData.inputValues.username}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Cookie: `session_id=${session.token}`,
            },
            body: JSON.stringify({
              username: createdUserData2.inputValues.username,
            }),
          },
        );
        expect(response.status).toBe(400);
        const responseBody = await response.json();
        expect(responseBody.message).toBe("Username already exists.");
        expect(responseBody.action).toBe(
          "Please provide a different username.",
        );
        expect(responseBody.status_code).toBe(400);
      });

      test("Username invalid - empty", async () => {
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
          `http://localhost:3000/api/v1/users/${createdUserData.inputValues.username}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Cookie: `session_id=${session.token}`,
            },
            body: JSON.stringify({
              username: "",
            }),
          },
        );
        expect(response.status).toBe(400);
        const responseBody = await response.json();
        expect(responseBody.message).toBe("Username is required.");
        expect(responseBody.action).toBe(
          "Username must be 3-20 characters long and contain only letters, numbers, and underscores.",
        );
        expect(responseBody.status_code).toBe(400);
      });

      test("Username invalid - with spaces", async () => {
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
          `http://localhost:3000/api/v1/users/${createdUserData.inputValues.username}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Cookie: `session_id=${session.token}`,
            },
            body: JSON.stringify({
              username: "a a",
            }),
          },
        );
        expect(response.status).toBe(400);
        const responseBody = await response.json();
        expect(responseBody.message).toBe("Username is invalid.");
        expect(responseBody.action).toBe(
          "Username must be 3-20 characters long and contain only letters, numbers, and underscores.",
        );
        expect(responseBody.status_code).toBe(400);
      });

      test("Email already exists", async () => {
        const createdUserData = await orchestrator.createUser();
        const createdUserData2 = await orchestrator.createUser();
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
          `http://localhost:3000/api/v1/users/${createdUserData.inputValues.username}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Cookie: `session_id=${session.token}`,
            },
            body: JSON.stringify({
              email: createdUserData2.inputValues.email,
            }),
          },
        );
        expect(response.status).toBe(400);
        const responseBody = await response.json();
        expect(responseBody.message).toBe("Email already exists.");
        expect(responseBody.action).toBe("Please provide a different email.");
        expect(responseBody.status_code).toBe(400);
      });

      test("Email invalid - empty", async () => {
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
          `http://localhost:3000/api/v1/users/${createdUserData.inputValues.username}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Cookie: `session_id=${session.token}`,
            },
            body: JSON.stringify({
              email: "",
            }),
          },
        );
        expect(response.status).toBe(400);
        const responseBody = await response.json();
        expect(responseBody.message).toBe("Email is required.");
        expect(responseBody.action).toBe(
          "Please provide a valid email address.",
        );
        expect(responseBody.status_code).toBe(400);
      });

      test("Email invalid - with spaces", async () => {
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
          `http://localhost:3000/api/v1/users/${createdUserData.inputValues.username}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Cookie: `session_id=${session.token}`,
            },
            body: JSON.stringify({
              email: "a @a.com",
            }),
          },
        );
        expect(response.status).toBe(400);
        const responseBody = await response.json();
        expect(responseBody.message).toBe("Email is invalid.");
        expect(responseBody.action).toBe(
          "Please provide a valid email address.",
        );
        expect(responseBody.status_code).toBe(400);
      });
    });
  });
  describe("Anonymous user", () => {
    describe("Update an user", () => {
      test("User does not have permission", async () => {
        const createdUserData = await orchestrator.createUser();

        const response = await fetch(
          `http://localhost:3000/api/v1/users/${createdUserData.inputValues.username}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "testuser2",
            }),
          },
        );
        expect(response.status).toBe(403);
        const responseBody = await response.json();
        expect(responseBody.message).toBe(
          "You do not have permission to execute this action.",
        );
        expect(responseBody.action).toBe(
          "Verify if your user has the feature edit:user.",
        );
        expect(responseBody.status_code).toBe(403);
      });
    });
  });
});
