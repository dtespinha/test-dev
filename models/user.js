import database from "../infra/database.js";
import { ValidationError } from "infra/errors.js";

async function create(userInputValues) {
  await validateUniqueValues(userInputValues.username, userInputValues.email);
  return await runInsertQuery(userInputValues);
}

async function validateUniqueValues(username, email) {
  const results = await database.query({
    text: `
    SELECT id FROM
        users
    WHERE 
      LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)
    ;`,
    values: [username, email],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "Username or Email already exists.",
      action: "Try creating with a different value.",
    });
  }
}

async function runInsertQuery(userInputValues) {
  const results = await database.query({
    text: `
    INSERT INTO 
      users (username, email, password)
    VALUES 
      (LOWER($1), LOWER($2), $3)
    RETURNING
      *
    ;`,
    values: [
      userInputValues.username,
      userInputValues.email,
      userInputValues.password,
    ],
  });
  return results.rows[0];
}

const user = {
  create,
};

export default user;
