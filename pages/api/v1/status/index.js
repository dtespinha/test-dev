import { createRouter } from "next-connect";
import database from "infra/database.js";
import controller from "infra/controller";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const updatedAt = new Date().toISOString();

  const dbVersion = await database.query("SHOW server_version;");
  const dbVersionValue = dbVersion.rows[0].server_version;

  const dbMaxConnections = await database.query("SHOW max_connections;");
  const dbMaxConnectionsValue = dbMaxConnections.rows[0].max_connections;

  const databaseName = process.env.POSTGRES_DB;
  const dbUsedConnections = await database.query({
    text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [databaseName],
  });
  const dbUsedConnectionsValue = dbUsedConnections.rows[0].count;

  response.status(200).json({
    status: "ok",
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: dbVersionValue,
        max_connections: parseInt(dbMaxConnectionsValue),
        used_connections: dbUsedConnectionsValue,
      },
    },
  });
}
