export const runtime = "nodejs";

import { redirect } from "next/navigation";
import { completePasswordReset, getResetSessionStatus } from "@/lib/user-management";
import {
  AuthInlineLink,
  AuthNotice,
  AuthPasswordField,
  AuthScreen,
  AuthSubmitButton,
  AuthSuccess,
} from "@/components/auth/auth-primitives";

async function resetPasswordAction(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || password !== confirmPassword) {
    redirect("/reset-password?error=policy");
  }

  try {
    await completePasswordReset({ password });
    redirect("/login?reset=success");
  } catch (error) {
    const code = error instanceof Error ? error.message : "RESET_SESSION_INVALID";
    if (code === "PASSWORD_POLICY") {
      redirect("/reset-password?error=policy");
    }
    redirect("/reset-password?error=invalid");
  }
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const search = searchParams ? await searchParams : undefined;
  const state = await getResetSessionStatus();

  return (
    <AuthScreen
      title="Reset password"
      subtitle={state.valid ? state.message : "This reset session is no longer available."}
      footer={
        state.valid ? (
          <>
            Return to <AuthInlineLink href="/login">Log In</AuthInlineLink>
          </>
        ) : (
          <>
            Need another link? <AuthInlineLink href="/forgot-password">Request reset again</AuthInlineLink>
          </>
        )
      }
    >
      {state.valid ? <AuthSuccess>Resetting password for {state.email}</AuthSuccess> : <AuthNotice>{state.message}</AuthNotice>}
      {search?.error === "policy" ? (
        <AuthNotice>Password confirmation does not match or password policy was not met.</AuthNotice>
      ) : null}
      {search?.error === "invalid" ? (
        <AuthNotice>This reset link is invalid or has expired.</AuthNotice>
      ) : null}

      {state.valid ? (
        <form action={resetPasswordAction} className="flex flex-col gap-6">
          <AuthPasswordField
            label="New Password"
            name="password"
            placeholder="Password 8-16 character"
            autoComplete="new-password"
          />
          <AuthPasswordField
            label="Confirm Password"
            name="confirmPassword"
            placeholder="Confirm password"
            autoComplete="new-password"
          />
          <AuthSubmitButton icon={false}>Save new password</AuthSubmitButton>
        </form>
      ) : null}
    </AuthScreen>
  );
}
