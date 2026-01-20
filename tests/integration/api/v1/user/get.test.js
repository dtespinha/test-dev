import orchestrator from "tests/orchestrator";
import session from "models/session";
import setCookieParser from "set-cookie-parser";

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runningPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Logged user", () => {
    describe("Renew user session", () => {
      test("With valid session", async () => {
        const createdUserData = await orchestrator.createUser({
          username: "userwithvalidsession",
        });
        const sessionCreated = await orchestrator.createSession(
          createdUserData.createdUser.id,
        );

        const response = await fetch(`http://localhost:3000/api/v1/user`, {
          headers: { Cookie: `session_id=${sessionCreated.token}` },
        });

        expect(response.status).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: createdUserData.createdUser.id,
          username: "userwithvalidsession",
          email: createdUserData.inputValues.email,
          created_at: createdUserData.createdUser.created_at.toISOString(),
          updated_at: createdUserData.createdUser.updated_at.toISOString(),
        });
        const renewedSessionObject = await session.validate(
          sessionCreated.token,
        );
        expect(
          renewedSessionObject.expires_at > sessionCreated.expires_at,
        ).toEqual(true);
        expect(
          renewedSessionObject.updated_at > sessionCreated.updated_at,
        ).toEqual(true);

        const cookies = setCookieParser.parse(response, { map: true });

        expect(cookies.session_id).toEqual({
          name: "session_id",
          value: sessionCreated.token,
          httpOnly: true,
          path: "/",
          maxAge: session.EXPIRATION_IN_DAYS * 24 * 60 * 60,
        });
      });

      test("Session about to expire", async () => {
        jest.useFakeTimers({
          now: Date.now() - 30 * 24 * 60 * 60 * 1000 + 60000,
        });

        const createdUserData = await orchestrator.createUser({
          username: "userwithvalidsession",
        });
        const sessionCreated = await orchestrator.createSession(
          createdUserData.createdUser.id,
        );

        jest.useRealTimers();

        const response = await fetch(`http://localhost:3000/api/v1/user`, {
          headers: { Cookie: `session_id=${sessionCreated.token}` },
        });

        expect(response.status).toBe(200);

        const cacheControl = response.headers.get("Cache-Control");

        expect(cacheControl).toBe(
          "no-store, no-cache, max-age=0, must-revalidate",
        );

        const responseBody = await response.json();
        expect(responseBody).toEqual({
          id: createdUserData.createdUser.id,
          username: "userwithvalidsession",
          email: createdUserData.inputValues.email,
          created_at: createdUserData.createdUser.created_at.toISOString(),
          updated_at: createdUserData.createdUser.updated_at.toISOString(),
        });
        const renewedSessionObject = await session.validate(
          sessionCreated.token,
        );

        expect(
          renewedSessionObject.expires_at > sessionCreated.expires_at,
        ).toEqual(true);
        expect(
          renewedSessionObject.updated_at > sessionCreated.updated_at,
        ).toEqual(true);

        const cookies = setCookieParser.parse(response, { map: true });

        expect(cookies.session_id).toEqual({
          name: "session_id",
          value: sessionCreated.token,
          httpOnly: true,
          path: "/",
          maxAge: session.EXPIRATION_IN_DAYS * 24 * 60 * 60,
        });
      });

      test("With non existent session", async () => {
        const response = await fetch(`http://localhost:3000/api/v1/user`, {
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

        const response = await fetch(`http://localhost:3000/api/v1/user`, {
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
