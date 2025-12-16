test("GET to /api/vi/status should return as expected", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  expect(response.status).toBe(200);

  const responseBody = await response.json();

  const updatedAt = new Date(responseBody.updated_at).toISOString();
  expect(responseBody.status).toBe("ok");
  expect(responseBody.updated_at).toBe(updatedAt);
  expect(responseBody.dependencies.database.version).toBe("16.11");
  expect(responseBody.dependencies.database.max_connections).toBe(100);
  expect(responseBody.dependencies.database.used_connections).toBe(1);
});
