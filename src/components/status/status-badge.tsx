import { formatThaiStatusLabel } from "@/lib/orry-labels";

const toneClass: Record<string, string> = {
  DRAFT: "neutral",
  AWAITING_APPROVAL: "warning",
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "danger",
  INACTIVE: "danger",
  ISSUED: "info",
  SENT: "info",
  ACCEPTED: "success",
  PARTIALLY_PAID: "warning",
  PARTIALLY_RECEIVED: "warning",
  RECEIVED: "success",
  OVERDUE: "danger",
  FULFILLED: "success",
  PAID: "success",
  ARCHIVED: "neutral",
  CANCELLED: "danger",
  neutral: "neutral",
  warning: "warning",
  success: "success",
  info: "info",
  danger: "danger"
};

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: string }) {
  const resolved = toneClass[tone] ?? toneClass[label] ?? "neutral";
  return (
    <span className={`badge ${resolved}`} data-tone={resolved}>
      <span className={`status-dot ${resolved}`} aria-hidden="true" />
      {formatThaiStatusLabel(label)}
    </span>
  );
}
