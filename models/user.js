import database from "../infra/database.js";
import password from "../models/password.js";
import { ValidationError, NotFoundError } from "../infra/errors.js";

async function create(userInputValues) {
  await validateUsername(userInputValues.username);
  await validateUniqueUsername(userInputValues.username);
  await validateEmail(userInputValues.email);
  await validateUniqueEmail(userInputValues.email);
  await validatePassword(userInputValues.password);
  await hashPasswordInObject(userInputValues);
  injectDefaultFeaturesInObject(userInputValues);

  return await runInsertQuery(userInputValues);

  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: `
    INSERT INTO 
      users (username, email, password, features)
    VALUES 
      (LOWER($1), LOWER($2), $3, $4)
    RETURNING
      *
    ;`,
      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
        userInputValues.features,
      ],
    });
    return results.rows[0];
  }

  async function hashPasswordInObject(userInputValues) {
    const hashPassword = await password.hash(userInputValues.password);
    userInputValues.password = hashPassword;
    return userInputValues;
  }

  function injectDefaultFeaturesInObject(userInputValues) {
    userInputValues.features = ["read:activation_token"];
  }
}

async function update(username, userInputValues) {
  const userFound = await queryByUsername(username);

  if ("username" in userInputValues) {
    await validateUsername(userInputValues.username);
    await validateUniqueUsername(userInputValues.username, userFound.id);
  }
  if ("email" in userInputValues) {
    await validateEmail(userInputValues.email);
    await validateUniqueEmail(userInputValues.email, userFound.id);
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
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

async function validateEmail(email) {
  if (!email) {
    throw new ValidationError({
      message: "Email is required.",
      action: "Please provide a valid email address.",
    });
  }

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
  if (!username) {
    throw new ValidationError({
      message: "Username is required.",
      action:
        "Username must be 3-20 characters long and contain only letters, numbers, and underscores.",
    });
  }

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
  if (!password) {
    throw new ValidationError({
      message: "Password is invalid.",
      action: "Password cannot be empty.",
    });
  }

  if (password.length < 8 || password.length > 72) {
    throw new ValidationError({
      message: "Password is invalid.",
      action: "Please provide a password between 8 and 72 characters long.",
    });
  }
}

async function validateUniqueUsername(username, excludeUserId = null) {
  const query = excludeUserId
    ? {
        text: `
          SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2;
        `,
        values: [username, excludeUserId],
      }
    : {
        text: `
          SELECT id FROM users WHERE LOWER(username) = LOWER($1);
        `,
        values: [username],
      };

  const results = await database.query(query);

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "Username already exists.",
      action: "Please provide a different username.",
    });
  }
}

async function validateUniqueEmail(email, excludeUserId = null) {
  const query = excludeUserId
    ? {
        text: `
          SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2;
        `,
        values: [email, excludeUserId],
      }
    : {
        text: `
          SELECT id FROM users WHERE LOWER(email) = LOWER($1);
        `,
        values: [email],
      };

  const results = await database.query(query);

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
    SELECT *
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
      action: "Please provide an already registered user.",
    });
  }

  return results.rows[0];
}

async function queryByEmail(email) {
  const results = await database.query({
    text: `
    SELECT *
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
      action: "Please provide an already registered email.",
    });
  }

  return results.rows[0];
}

async function queryById(id) {
  const results = await database.query({
    text: `
    SELECT *
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
      action: "Please provide an already registered user.",
    });
  }

  return results.rows[0];
}

async function setFeatures(userId, features) {
  await runUpdateFeaturesQuery(userId, features);

  async function runUpdateFeaturesQuery(userId, features) {
    const results = await database.query({
      text: `
    UPDATE
      users
    SET
      features = $2,
      updated_at = timezone('utc', now())
    WHERE
      id = $1
    RETURNING
      *
    ;`,
      values: [userId, features],
    });
    return results.rows[0];
  }
}

const user = {
  create,
  update,
  findOneByUsername,
  findOneByEmail,
  findOneById,
  removePasswordFromObject,
  setFeatures,
};

export default user;
