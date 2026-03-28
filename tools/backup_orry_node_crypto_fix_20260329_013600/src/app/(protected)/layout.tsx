import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell/app-shell";
import { auth } from "@/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}