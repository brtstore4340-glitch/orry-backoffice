import Link from "next/link";
import styles from "@/components/orry/erp.module.css";
import type { ReturnTypeOfGetWorkspaceLandingData } from "@/components/orry/types";

export function OrryWorkspaceHome({ data }: { data: ReturnTypeOfGetWorkspaceLandingData }) {
  return (
    <div className={styles.mainStack}>
      <section className={`${styles.infoCard} ${styles.hero}`}>
        <span className={styles.sectionLabel}>ORRY ERP</span>
        <h1 className={styles.heroTitle}>{data.title}</h1>
        <p className={styles.sectionText}>{data.description}</p>
      </section>

      <section className={styles.kpiGrid}>
        {data.kpis.map((item) => (
          <article className={styles.infoCard} key={item.label}>
            <span className={styles.cardLabel}>{item.label}</span>
            <strong className={styles.cardValue}>{item.value}</strong>
            <p className={styles.cardHint}>{item.hint}</p>
          </article>
        ))}
      </section>

      <section className={styles.overviewGrid}>
        {data.modules.map((module) => (
          <Link className={styles.moduleCard} href={module.href} key={module.key}>
            <span className={styles.sectionLabel}>{module.label}</span>
            <h2>{module.label}</h2>
            <p className={styles.sectionText}>Open the scoped ERP module page.</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
