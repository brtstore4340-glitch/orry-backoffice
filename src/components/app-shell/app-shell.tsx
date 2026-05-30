import { ReactNode } from "react";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { NavLink } from "@/components/app-shell/nav-link";
import { thaiNavItems, thaiRoleLabels } from "@/lib/orry-labels";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export async function AppShell({ children }: { children: ReactNode }) {
  const session = await auth();
  const now = new Intl.DateTimeFormat("th-TH", { dateStyle: "long" }).format(new Date());
  const role = session?.user?.role;
  const canAccessAdmin = role === "ADMIN";
  const canAccessSensitiveSettings = role === "ADMIN" || role === "EXECUTIVE" || role === "FINANCE";
  const navItems = thaiNavItems.filter((item) => {
    if (item.href.startsWith("/admin")) {
      return canAccessAdmin;
    }

    if (item.href.startsWith("/settings/company") || item.href.startsWith("/settings/bank-accounts")) {
      return canAccessSensitiveSettings;
    }

    return true;
  });

  return (
    <div className="shell-frame">
      <div className="shell-backdrop" aria-hidden="true" />
      <div className="shell">
        <aside className="sidebar chrome-panel">
          <div className="brand-block">
            <span className="eyebrow">ศูนย์ควบคุมงานหลังบ้าน</span>
            <h1>ORRY Serenity Kiss</h1>
            <p>ศูนย์ข้อมูลบริษัท ลูกค้า สินค้า เอกสาร และบัญชีธนาคารจากพื้นที่ทำงานเดียว ที่อ่านง่ายและพร้อมใช้งานจริง</p>
          </div>

          <nav className="nav-list" aria-label="Primary navigation">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>

          <div className="sidebar-support subtle-panel">
            <span className="eyebrow">วันนี้</span>
            <strong>{now}</strong>
            <p>งานเร่งด่วน การอนุมัติ และการติดตามสถานะจะถูกรวมไว้ในพื้นที่ทำงานนี้</p>
          </div>

          <div className="sidebar-footer chrome-panel subtle-panel">
            <div className="sidebar-footer-copy">
              <small>ลงชื่อเข้าใช้เป็น</small>
              <strong>{session?.user?.name ?? "ผู้ใช้งาน ORRY"}</strong>
              <p>{session?.user?.role ? thaiRoleLabels[session.user.role] : "ผู้เยี่ยมชม"}</p>
            </div>
            <form action={signOutAction}>
              <button className="button ghost-button" type="submit">
                ออกจากระบบ
              </button>
            </form>
          </div>
        </aside>

        <main className="content-area">
          <header className="topbar chrome-panel">
            <div className="topbar-copy">
              <span className="eyebrow">พื้นที่ทำงานส่วนตัว</span>
              <strong>ระบบหลังบ้าน ORRY สำหรับงานบัญชี การขาย และการควบคุมข้อมูลหลัก</strong>
            </div>
            <div className="topbar-meta">
              <div className="topbar-chip">
                <span className="status-dot success" />
                พื้นที่ใช้งานจริง
              </div>
              {canAccessSensitiveSettings ? (
                <Link href="/settings/company" className="button ghost-button compact-button">
                  ตั้งค่าระบบ
                </Link>
              ) : null}
            </div>
          </header>
          <div className="content">{children}</div>
        </main>
      </div>
    </div>
  );
}
