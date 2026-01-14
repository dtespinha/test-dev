import database from "../infra/database.js";
import retry from "async-retry";
import migrator from "../models/migrator.js";
import user from "../models/user.js";
import password from "../models/password.js";

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

async function createUser(userInputValues) {
  return await user.create(userInputValues);
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
};

export default orchestrator;
