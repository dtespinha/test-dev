import database from "../infra/database.js";
import retry from "async-retry";
import migrator from "../models/migrator.js";

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

async function createUser(user) {
  const results = await database.query({
    text: `
    INSERT INTO 
      users (username, email, password)
    VALUES 
      (LOWER($1), LOWER($2), $3)
    RETURNING
      *
    ;`,
    values: [user.username, user.email, user.password],
  });
  return results.rows[0];
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runningPendingMigrations,
  createUser,
};

export default orchestrator;
