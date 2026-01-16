import database from "infra/database";
import crypto from "node:crypto";

const EXPIRATION_IN_DAYS = 30;

async function create(userId) {
  const token = generateToken();
  const expiresAt = getDateInDays(EXPIRATION_IN_DAYS);

  const newSession = await runInsertQuery(token, userId, expiresAt);

  return newSession;

  function getDateInDays(days = 0) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  function generateToken() {
    return crypto.randomBytes(48).toString("hex");
  }

  async function runInsertQuery(token, userId, expiresAt) {
    const results = await database.query({
      text: `
    INSERT INTO 
      sessions (token, user_id, expires_at)
    VALUES 
      ($1, $2, $3)
    RETURNING
      *
    ;`,
      values: [token, userId, expiresAt],
    });
    return results.rows[0];
  }
}

const session = {
  create,
  EXPIRATION_IN_DAYS
};

export default session;
