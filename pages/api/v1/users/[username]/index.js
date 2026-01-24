import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import authorization from "models/authorization";
import { ForbidenError } from "infra/errors.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:user"), getHandler);
router.patch(controller.canRequest("edit:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userFound = await user.findOneByUsername(request.query.username);
  return response
    .status(200)
    .json(await user.removePasswordFromObject(userFound));
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;

  const targetUser = await user.findOneByUsername(username);
  const loggedUser = request.context.user;

  if (!authorization.can(loggedUser, "edit:user", targetUser)) {
    throw new ForbidenError({
      message: "You do not have permission to execute this action.",
      action: `Verify if your user has the feature edit:user for user ${username}.`,
    });
  }

  const updatedUser = await user.update(username, userInputValues);
  return response
    .status(200)
    .json(await user.removePasswordFromObject(updatedUser));
}
