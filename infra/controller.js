import * as cookie from "cookie";
import {
  UnauthorizedError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  ValidationError,
} from "infra/errors.js";
import session from "models/session.js";

async function onErrorHandler(error, request, response) {
  if (error instanceof ValidationError || error instanceof NotFoundError) {
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

const controller = {
  errorHandlers: {
    onError: onErrorHandler,
    onNoMatch: onNoMatchHandler,
  },
  setSessionCookie,
  clearSessionCookie,
};

export default controller;
