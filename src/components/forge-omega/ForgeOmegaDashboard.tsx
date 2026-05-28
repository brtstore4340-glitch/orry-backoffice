import Link from "next/link";
import styles from "@/components/orry/erp.module.css";

const statusCards = [
  {
    label: "Oracle brain",
    value: "Tham + Omega",
    hint: "Command-center framing for orchestration, memory, routing, and proof.",
  },
  {
    label: "Execution lanes",
    value: "6 active lanes",
    hint: "Queue, review, live logs, quick actions, provider routing, and health.",
  },
  {
    label: "Oracle wire",
    value: "/orry + /api/orry/*",
    hint: "This repo already exposes the ORRY workspace shell and resource API wiring.",
  },
  {
    label: "Deploy posture",
    value: "Repo-ready",
    hint: "UI route is now present in the app build instead of pointing at a missing component.",
  },
] as const;

const surfaces = [
  {
    href: "/orry",
    label: "ORRY workspace",
    description: "Open the ORRY shell that already acts as the live business workspace surface.",
  },
  {
    href: "/orry/products",
    label: "Products lane",
    description: "Jump into the ERP product surface that the command center can route operators toward.",
  },
  {
    href: "/api/orry/products",
    label: "Oracle wire: products API",
    description: "Verify the resource API wiring that backs the ORRY runtime data plane.",
  },
  {
    href: "/api/orry/gl",
    label: "Oracle wire: GL API",
    description: "Inspect the finance-side resource endpoint used by the ORRY domain store.",
  },
] as const;

const capabilityNotes = [
  "Forge Omega in this repo is positioned as a command-center view layered on top of the ORRY workspace rather than a separate app.",
  "The active oracle wire already exists under /api/orry/[resource] with domain validation and transition guards in the server store.",
  "The remaining production blocker is deployment environment/auth, not a missing /forge-omega UI entrypoint anymore.",
] as const;

export default function ForgeOmegaDashboard() {
  return (
    <div className={styles.mainStack}>
      <section className={`${styles.infoCard} ${styles.hero}`}>
        <span className={styles.sectionLabel}>Forge Omega</span>
        <h1 className={styles.heroTitle}>Oracle command center for ORRY runtime, queue, proof, and lane routing.</h1>
        <p className={styles.sectionText}>
          This dashboard restores the missing Forge Omega entrypoint and anchors it to the ORRY workspace + API wiring already living in this repository.
        </p>
      </section>

      <section className={styles.kpiGrid}>
        {statusCards.map((card) => (
          <article className={styles.infoCard} key={card.label}>
            <span className={styles.cardLabel}>{card.label}</span>
            <strong className={styles.cardValue}>{card.value}</strong>
            <p className={styles.cardHint}>{card.hint}</p>
          </article>
        ))}
      </section>

      <section className={styles.infoCard}>
        <span className={styles.sectionLabel}>What is wired now</span>
        {capabilityNotes.map((note) => (
          <p className={styles.sectionText} key={note}>
            {note}
          </p>
        ))}
      </section>

      <section className={styles.overviewGrid}>
        {surfaces.map((surface) => (
          <Link className={styles.moduleCard} href={surface.href} key={surface.href}>
            <span className={styles.sectionLabel}>{surface.label}</span>
            <h2>{surface.label}</h2>
            <p className={styles.sectionText}>{surface.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
