import orchestrator from "tests/orchestrator";
import setCookieParser from "set-cookie-parser";
import { version as uuidVersion } from "uuid";

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runningPendingMigrations();
});

describe("DELETE /api/v1/user", () => {
  describe("Logged user", () => {
    describe("Delete session", () => {
      test("With valid session", async () => {
        const createdUserData = await orchestrator.createUser({
          username: "userwithvalidsession",
        });
        const sessionCreated = await orchestrator.createSession(
          createdUserData.createdUser.id,
        );

        let response = await fetch(`http://localhost:3000/api/v1/sessions`, {
          method: "DELETE",
          headers: { Cookie: `session_id=${sessionCreated.token}` },
        });

        expect(response.status).toBe(200);
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

        const createdAt = new Date(responseBody.created_at);
        const expiresAt = new Date(responseBody.expires_at);
        expect(createdAt > expiresAt).toBe(true);
        const diffInDays =
          (expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffInDays).toBeCloseTo(-335, 0);

        const cookies = setCookieParser.parse(response, { map: true });

        expect(cookies.session_id).toEqual({
          name: "session_id",
          value: "invalid",
          httpOnly: true,
          path: "/",
          maxAge: -1,
        });

        response = await fetch(`http://localhost:3000/api/v1/user`, {
          headers: {
            Cookie: `session_id=${sessionCreated.token}`,
          },
        });
        expect(response.status).toBe(401);
      });

      test("With non existent session", async () => {
        const response = await fetch(`http://localhost:3000/api/v1/sessions`, {
          method: "DELETE",
          headers: {
            Cookie: `session_id=f1913b70d0b65abd51837f9ee98abb2fd85960f1e2da65d8431bd29f00d47447d1e91z`,
          },
        });

        expect(response.status).toBe(401);
        const responseBody = await response.json();
        expect(responseBody.message).toBe("Session verification failed.");
        expect(responseBody.action).toBe("Verify provided token.");
        expect(responseBody.status_code).toBe(401);
      });

      test("With expired session", async () => {
        jest.useFakeTimers({
          now: Date.now() - 30 * 24 * 60 * 60 * 1000,
        });
        const createdUserData = await orchestrator.createUser({
          username: "userWithExpiredSession",
        });
        const sessionCreated = await orchestrator.createSession(
          createdUserData.createdUser.id,
        );
        jest.useRealTimers();

        const response = await fetch(`http://localhost:3000/api/v1/sessions`, {
          method: "DELETE",
          headers: {
            Cookie: `session_id=${sessionCreated.token}`,
          },
        });

        expect(response.status).toBe(401);
        const responseBody = await response.json();
        expect(responseBody.message).toBe("Session verification failed.");
        expect(responseBody.action).toBe("Verify provided token.");
        expect(responseBody.status_code).toBe(401);
      });
    });
  });
});
