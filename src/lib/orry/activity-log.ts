import type { ActivityLogEntry, HealthTone, OrryModuleKey } from "@/lib/orry/schema";

const toneToResult: Record<HealthTone, ActivityLogEntry["result"]> = {
  ok: "SUCCESS",
  warning: "WARNING",
  critical: "FAILED",
  neutral: "SUCCESS",
};

export function createActivityLogEntry(input: {
  id: string;
  action: string;
  timestamp: string;
  user: string;
  detail: string;
  tone?: HealthTone;
}): ActivityLogEntry {
  return {
    id: input.id,
    action: input.action,
    timestamp: input.timestamp,
    user: input.user,
    detail: input.detail,
    result: toneToResult[input.tone ?? "neutral"],
  };
}

export function createModuleActivityFeed(module: OrryModuleKey, count = 4): ActivityLogEntry[] {
  const actionsByModule: Record<OrryModuleKey, Array<{ action: string; detail: string; tone?: HealthTone }>> = {
    quotation: [
      { action: "Draft saved", detail: "Commercial quotation updated for a flagship partner.", tone: "ok" },
      { action: "Approval queued", detail: "Awaiting sales manager review before release.", tone: "warning" },
    ],
    "sales-order": [
      { action: "Order confirmed", detail: "Allocation reserved in MAIN / คลังหลัก.", tone: "ok" },
      { action: "Shipment hold", detail: "One line waits for payment confirmation.", tone: "warning" },
    ],
    invoice: [
      { action: "Invoice posted", detail: "AR aging bucket refreshed for finance.", tone: "ok" },
      { action: "Reminder sent", detail: "Follow-up pushed to customer credit contact.", tone: "warning" },
    ],
    "purchase-requisition": [
      { action: "Request drafted", detail: "Ops proposed replenishment for low stock SKUs.", tone: "ok" },
      { action: "Budget review", detail: "Spend threshold needs finance approval.", tone: "warning" },
    ],
    "purchase-order": [
      { action: "PO approved", detail: "Vendor confirmation expected within SLA.", tone: "ok" },
      { action: "Lead time risk", detail: "Packaging supplier signaled a delay.", tone: "warning" },
    ],
    "stock-balance": [
      { action: "Cycle sync", detail: "Inventory balance refreshed from the mock adapter.", tone: "ok" },
      { action: "Low stock alert", detail: "Three SKUs are below reorder point.", tone: "warning" },
    ],
    "goods-receive": [
      { action: "Receiving posted", detail: "Inbound lot tagged to MAIN warehouse.", tone: "ok" },
      { action: "QC variance", detail: "One carton needs condition review.", tone: "warning" },
    ],
    "goods-issue": [
      { action: "Issue request queued", detail: "Ops waiting for approval before stock movement.", tone: "warning" },
      { action: "Issue validated", detail: "Available stock check passed.", tone: "ok" },
    ],
    "stock-transfer": [
      { action: "Transfer simulated", detail: "Capacity guard accepted target zone load.", tone: "ok" },
      { action: "Transfer blocked", detail: "One requested quantity exceeds target capacity.", tone: "critical" },
    ],
    "stock-checking": [
      { action: "Count sheet opened", detail: "Cycle count worksheet issued for aisle A.", tone: "ok" },
      { action: "Variance flagged", detail: "Manual recount required before approval.", tone: "warning" },
    ],
    "return-order": [
      { action: "Return intake", detail: "Returned units marked SELLABLE pending approval.", tone: "ok" },
      { action: "Damaged lot", detail: "Damaged return isolated from available stock.", tone: "warning" },
    ],
    "account-receivable": [
      { action: "Aging refreshed", detail: "Customer balances recalculated for morning review.", tone: "ok" },
      { action: "Past due escalation", detail: "One account moved to critical follow-up queue.", tone: "critical" },
    ],
    "account-payable": [
      { action: "Payment batch prepared", detail: "Vendor payouts queued for treasury review.", tone: "ok" },
      { action: "Discount window", detail: "Early-pay discount closes tomorrow.", tone: "warning" },
    ],
    "general-ledger": [
      { action: "Journal imported", detail: "Ledger posted from the ERP workflow adapter.", tone: "ok" },
      { action: "Posting lock", detail: "One draft journal still pending approval.", tone: "warning" },
    ],
    "fixed-assets": [
      { action: "Asset register synced", detail: "Depreciation run preview prepared.", tone: "ok" },
      { action: "Inspection due", detail: "Retail display fixture requires maintenance.", tone: "warning" },
    ],
    "master-data": [
      { action: "Master data update", detail: "Two product records refreshed by merch ops.", tone: "ok" },
      { action: "Field review", detail: "One vendor tax profile needs completion.", tone: "warning" },
    ],
    users: [
      { action: "Role reviewed", detail: "User access matrix checked against current approvals.", tone: "ok" },
      { action: "Pending approval", detail: "One operator is still awaiting admin approval.", tone: "warning" },
    ],
    settings: [
      { action: "Setting saved", detail: "Warehouse control policy synced to ERP workspace.", tone: "ok" },
      { action: "SMTP warning", detail: "Outbound mail config is not verified in this mock workspace.", tone: "warning" },
    ],
  };

  const now = new Date("2026-04-09T08:30:00Z");
  return Array.from({ length: count }, (_, index) => {
    const item = actionsByModule[module][index % actionsByModule[module].length];
    return createActivityLogEntry({
      id: `${module}-${index + 1}`,
      action: item.action,
      timestamp: new Date(now.getTime() - index * 36 * 60 * 1000).toISOString(),
      user: index % 2 === 0 ? "Anya Ops" : "Mina Finance",
      detail: item.detail,
      tone: item.tone,
    });
  });
}
