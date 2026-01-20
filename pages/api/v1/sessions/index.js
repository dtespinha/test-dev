import { createRouter } from "next-connect";
import controller from "infra/controller";
import authentication from "models/authentication.js";
import session from "models/session.js";
import user from "models/user.js";

const router = createRouter();
router.post(postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const { email, password } = request.body || {};

  if (email == null || password == null) {
    return response
      .status(400)
      .json({ error: "Email and password are required." });
  }

  const authenticateUser = await authentication.authenticateUser(
    email,
    password,
  );
  const newSession = await session.create(authenticateUser.id);

  // Time in seconds
  controller.setSessionCookie(newSession.token, response);

  return response.status(201).json(newSession);
}

async function deleteHandler(request, response) {
  const sessionToken = request.cookies.session_id;

  if (!sessionToken) {
    return response
      .status(401)
      .json({ error: "Session cookie is missing" });
  }
  const validSession = await session.validate(sessionToken);

  const revokedSession = await session.revoke(validSession.id);

  controller.clearSessionCookie(response);

  return response.status(200).json(revokedSession);
}
