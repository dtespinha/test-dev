import { NotFoundError, UnauthorizedError } from "infra/errors.js";
import user from "models/user.js";
import password from "models/password.js";

async function authenticateUser(providedEmail, providedPassword) {
  try {
    const storedUser = await getStoredUserByEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);
    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Authentication failed.",
        action: "Verify provided email and password and try again.",
      });
    }
    throw error;
  }

  async function getStoredUserByEmail(providedEmail) {
    try {
      return await user.findOneByEmail(providedEmail);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Provided email is invalid.",
          action: "Verify provided email and try again.",
        });
      }
      throw error;
    }
  }

  async function validatePassword(providedPassword, storedPassword) {
    const validationResult = await password.compare(
      providedPassword,
      storedPassword,
    );
    if (!validationResult) {
      throw new UnauthorizedError({
        message: "Provided password is invalid.",
        action: "Verify provided password and try again.",
      });
    }
  }
}

const authentication = {
  authenticateUser,
};

export default authentication;
