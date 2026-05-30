import type { ReactNode } from "react";
import styles from "@/components/orry/erp.module.css";
import { OrrySidebar } from "@/components/orry/orry-sidebar";

export function OrryShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { name: string; role: string };
}) {
  return (
    <div className={styles.shell}>
      <div className={styles.frame}>
        <OrrySidebar />
        <div className={styles.content}>
          <header className={styles.topbar}>
            <div className={styles.searchRow}>
              <input aria-label="Search ERP workspace" className={styles.search} defaultValue="" placeholder="Search documents, products, vendors..." />
              <span className={styles.iconChip}>Unified ERP workspace</span>
            </div>
            <div className={styles.topbarMeta}>
              <span className={styles.iconChip}>3 notifications</span>
              <span className={styles.userChip}>
                {user.name} · {user.role}
              </span>
            </div>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
