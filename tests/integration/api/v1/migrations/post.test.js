import database from "infra/database.js";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.clearDatabase();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
          },
        );
        expect(response.status).toBe(201);
        const responseBody = await response.json();
        expect(Array.isArray(responseBody)).toBe(true);

        expect(responseBody[0].path).toContain(
          "infra/migrations/1765467921936_test-migration.js",
        );
        expect(responseBody[0].name).toBe("1765467921936_test-migration");

        let result = await database.query("SELECT count(*) FROM pgmigrations;");
        expect(parseInt(result.rows[0].count)).toBe(1);
        result = await database.query("SELECT * FROM pgmigrations;");
        expect(result.rows[0].name).toBe("1765467921936_test-migration");
      });

      test("No migration to be run", async () => {
        let response = await fetch("http://localhost:3000/api/v1/migrations", {
          method: "POST",
        });

        response = await fetch("http://localhost:3000/api/v1/migrations", {
          method: "POST",
        });
        expect(response.status).toBe(200);
        const responseBody = await response.json();
        expect(Array.isArray(responseBody)).toBe(true);
        expect(responseBody).toStrictEqual(new Array());

        let result = await database.query("SELECT count(*) FROM pgmigrations;");
        expect(parseInt(result.rows[0].count)).toBe(1);
        result = await database.query("SELECT * FROM pgmigrations;");
        expect(result.rows[0].name).toBe("1765467921936_test-migration");
      });
    });
  });
});
