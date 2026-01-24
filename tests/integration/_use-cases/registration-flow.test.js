import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.deleteAllEmails();
  await orchestrator.clearDatabase();
  await orchestrator.runningPendingMigrations();
});

describe("Use case: Registration Flow (All Successful)", () => {
  let createdUserResponseBody;
  let activationToken;
  let createdSession;
  test("Create user account", async () => {
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
    createdUserResponseBody = await response.json();
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();
    activationToken = orchestrator.extractUUID(lastEmail.text);

    expect(lastEmail.sender).toBe("<contato@bioespinhanews.com.br>");
    expect(lastEmail.recipients[0]).toBe("<test@test.com>");
    expect(lastEmail.subject).toBe("Ative seu cadastro no Bio Espinha News!");
    expect(lastEmail.text).toContain("testuser");
    expect(lastEmail.text).toContain(
      `http://localhost:3000/register/activate/${activationToken}`,
    );
    expect(await orchestrator.getUserIdByActivationToken(activationToken)).toBe(
      createdUserResponseBody.id,
    );
  });

  test("Activate account", async () => {
    const response = await fetch(
      `http://localhost:3000/api/v1/activations/${activationToken}`,
      {
        method: "PATCH",
      },
    );
    expect(response.status).toBe(200);
    const activationTokenData =
      await orchestrator.getActivationTokenData(activationToken);

    expect(activationTokenData.used_at).not.toBeNaN();
    const activatedUser = await orchestrator.getUserById(
      createdUserResponseBody.id,
    );

    expect(activatedUser.features).toEqual([
      "create:session",
      "read:session",
      "read:user",
      "edit:user",
    ]);
  });

  test("Login", async () => {
    const response = await fetch(`http://localhost:3000/api/v1/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com", password: "password" }),
    });
    expect(response.status).toBe(201);
    createdSession = await response.json();
  });

  test("Get user information", async () => {
    const response = await fetch(`http://localhost:3000/api/v1/user`, {
      headers: { Cookie: `session_id=${createdSession.token}` },
    });
    expect(response.status).toBe(200);
    createdSession = await response.json();
  });
});
