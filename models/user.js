import database from "../infra/database.js";
import { ValidationError } from "infra/errors.js";

async function create(userInputValues) {
  await validateEmptyValues(
    userInputValues.username,
    userInputValues.email,
    userInputValues.password,
  );
  await validateEmail(userInputValues.email);
  await validateUsername(userInputValues.username);
  await validateUniqueValues(userInputValues.username, userInputValues.email);
  return await runInsertQuery(userInputValues);
}

async function validateEmptyValues(username, email, password) {
  const validations = [
    { field: "Username", value: username },
    { field: "Email", value: email },
    { field: "Password", value: password },
  ];

  for (const { field, value } of validations) {
    if (!value) {
      throw new ValidationError({
        message: `${field} is empty.`,
        action: `${field} must have a value.`,
      });
    }
  }
}

async function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email) && email.length <= 254;

  if (!isValid) {
    throw new ValidationError({
      message: "Email is invalid.",
      action: "Please provide a valid email address.",
    });
  }
}

async function validateUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

  if (!usernameRegex.test(username)) {
    throw new ValidationError({
      message: "Username is invalid.",
      action:
        "Username must be 3-20 characters long and contain only letters, numbers, and underscores.",
    });
  }
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
