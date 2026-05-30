import styles from "@/components/orry/erp.module.css";
import type { HealthTone } from "@/lib/orry/schema";

function toneClassName(tone?: HealthTone) {
  switch (tone) {
    case "ok":
      return styles.badgeOk;
    case "warning":
      return styles.badgeWarning;
    case "critical":
      return styles.badgeCritical;
    default:
      return styles.badgeNeutral;
  }
}

export function OrryStatusBadge({ label, tone }: { label: string; tone?: HealthTone }) {
  return <span className={`${styles.badge} ${toneClassName(tone)}`}>{label}</span>;
}
