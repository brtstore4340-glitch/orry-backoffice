import { redirect } from "next/navigation";
import { requestPasswordReset } from "@/lib/user-management";
import {
  AuthField,
  AuthInlineLink,
  AuthNotice,
  AuthScreen,
  AuthSubmitButton,
  AuthSuccess,
} from "@/components/auth/auth-primitives";

async function forgotPasswordAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  if (!email.trim()) {
    redirect("/forgot-password?error=missing");
  }

  await requestPasswordReset(email);
  redirect("/forgot-password?sent=1");
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; sent?: string }>;
}) {
  const search = searchParams ? await searchParams : undefined;

  return (
    <AuthScreen
      title="Forgot password"
      subtitle="Enter your email address to receive reset instructions."
      footer={
        <>
          Remember your password? <AuthInlineLink href="/login">Sign In</AuthInlineLink>
        </>
      }
    >
      {search?.sent === "1" ? (
        <AuthSuccess>If your account is eligible, a reset link has been sent to your email.</AuthSuccess>
      ) : null}
      {search?.error === "missing" ? <AuthNotice>Please enter your email address.</AuthNotice> : null}

      <form action={forgotPasswordAction} className="flex flex-col gap-6">
        <AuthField
          icon="email"
          label="Email"
          name="email"
          type="email"
          placeholder="Email Address"
          autoComplete="email"
        />
        <AuthSubmitButton icon={false}>Send reset link</AuthSubmitButton>
      </form>
    </AuthScreen>
  );
}
