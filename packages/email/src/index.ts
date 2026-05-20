// Email scaffolding — sending logic implemented in Part 2

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(_options: SendEmailOptions): Promise<void> {
  // TODO Part 2: implement with Resend
  console.log("[email] scaffold — not sending:", _options.subject, "→", _options.to);
}

export { WelcomeEmail } from "./templates/welcome";
export { FormResponseEmail } from "./templates/form-response";
