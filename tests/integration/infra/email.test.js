import email from "infra/email.js";
import orchestrator from "tests/orchestrator";

beforeEach(async () => {
  await orchestrator.deleteAllEmails();
});

afterEach(async () => {
  await orchestrator.deleteAllEmails();
});

describe("infra/email.js", () => {
  test("Send", async () => {
    await email.send({
      from: "TestDev <contato@bioespinhanews.com.br>",
      to: "espinha@bioespinhanews.com.br",
      subject: "Test Subject",
      text: "Body text",
    });

    await email.send({
      from: "TestDev <contato@bioespinhanews.com.br>",
      to: "espinha@bioespinhanews.com.br",
      subject: "Test Subject 2",
      text: "Body text 2",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<contato@bioespinhanews.com.br>");
    expect(lastEmail.recipients[0]).toBe("<espinha@bioespinhanews.com.br>");
    expect(lastEmail.subject).toBe("Test Subject 2");
    expect(lastEmail.text).toBe("Body text 2\n");
  });
});
