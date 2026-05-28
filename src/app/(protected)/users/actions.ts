"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { requireRole, requireUser } from "@/lib/authorization";
import { createUserByAdmin, decideRegistration, isEmailTransportError } from "@/lib/user-management";

async function requireAdminUser() {
  const session = await auth();

  try {
    const user = requireUser(session);
    requireRole(user, ["ADMIN"]);
    return user;
  } catch {
    redirect(session?.user ? "/dashboard" : "/login");
  }
}

export async function createManagedUserAction(formData: FormData) {
  const actor = await requireAdminUser();

  try {
    await createUserByAdmin(actor.id, {
      email: String(formData.get("email") ?? ""),
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      employeeId: String(formData.get("employeeId") ?? ""),
      dateOfBirth: String(formData.get("dateOfBirth") ?? "")
    });
    revalidatePath("/admin/users");
    redirect("/admin/users?status=created");
  } catch (error) {
    if (isEmailTransportError(error)) {
      redirect("/admin/users?error=email");
    }
    redirect("/admin/users?error=create");
  }
}

export async function reviewRegistrationAction(formData: FormData) {
  const actor = await requireAdminUser();

  try {
    await decideRegistration({
      actorId: actor.id,
      userId: String(formData.get("userId") ?? ""),
      decision: String(formData.get("decision") ?? "") === "reject" ? "reject" : "approve"
    });
    revalidatePath("/admin/users");
    revalidatePath("/admin/approvals");
    redirect("/admin/approvals?status=reviewed");
  } catch {
    redirect("/admin/approvals?error=review");
  }
}
