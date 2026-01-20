import { fakerPT_BR as faker } from "@faker-js/faker";
import retry from "async-retry";
import database from "../infra/database.js";
import migrator from "../models/migrator.js";
import user from "../models/user.js";
import password from "../models/password.js";
import session from "../models/session.js";

async function waitForAllServices() {
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
  const password = userInputValues.password || faker.internet.password();
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

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runningPendingMigrations,
  checkUserPasswordInDatabase,
  createUser,
  createSession,
};

export default orchestrator;
