import nodemailer from "nodemailer";
import { ServiceError } from "./errors";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: Number(process.env.EMAIL_SMTP_PORT),
  auth:
    process.env.EMAIL_SMTP_USER && process.env.EMAIL_SMTP_PASSWORD
      ? {
          user: process.env.EMAIL_SMTP_USER,
          pass: process.env.EMAIL_SMTP_PASSWORD,
        }
      : undefined,
  secure: process.env.NODE_ENV === "production",
});

async function send(mailOptions) {
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    const mailError = new ServiceError({
      cause: error,
      message: "Could not send email.",
      action: "Verify the request data and try again",
    });
    throw mailError;
  }
}

const email = {
  send,
};

export default email;
