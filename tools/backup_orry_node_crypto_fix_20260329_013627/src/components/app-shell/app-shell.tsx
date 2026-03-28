import Link from "next/link";
import { ReactNode } from "react";
import { auth, signOut } from "@/auth";

const navItems = [
  { href: "/dashboard", label: "Command" },
  { href: "/contacts", label: "Accounts" },
  { href: "/catalog", label: "Catalog" },
  { href: "/proposals", label: "Proposals" },
  { href: "/orders", label: "Orders" },
  { href: "/billing", label: "Billing" },
  { href: "/receipts", label: "Receipts" },
  { href: "/payments", label: "Payments" },
  { href: "/settings", label: "Settings" }
];

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export async function AppShell({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <div className="shell">
      <aside className="sidebar chrome-panel">
        <div className="brand-block">
          <span className="eyebrow">ORRY Control</span>
          <h1>ORRY Business Deck</h1>
          <p>Commercial workflow, billing visibility, and collection control in one surface.</p>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer chrome-panel subtle-panel">
          <div>
            <strong>{session?.user?.name ?? "ORRY operator"}</strong>
            <p>{session?.user?.role ?? "GUEST"}</p>
          </div>
          <form action={signOutAction}>
            <button className="button ghost-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}