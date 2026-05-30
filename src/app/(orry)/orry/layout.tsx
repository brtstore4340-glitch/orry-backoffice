import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OrryShell } from "@/components/orry/orry-shell";

export const dynamic = "force-dynamic";

export default async function OrryWorkspaceLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <OrryShell user={{ name: session.user.name, role: session.user.role }}>{children}</OrryShell>;
}
