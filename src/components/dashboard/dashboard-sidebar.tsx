import styles from "@/components/dashboard/dashstack-dashboard.module.css";
import type { DashboardBrand, DashboardNavSection } from "@/lib/dashboard/dashboard-data";

function SidebarItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      className={`${styles.sidebarItem} ${active ? styles.sidebarItemActive : ""}`.trim()}
      aria-current={active ? "page" : undefined}
    >
      <span className={styles.sidebarItemIcon} aria-hidden="true" />
      <span className={styles.sidebarItemLabel}>{label}</span>
    </button>
  );
}

export function DashboardSidebar({
  brand,
  sections,
}: {
  brand: DashboardBrand;
  sections: DashboardNavSection[];
}) {
  return (
    <aside className={styles.sidebar} aria-label="DashStack navigation">
      <div className={styles.logoBlock}>
        <div className={styles.logoMark} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div>
          <p className={styles.logoText}>{brand.name}</p>
          <span className={styles.logoCaption}>{brand.caption}</span>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.label} className={styles.navGroup}>
          <p className={styles.navLabel}>{section.label}</p>
          <div className={styles.navList}>
            {section.items.map((item) => (
              <SidebarItem key={`${section.label}-${item.label}`} label={item.label} active={item.active} />
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
