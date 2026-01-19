import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import session from "models/session";

const router = createRouter();
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const validSession = await session.validate(request.cookies.session_id);
  const renewedSessionObject = await session.renew(validSession.id);
  const userWithValidSession = await user.findOneById(validSession.user_id);

  controller.setSessionCookie(renewedSessionObject.token, response);

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  return response
    .status(200)
    .json(await user.removePasswordFromObject(userWithValidSession));
}
