import { createRouter } from "next-connect";
import controller from "infra/controller";
import authentication from "models/authentication.js";
import session from "models/session.js";
import authorization from "models/authorization";
import { ForbidenError } from "infra/errors";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValues = request.body;

  const authenticateUser = await authentication.authenticateUser(
    userInputValues.email,
    userInputValues.password,
  );

  if (!authorization.can(authenticateUser, "create:session")) {
    throw new ForbidenError({
      message: "You do not have permission to log in.",
      action: "Contact user suppport.",
    });
  }

  const newSession = await session.create(authenticateUser.id);

  // Time in seconds
  controller.setSessionCookie(newSession.token, response);

  return response.status(201).json(newSession);
}

async function deleteHandler(request, response) {
  const sessionToken = request.cookies.session_id;

  if (!sessionToken) {
    return response.status(401).json({ error: "Session cookie is missing" });
  }
  const validSession = await session.validate(sessionToken);

  const revokedSession = await session.revoke(validSession.id);

  controller.clearSessionCookie(response);

  return response.status(200).json(revokedSession);
}
