import database from "../infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function create(userInputValues) {
  await validateEmptyValues(userInputValues);
  await validateEmail(userInputValues.email);
  await validateUsername(userInputValues.username);
  await validatePassword(userInputValues.password);
  await validateUniqueValues(userInputValues.username, userInputValues.email);
  return await runInsertQuery(userInputValues);
}

async function findOneByUsername(username) {
  await validateEmptyValues({ username: username });
  await validateUsername(username);
  const userFound = await queryByUsername(username);
  await checkUserExists(userFound);
  return userFound;
}

async function validateEmptyValues(fieldsObj) {
  const fieldNames = {
    username: "Username",
    email: "Email",
    password: "Password",
  };

  for (const [fieldName, fieldValue] of Object.entries(fieldsObj)) {
    const displayName = fieldNames[fieldName] || fieldName;

    if (!fieldValue || fieldValue.trim() === "") {
      throw new ValidationError({
        message: `${displayName} is empty.`,
        action: `${displayName} must have a value.`,
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

async function validatePassword(password) {
  if (password.length > 72) {
    throw new ValidationError({
      message: "Password is invalid.",
      action: "Please provide a password with less than 72 characters.",
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

async function queryByUsername(username) {
  const results = await database.query({
    text: `
    SELECT id, username, email, created_at, updated_at
    FROM    
      users
    WHERE
      username = LOWER($1)
    LIMIT
      1
    ;`,
    values: [username],
  });
  return results.rows[0];
}

async function checkUserExists(user) {
  if (!user) {
    throw new NotFoundError({
      message: "User not found.",
      action: "Please provide a already registered user.",
    });
  }
}

const user = {
  create,
  findOneByUsername,
};

export default user;
