import { signOut } from "@/auth";
import {
  AuthInlineLink,
  AuthScreen,
  AuthSecondaryLinkButton,
  AuthSubmitButton,
} from "@/components/auth/auth-primitives";

async function signOutAction() {
  "use server";

  await signOut({ redirectTo: "/login" });
}

export default function LogoutPage() {
  return (
    <AuthScreen
      title="Sign out"
      subtitle="You are about to end your current session. You can sign back in again whenever you like."
      footer={
        <>
          Want to keep working? <AuthInlineLink href="/login">Return to Sign In</AuthInlineLink>
        </>
      }
    >
      <form action={signOutAction} className="flex flex-col gap-4">
        <AuthSubmitButton icon={false}>Sign out</AuthSubmitButton>
      </form>
      <AuthSecondaryLinkButton href="/dashboard">Cancel</AuthSecondaryLinkButton>
    </AuthScreen>
  );
}
