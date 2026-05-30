import { redirect } from "next/navigation";
import { submitRegistration } from "@/lib/user-management";
import {
  AuthField,
  AuthInlineLink,
  AuthNotice,
  AuthPasswordField,
  AuthScreen,
  AuthSubmitButton,
  AuthSuccess,
} from "@/components/auth/auth-primitives";

async function registerAction(formData: FormData) {
  "use server";

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const [firstName, ...rest] = fullName.split(/\s+/).filter(Boolean);
  const lastName = rest.join(" ");

  if (!firstName || !lastName || !email || !password) {
    redirect("/register?error=validation");
  }

  try {
    await submitRegistration({
      email,
      firstName,
      lastName,
      employeeId: `WEB-${Date.now().toString().slice(-6)}`,
      dateOfBirth: "1990-01-01",
    });
    redirect("/register?success=1");
  } catch (error) {
    const code = error instanceof Error ? error.message : "server";
    if (code === "VALIDATION") redirect("/register?error=validation");
    if (code === "DUPLICATE_USER") redirect("/register?error=duplicate");
    redirect("/register?error=server");
  }
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const search = searchParams ? await searchParams : undefined;

  return (
    <AuthScreen
      title="Create account"
      subtitle="Complete the form below to request access."
      footer={
        <>
          Already have an account? <AuthInlineLink href="/login">Log In</AuthInlineLink>
        </>
      }
    >
      {search?.success === "1" ? (
        <AuthSuccess>Registration submitted. Check your inbox for your temporary password.</AuthSuccess>
      ) : null}
      {search?.error === "validation" ? (
        <AuthNotice>Please enter your full name, email, and password.</AuthNotice>
      ) : null}
      {search?.error === "duplicate" ? (
        <AuthNotice>An account with this email already exists.</AuthNotice>
      ) : null}
      {search?.error === "server" ? (
        <AuthNotice>Registration failed. Please try again in a moment.</AuthNotice>
      ) : null}

      <form action={registerAction} className="flex flex-col gap-6">
        <AuthField
          icon="user"
          label="Full name"
          name="fullName"
          placeholder="Full Name"
          autoComplete="name"
        />
        <AuthField
          icon="email"
          label="Email"
          name="email"
          type="email"
          placeholder="Email Address"
          autoComplete="email"
        />
        <AuthPasswordField
          label="Password"
          name="password"
          placeholder="Password 8-16 character"
          autoComplete="new-password"
        />
        <div className="flex flex-col gap-2">
          <div className="flex gap-1.5">
            <div className="h-1 flex-1 rounded-[999px] bg-[var(--danger)]" />
            <div className="h-1 flex-1 rounded-[999px] bg-[var(--danger)]" />
            <div className="h-1 flex-1 rounded-[999px] bg-[var(--border-strong)]" />
            <div className="h-1 flex-1 rounded-[999px] bg-[var(--border-strong)]" />
          </div>
          <p className="m-0 text-[12px] font-[400] text-[var(--muted)]">Use a strong password with uppercase and lowercase letters.</p>
        </div>
        <AuthSubmitButton icon={false}>Create account</AuthSubmitButton>
      </form>
    </AuthScreen>
  );
}
