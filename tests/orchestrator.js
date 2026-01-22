import { fakerPT_BR as faker } from "@faker-js/faker";
import retry from "async-retry";
import database from "../infra/database.js";
import migrator from "../models/migrator.js";
import user from "../models/user.js";
import password from "../models/password.js";
import session from "../models/session.js";
import activation from "../models/activation.js";

const emailHttpUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function waitForAllServices() {
  await waitForEmailServer();
  await waitForWebServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");

      if (response.status !== 200) {
        throw Error();
      }
    }
  }

  async function waitForEmailServer() {
    return retry(checkEmailServerAvailability, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function checkEmailServerAvailability() {
      const response = await fetch(emailHttpUrl);

      if (response.status !== 200) {
        throw Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("DROP schema public cascade; CREATE schema public;");
}

async function runningPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userInputValues = {}) {
  const username = (
    userInputValues.username ||
    faker.internet
      .username()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
  ).slice(0, 20);
  const email = userInputValues.email || faker.internet.email().toLowerCase();
  const password =
    userInputValues.password || faker.internet.password({ length: 12 });
  const inputValues = {
    username,
    email,
    password,
  };
  const createdUser = await user.create({ ...inputValues });
  const createdUserData = {
    inputValues: inputValues,
    createdUser: createdUser,
  };
  return createdUserData;
}

async function createSession(userId) {
  return await session.create(userId);
}

async function checkUserPasswordInDatabase(userInputValues) {
  const userInDatabase = await user.findOneByUsername(userInputValues.username);
  return await password.compare(
    userInputValues.password,
    userInDatabase.password,
  );
}

async function deleteAllEmails() {
  await fetch(`${emailHttpUrl}/messages`, {
    method: "DELETE",
  });
}

async function getLastEmail() {
  const emailListResponse = await fetch(`${emailHttpUrl}/messages`);
  const emailListBody = await emailListResponse.json();
  const lastEmailItem = emailListBody.pop();

  if (lastEmailItem) {
    const emailTextResponse = await fetch(
      `${emailHttpUrl}/messages/${lastEmailItem.id}.plain`,
    );
    const emailTextBody = await emailTextResponse.text();
    lastEmailItem.text = emailTextBody;

    return lastEmailItem;
  } else {
    return null;
  }
}

async function getUserIdByToken(tokenId) {
  const results = await database.query({
    text: `
    SELECT
      user_id
    FROM
      user_activation_tokens
    WHERE
      id = $1
    AND
      used_at IS NULL
    AND
      expires_at > NOW()
        ;`,
    values: [tokenId],
  });

  return results.rows[0].user_id;
}

function extractUUID(text) {
  const uuid = text.match(/[0-9a-fA-F-]{36}/);
  return uuid ? uuid[0] : null;
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runningPendingMigrations,
  checkUserPasswordInDatabase,
  createUser,
  createSession,
  deleteAllEmails,
  getLastEmail,
  getUserIdByToken,
  extractUUID,
};

export default orchestrator;
