import email from "../infra/email";
import database from "../infra/database";
import webserver from "../infra/webserver";

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

const activation = {
  sendEmailToUser,
  create,
};

export default activation;
