import database from "../infra/database.js";
import crypto from "node:crypto";
import { UnauthorizedError } from "../infra/errors.js";

const EXPIRATION_IN_DAYS = 30;

async function create(userId) {
  const token = generateToken();
  const expiresAt = getFutureDateByDays(EXPIRATION_IN_DAYS);

  const newSession = await runInsertQuery(token, userId, expiresAt);

  return newSession;

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

async function validate(token) {
  const validSession = await findValidSessionByToken(token);
  return validSession;

  async function findValidSessionByToken(token) {
    const results = await database.query({
      text: `
    SELECT
      *
    FROM
      sessions
    WHERE
      token = $1
    AND
      expires_at > NOW()
    ;`,
      values: [token],
    });

    if (!results.rows[0]) {
      throw new UnauthorizedError({
        cause: "Invalid session",
        message: "Session verification failed.",
        action: "Verify provided token.",
      });
    }

    return results.rows[0];
  }
}

async function renew(sessionId) {
  const extendedExpiresAt = getFutureDateByDays(EXPIRATION_IN_DAYS);
  const renewedSession = await runUpdateQuery(sessionId, extendedExpiresAt);
  return renewedSession;

  async function runUpdateQuery(sessionId, expiresAt) {
    const results = await database.query({
      text: `
    UPDATE
      sessions
    SET
      expires_at = $2,
      updated_at = NOW()
    WHERE
      id = $1
    RETURNING
      *
    ;`,
      values: [sessionId, expiresAt],
    });
    return results.rows[0];
  }
}

async function revoke(sessionId) {
  const revokedSession = await invalidateSession(sessionId);
  return revokedSession;

  async function invalidateSession(sessionId) {
    const results = await database.query({
      text: `
    UPDATE
      sessions
    SET
      expires_at = expires_at - interval '1 year',
      updated_at = NOW()
    WHERE
      id = $1
    RETURNING
      *
    ;`,
      values: [sessionId],
    });
    return results.rows[0];
  }
}

function getFutureDateByDays(days = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

const session = {
  create,
  validate,
  renew,
  revoke,
  EXPIRATION_IN_DAYS,
};

export default session;
