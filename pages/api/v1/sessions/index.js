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
  const authenticateUser = await authentication.authenticateUser(
    request.body.email,
    request.body.password,
  );
  const newSession = await session.create(authenticateUser.id);

  // Time in seconds
  controller.setSessionCookie(
    newSession.token,
    session.EXPIRATION_IN_DAYS * 24 * 60 * 60,
    response,
  );

  return response.status(201).json(newSession);
}

async function deleteHandler(request, response) {
  const sessionToken = request.cookies.session_id;
  const validSession = await session.validate(sessionToken);

  const revokedSession = await session.revoke(validSession.id);

  controller.setSessionCookie("invalid", -1, response);

  return response
    .status(200)
    .json(await user.removePasswordFromObject(revokedSession));
}
