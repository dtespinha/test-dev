import database from "../infra/database.js";
import password from "../models/password.js";
import { ValidationError, NotFoundError } from "../infra/errors.js";

async function create(userInputValues) {
  await validateUniqueUsername(userInputValues.username);
  await validateUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  await validateEmail(userInputValues.email);
  await validatePassword(userInputValues.password);

  await hashPasswordInObject(userInputValues);
  return await runInsertQuery(userInputValues);

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

  async function hashPasswordInObject(userInputValues) {
    const hashPassword = await password.hash(userInputValues.password);
    userInputValues.password = hashPassword;
    return userInputValues;
  }
}

async function update(username, userInputValues) {
  const userFound = await queryByUsername(username);

  if ("username" in userInputValues) {
    await validateUniqueUsername(userInputValues.username);
    await validateUsername(userInputValues.username);
  }
  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
    await validateEmail(userInputValues.email);
  }
  if ("password" in userInputValues) {
    await validatePassword(userInputValues.password);
    await hashPasswordInObject(userInputValues);
  }

  const userWithNewValues = { ...userFound, ...userInputValues };

  const updatedUser = await runUpdateQuery(username, userWithNewValues);
  return updatedUser;

  async function runUpdateQuery(username, userWithNewValues) {
    const results = await database.query({
      text: `
    UPDATE
      users
    SET
      username = LOWER($2),
      email = LOWER($3),
      password = $4,
      updated_at = timezone('utc', now())
    WHERE
      id = $1
    RETURNING
      *
    ;`,
      values: [
        userWithNewValues.id,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
      ],
    });
    return results.rows[0];
  }

  async function hashPasswordInObject(userInputValues) {
    const hashPassword = await password.hash(userInputValues.password);
    userInputValues.password = hashPassword;
    return userInputValues;
  }
}

async function findOneById(id) {
  const userFound = await queryById(id);
  return userFound;
}

async function findOneByUsername(username) {
  const userFound = await queryByUsername(username);
  return userFound;
}

async function findOneByEmail(email) {
  const userFound = await queryByEmail(email);
  return userFound;
}

async function removePasswordFromObject(user) {
  // eslint-disable-next-line no-unused-vars
  const { password, ...userwithoutPassword } = user;
  return userwithoutPassword;
}

async function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email) && email.length <= 254;

  if (!isValid || !email) {
    throw new ValidationError({
      message: "Email is invalid.",
      action: "Please provide a valid email address.",
    });
  }
}

async function validateUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

  if (!usernameRegex.test(username) || !username) {
    throw new ValidationError({
      message: "Username is invalid.",
      action:
        "Username must be 3-20 characters long and contain only letters, numbers, and underscores.",
    });
  }
}

async function validatePassword(password) {
  if (password.length > 72 || !password) {
    throw new ValidationError({
      message: "Password is invalid.",
      action: "Please provide a password with less than 72 characters.",
    });
  }
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: `
      SELECT id FROM users WHERE LOWER(username) = LOWER($1);
    `,
    values: [username],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "Username already exists.",
      action: "Please provide a different username.",
    });
  }
}

async function validateUniqueEmail(email) {
  const results = await database.query({
    text: `
      SELECT id FROM users WHERE LOWER(email) = LOWER($1);
    `,
    values: [email],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "Email already exists.",
      action: "Please provide a different email.",
    });
  }
}

async function queryByUsername(username) {
  const results = await database.query({
    text: `
    SELECT id, username, password, email, created_at, updated_at
    FROM    
      users
    WHERE
      username = LOWER($1)
    LIMIT
      1
    ;`,
    values: [username],
  });

  if (!results.rows[0]) {
    throw new NotFoundError({
      message: "User not found.",
      action: "Please provide a already registered user.",
    });
  }

  return results.rows[0];
}

async function queryByEmail(email) {
  const results = await database.query({
    text: `
    SELECT id, username, password, email, created_at, updated_at
    FROM
      users
    WHERE
      email = LOWER($1)
    LIMIT
      1
    ;`,
    values: [email],
  });

  if (!results.rows[0]) {
    throw new NotFoundError({
      message: "Email not found.",
      action: "Please provide a already registered email.",
    });
  }

  return results.rows[0];
}

async function queryById(id) {
  const results = await database.query({
    text: `
    SELECT id, username, password, email, created_at, updated_at
    FROM
      users
    WHERE
      id = $1
    LIMIT
      1
    ;`,
    values: [id],
  });

  if (!results.rows[0]) {
    throw new NotFoundError({
      message: "User not found.",
      action: "Please provide a already registered user.",
    });
  }

  return results.rows[0];
}

const user = {
  create,
  update,
  findOneByUsername,
  findOneByEmail,
  findOneById,
  removePasswordFromObject,
};

export default user;
