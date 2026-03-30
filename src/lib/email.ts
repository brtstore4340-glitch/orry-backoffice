import "server-only";
import { getRuntimeEnv } from "@/lib/env";

export class EmailDeliveryError extends Error {
  constructor(message = "EMAIL_DELIVERY_FAILED") {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

async function sendEmail(input: SendEmailInput) {
  const env = getRuntimeEnv();

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new EmailDeliveryError("EMAIL_TRANSPORT_UNAVAILABLE");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new EmailDeliveryError();
  }
}

function wrapBody(title: string, intro: string, body: string) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#21140d;max-width:640px;margin:0 auto;padding:24px;background:#fffaf7">
      <p style="letter-spacing:0.18em;font-size:12px;text-transform:uppercase;color:#8f5d7e;margin:0 0 12px">ORRY Serenity Kiss</p>
      <h1 style="font-size:28px;margin:0 0 12px">${title}</h1>
      <p style="margin:0 0 16px">${intro}</p>
      ${body}
      <p style="margin:24px 0 0;color:#5f4363">If you did not expect this email, please contact your administrator.</p>
    </div>
  `;
}

export async function sendTemporaryPasswordEmail(input: {
  email: string;
  fullName: string;
  temporaryPassword: string;
  approvedImmediately: boolean;
}) {
  const intro = input.approvedImmediately
    ? `A back-office account has been created for ${input.fullName}.`
    : `Your ORRY registration request for ${input.fullName} has been recorded.`;
  const accessNote = input.approvedImmediately
    ? "You can sign in immediately with the temporary password below."
    : "Your account remains pending administrator approval. Keep the temporary password below and wait for approval before signing in.";

  await sendEmail({
    to: input.email,
    subject: "ORRY account credentials",
    text: `${intro}\n\n${accessNote}\n\nTemporary password: ${input.temporaryPassword}`,
    html: wrapBody(
      "Account credentials",
      intro,
      `<p>${accessNote}</p><p style="font-size:18px;font-weight:700;margin:18px 0">Temporary password: <span style="font-family:monospace">${input.temporaryPassword}</span></p>`
    )
  });
}

export async function sendPasswordResetEmail(input: {
  email: string;
  fullName: string;
  resetUrl: string;
}) {
  await sendEmail({
    to: input.email,
    subject: "Reset your ORRY password",
    text: `A password reset was requested for ${input.fullName}. Use the following link to set a new password: ${input.resetUrl}`,
    html: wrapBody(
      "Reset password",
      `A password reset was requested for ${input.fullName}.`,
      `<p>Use the secure link below to set a new password.</p><p style="margin:20px 0"><a href="${input.resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#f1c9a2;color:#21140d;text-decoration:none;font-weight:700">Reset password</a></p><p style="word-break:break-all;color:#5f4363">${input.resetUrl}</p>`
    )
  });
}
