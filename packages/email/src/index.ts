import { Resend } from "resend";
import * as React from "react";
import { NewResponseEmail } from "./templates/new-response";
import { ResponseConfirmationEmail } from "./templates/response-confirmation";
import { WelcomeEmail } from "./templates/welcome";

export interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
}

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env["RESEND_API_KEY"]) return null;
  if (!resend) resend = new Resend(process.env["RESEND_API_KEY"]);
  return resend;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const client = getResend();
  if (!client) {
    console.log("[email] RESEND_API_KEY not set — logging instead:");
    console.log(`  To: ${options.to}`);
    console.log(`  Subject: ${options.subject}`);
    return;
  }

  const from = process.env["EMAIL_FROM"] ?? "FormForge <noreply@formforge.dev>";
  const { error } = await client.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    react: options.react,
  });
  if (error) console.error("[email] Resend error:", error);
}

export async function sendNewResponseEmail(opts: {
  to: string;
  formTitle: string;
  formId: string;
  responseId: string;
  keyAnswers: Array<{ label: string; value: string }>;
  dashboardUrl: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: `New response on "${opts.formTitle}"`,
    react: React.createElement(NewResponseEmail, opts),
  });
}

export async function sendResponseConfirmationEmail(opts: {
  to: string;
  formTitle: string;
  answers: Array<{ label: string; value: string }>;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: `Your response to "${opts.formTitle}" was received`,
    react: React.createElement(ResponseConfirmationEmail, {
      formTitle: opts.formTitle,
      answers: opts.answers,
    }),
  });
}

export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
  dashboardUrl: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: "Welcome to FormForge!",
    react: React.createElement(WelcomeEmail, { name: opts.name, dashboardUrl: opts.dashboardUrl }),
  });
}

export { WelcomeEmail } from "./templates/welcome";
export { NewResponseEmail } from "./templates/new-response";
export { ResponseConfirmationEmail } from "./templates/response-confirmation";
