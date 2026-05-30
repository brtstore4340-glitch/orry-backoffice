import Link from "next/link";
import styles from "@/components/orry/erp.module.css";
import { OrryActivityPanel } from "@/components/orry/orry-activity-panel";
import { OrryStatusBadge } from "@/components/orry/orry-status-badge";
import { OrryTableSection } from "@/components/orry/orry-table-section";
import type { OrryModulePageData } from "@/lib/orry/schema";

function toneClassName(tone?: OrryModulePageData["kpis"][number]["tone"]) {
  switch (tone) {
    case "ok":
      return styles.toneOk;
    case "warning":
      return styles.toneWarning;
    case "critical":
      return styles.toneCritical;
    default:
      return styles.toneNeutral;
  }
}

function actionClassName(tone?: "primary" | "secondary" | "ghost") {
  if (tone === "primary") return `${styles.actionLink} ${styles.actionPrimary}`;
  if (tone === "secondary") return `${styles.actionLink} ${styles.actionSecondary}`;
  return styles.actionLink;
}

export function OrryModulePage({ data }: { data: OrryModulePageData }) {
  return (
    <div className={styles.layoutGrid}>
      <div className={styles.mainStack}>
        <section className={`${styles.infoCard} ${styles.hero}`}>
          <div className={styles.heroHeader}>
            <div>
              <span className={styles.sectionLabel}>{data.eyebrow}</span>
              <h1 className={styles.heroTitle}>{data.title}</h1>
              <p className={styles.sectionText}>{data.description}</p>
              <p className={styles.pageSummary}>{data.summary}</p>
            </div>
            <div className={styles.actions}>
              {data.actions.map((action) => (
                <Link className={actionClassName(action.tone)} href={action.href} key={action.label}>
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.kpiGrid}>
          {data.kpis.map((item) => (
            <article className={styles.infoCard} key={item.label}>
              <span className={styles.cardLabel}>{item.label}</span>
              <strong className={`${styles.cardValue} ${toneClassName(item.tone)}`}>{item.value}</strong>
              <p className={styles.cardHint}>{item.hint}</p>
            </article>
          ))}
        </section>

        <section className={styles.infoCard}>
          <span className={styles.sectionLabel}>Filters / Tabs</span>
          <p className={styles.sectionText}>Quick slices for the current module.</p>
          <div className={styles.tabStrip}>
            {data.tabs.map((tab) => (
              <span className={`${styles.tab} ${tab.active ? styles.tabActive : ""}`.trim()} key={tab.label}>
                {tab.label} <OrryStatusBadge label={tab.value} tone={tab.active ? "neutral" : undefined} />
              </span>
            ))}
          </div>
        </section>

        <section className={styles.tableCard}>
          <div className={styles.heroHeader}>
            <div>
              <span className={styles.sectionLabel}>Data Table</span>
              <p className={styles.tableHint}>Virtualized automatically when the row count is greater than 50.</p>
            </div>
          </div>
          <OrryTableSection columns={data.columns} rows={data.rows} />
        </section>
      </div>
      <OrryActivityPanel items={data.activities} />
    </div>
  );
}
