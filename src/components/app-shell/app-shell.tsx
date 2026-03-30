import { ReactNode } from "react";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { NavLink } from "@/components/app-shell/nav-link";

const baseNavItems = [
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
  const now = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date());
  const navItems = session?.user?.role === "ADMIN"
    ? [...baseNavItems, { href: "/users", label: "Users" }]
    : baseNavItems;

  return (
    <div className="shell-frame">
      <div className="shell-backdrop" aria-hidden="true" />
      <div className="shell">
        <aside className="sidebar chrome-panel">
          <div className="brand-block">
            <span className="eyebrow">ORRY Serenity Kiss</span>
            <h1>Operations Command Center</h1>
            <p>Commercial control, inventory posture, billing discipline, and settlement readiness in one premium operator surface.</p>
          </div>

          <nav className="nav-list" aria-label="Primary navigation">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>

          <div className="sidebar-support subtle-panel">
            <span className="eyebrow">Today</span>
            <strong>{now}</strong>
            <p>High-priority commercial actions, approvals, and collections stay centered in this workspace.</p>
          </div>

          <div className="sidebar-footer chrome-panel subtle-panel">
            <div>
              <small>Signed in as</small>
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

        <main className="content-area">
          <header className="topbar chrome-panel">
            <div>
              <span className="eyebrow">Private operator deck</span>
              <strong>Luxury beauty business systems with executive-grade visibility.</strong>
            </div>
            <div className="topbar-meta">
              <div className="topbar-chip">
                <span className="status-dot success" />
                Live workspace
              </div>
              <Link href="/settings" className="button ghost-button compact-button">
                System settings
              </Link>
            </div>
          </header>
          <div className="content">{children}</div>
        </main>
      </div>
    </div>
  );
}
