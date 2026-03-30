const toneClass: Record<string, string> = {
  DRAFT: "neutral",
  AWAITING_APPROVAL: "warning",
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "danger",
  INACTIVE: "danger",
  ISSUED: "info",
  FULFILLED: "success",
  PAID: "success",
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
    <span className={`badge ${resolved}`}>
      <span className="status-dot" aria-hidden="true" />
      {label.replaceAll("_", " ")}
    </span>
  );
}
