import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";
import { createRouter } from "next-connect";
import { InternalServerError, MethodNotAllowedError } from "infra/errors.js";

let dbClient;

const router = createRouter();
router.get(getHandler);
router.post(postHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({ cause: error });
  console.error(publicErrorObject);
  response.status(500).json(publicErrorObject);
  await dbClient.end();
}

async function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
  await dbClient.end();
}

async function getHandler(request, response) {
  dbClient = await database.getNewClient();

  const migrationOptions = {
    dbClient: dbClient,
    dryRun: true,
    dir: resolve("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  const pendingMigrations = await migrationRunner(migrationOptions);
  await dbClient.end();
  return response.status(200).json(pendingMigrations);
}

async function postHandler(request, response) {
  dbClient = await database.getNewClient();

  const migrationOptions = {
    dbClient: dbClient,
    dryRun: false,
    dir: resolve("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  const migratedMigrations = await migrationRunner(migrationOptions);

  if (migratedMigrations.length > 0) {
    await dbClient.end();
    return response.status(201).json(migratedMigrations);
  } else {
    await dbClient.end();
    return response.status(200).json(migratedMigrations);
  }
}
