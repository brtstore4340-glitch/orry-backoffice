import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import {
  AuthCheckbox,
  AuthField,
  AuthInlineLink,
  AuthNotice,
  AuthPasswordField,
  AuthScreen,
  AuthSubmitButton,
  AuthSuccess,
} from "@/components/auth/auth-primitives";

async function loginAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/dashboard",
  });
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; reset?: string }>;
}) {
  const search = searchParams ? await searchParams : undefined;

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Continue with one of the following options"
      footer={
        <>
          Need an account? <AuthInlineLink href="/register">Register</AuthInlineLink>
        </>
      }
    >
      {search?.reset === "success" ? (
        <AuthSuccess>Password updated successfully. Sign in with your new password.</AuthSuccess>
      ) : null}
      {search?.error === "invalid" ? (
        <AuthNotice>Incorrect credentials or your account is not approved yet.</AuthNotice>
      ) : null}
      {search?.error === "missing" ? (
        <AuthNotice>Please enter both email and password.</AuthNotice>
      ) : null}

      <form action={loginAction} className="flex flex-col gap-6">
        <AuthField
          icon="email"
          label="Email"
          name="email"
          type="email"
          placeholder="Email Address"
          autoComplete="email"
        />
        <div className="flex flex-col gap-3">
          <AuthPasswordField
            label="Password"
            name="password"
            placeholder="Password 8-16 character"
            autoComplete="current-password"
          />
          <div className="flex items-center justify-between gap-4">
            <AuthCheckbox name="remember" label="Remember me" />
            <AuthInlineLink href="/forgot-password">Forgot Password?</AuthInlineLink>
          </div>
        </div>
        <AuthSubmitButton icon={false}>Sign in</AuthSubmitButton>
      </form>
    </AuthScreen>
  );
}
