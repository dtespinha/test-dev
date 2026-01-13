import database from "../infra/database.js";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import { ServiceError } from "../infra/errors";

const migrationOptions = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  log: () => {},
  migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const migrations = await migrationRunner({
      ...migrationOptions,
      dbClient: dbClient,
    });

    return migrations;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      cause: error,
      message: "Error in database connection or query",
    });
    throw serviceErrorObject;
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const migrations = await migrationRunner({
      ...migrationOptions,
      dbClient: dbClient,
      dryRun: false,
    });

    return migrations;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      cause: error,
      message: "Error in database connection or query",
    });
    throw serviceErrorObject;
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
