import { createRouter } from "next-connect";
import controller from "infra/controller";
import authentication from "models/authentication.js";
import session from "models/session.js";
import * as cookie from "cookie";

const router = createRouter();
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const authenticateUser = await authentication.authenticateUser(
    request.body.email,
    request.body.password,
  );
  const newSession = await session.create(authenticateUser.id);

  const setCookie = cookie.serialize("session_id", newSession.token, {
    path: "/",
    // Time in seconds
    maxAge: session.EXPIRATION_IN_DAYS * 24 * 60 * 60,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  response.setHeader("Set-Cookie", setCookie);
  return response.status(201).json(newSession);
}
