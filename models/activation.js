import email from "../infra/email";
import database from "../infra/database";
import webserver from "../infra/webserver";
import { NotFoundError, UnauthorizedError } from "../infra/errors";
import user from "../models/user";
import authorization from "./authorization";

// 15 minutes
const EXPIRATION_IN_MILISECONDS = 60 * 15 * 1000;

async function sendEmailToUser(user, token) {
  await email.send({
    from: "Test Dev <contato@bioespinhanews.com.br>",
    to: `${user.email}`,
    subject: "Ative seu cadastro no Bio Espinha News!",
    text: `${user.username}, clique no link abaixo para ativar seu link abaixo no Bio Espinha News

${webserver.origin}/register/activate/${token.id}

Atenciosamente,
Equipe do Bio Espinha News
`,
  });
}

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);

  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
    INSERT INTO
      user_activation_tokens (user_id, expires_at)
    VALUES
      ($1, $2)
    RETURNING
      *
    ;`,
      values: [userId, expiresAt],
    });
    return results.rows[0];
  }
}

async function activateToken(tokenId) {
  const updatedToken = await runActivateTokenQuery(tokenId);

  if (!updatedToken) {
    throw new NotFoundError({
      message: "Token not found.",
      action: "Please provide a valid token.",
    });
  }

  return updatedToken;

  async function runActivateTokenQuery(tokenId) {
    const results = await database.query({
      text: `
    UPDATE
      user_activation_tokens
    SET
      used_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
    WHERE
      id = $1
    AND
      used_at IS NULL
    AND
      expires_at > NOW()
    RETURNING
      *
    ;`,
      values: [tokenId],
    });
    return results.rows[0];
  }
}

async function activateUser(userId) {
  if (!userId) {
    throw new NotFoundError({
      message: "User could not be activated.",
      action: "Please provide a valid token.",
    });
  }

  const userToBeActivated = await user.findOneById(userId);

  if (!authorization.can(userToBeActivated, "read:activation_token")) {
    throw new UnauthorizedError({
      message: "You can not use activation tokens anymore",
      action: "Contact support.",
    });
  }

  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
    "read:user",
    "update:user",
  ]);
  return activatedUser;
}

async function findOneValidById(id) {
  const userFound = await queryById(id);
  return userFound;

  async function queryById(id) {
    const results = await database.query({
      text: `
    SELECT *
    FROM
      user_activation_tokens
    WHERE
      id = $1
    AND
      used_at IS NULL
    AND
      expires_at > NOW()
    LIMIT
      1
    ;`,
      values: [id],
    });

    if (!results.rows[0]) {
      throw new NotFoundError({
        message: "Token not found.",
        action: "Please provide a valid token.",
      });
    }

    return results.rows[0];
  }
}

const activation = {
  sendEmailToUser,
  create,
  activateToken,
  activateUser,
  findOneValidById,
};

export default activation;
