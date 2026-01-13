import database from "infra/database.js";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.clearDatabase();
});

describe("PATCH /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Call with not allowed method", async () => {
      for (let i = 0; i < 1; i++) {
        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "PATCH",
          },
        );
        const responseBody = await response.json();
        expect(response.status).toBe(405);
        expect(responseBody.message).toBe(
          "Method not allowed for this endpoint.",
        );
        expect(responseBody.action).toBe(
          "Verify if the requested method is valid for this endpoint.",
        );
        expect(responseBody.status_code).toBe(405);
      }
      const response = await fetch("http://localhost:3000/api/v1/status");
      expect(response.status).toBe(200);
      const responseBody = await response.json();
      const updatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toBe(updatedAt);
      expect(responseBody.dependencies.database.version).toBe("16.11");
      expect(responseBody.dependencies.database.max_connections).toBe(100);
      expect(responseBody.dependencies.database.used_connections).toBe(1);
    });
  });
});
