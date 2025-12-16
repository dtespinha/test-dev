import database from "infra/database.js";

beforeAll(cleanDatabase);

async function cleanDatabase() {
  await database.query("DROP schema public cascade; CREATE schema public;");
}

test("PATCH to /api/vi/migrations should return method not allowed", async () => {
  for (let i = 0; i < 1; i++) {
    const response = await fetch("http://localhost:3000/api/v1/migrations", {
      method: "PATCH",
    });
    const responseBody = await response.json();
    expect(response.status).toBe(405);
    expect(responseBody.error).toBe("Method PATCH not allowed");
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
