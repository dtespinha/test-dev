import { createRouter } from "next-connect";
import controller from "infra/controller";
import authentication from "models/authentication.js";

const router = createRouter();
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const authenticateUser = await authentication.authenticateUser(
    request.body.email,
    request.body.password,
  );
  return response.status(201).json({});
}
