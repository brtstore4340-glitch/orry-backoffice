"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/components/orry/erp.module.css";
import { ORRY_NAVIGATION } from "@/lib/orry/navigation";

export function OrrySidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <span className={styles.brandEyebrow}>ORRY ERP</span>
      <h1 className={styles.brandTitle}>Enterprise Workspace</h1>
      <p className={styles.brandText}>Scoped UI, API, and workflow surface built under isolated ORRY routes.</p>

      {ORRY_NAVIGATION.map((group) => (
        <section className={styles.navGroup} key={group.key}>
          <span className={styles.sectionLabel}>{group.label}</span>
          <ul className={styles.navList}>
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.key}>
                  <Link className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`.trim()} href={item.href}>
                    <span>{item.label}</span>
                    <span>{active ? "•" : ""}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </aside>
  );
}
