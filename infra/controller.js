import * as cookie from "cookie";
import {
  UnauthorizedError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  ValidationError,
  ForbidenError,
} from "infra/errors.js";
import session from "models/session.js";
import user from "models/user";
import authorization from "models/authorization";

async function onErrorHandler(error, request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbidenError
  ) {
    return response.status(error.statusCode).json(error);
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(response);
    return response.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
    statusCode: error.statusCode,
  });

  console.error(publicErrorObject);

  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

async function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function setSessionCookie(token, response) {
  response.setHeader(
    "Set-Cookie",
    cookie.serialize("session_id", token, {
      path: "/",
      maxAge: session.EXPIRATION_IN_DAYS * 24 * 60 * 60,
      httpOnly: true,
      // Only set secure flag in production to allow HTTP in development
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    }),
  );
}

function clearSessionCookie(response) {
  response.setHeader(
    "Set-Cookie",
    cookie.serialize("session_id", "invalid", {
      path: "/",
      maxAge: -1,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    }),
  );
}

async function injectAnonymousOrUser(request, response, next) {
  if (request.cookies?.session_id) {
    await injectAuthenticatedUser(request);
    return next();
  }
  injectAnonymousUser(request);
  return next();
}

async function injectAuthenticatedUser(request) {
  const sessionToken = request.cookies.session_id;
  const sessionObject = await session.findValidSessionByToken(sessionToken);
  const userObject = await user.findOneById(sessionObject.user_id);

  request.context = {
    ...request.context,
    user: userObject,
  };
}

async function injectAnonymousUser(request) {
  const anonymousUserObject = {
    features: ["read:activation_token", "create:session", "create:user"],
  };
  request.context = {
    ...request.context,
    user: anonymousUserObject,
  };
}

function canRequest(feature) {
  return function canRequestMiddleware(request, response, next) {
    const userTryingToRequest = request.context.user;
    if (authorization.can(userTryingToRequest, feature)) {
      return next();
    }

    throw new ForbidenError({
      message: "You do not have permission to execute this action.",
      action: `Verify if your user has the feature ${feature}.`,
    });
  };
}

const controller = {
  errorHandlers: {
    onError: onErrorHandler,
    onNoMatch: onNoMatchHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};

export default controller;
