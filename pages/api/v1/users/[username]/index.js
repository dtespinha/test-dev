import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";

const router = createRouter();
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userFound = await user.findOneByUsername(request.query.username);
  return response
    .status(200)
    .json(await user.removePasswordFromObject(userFound));
}
