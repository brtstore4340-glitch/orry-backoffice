import { ORRY_MODULES } from "@/lib/orry/navigation";
import { createWorkspaceActivityMap } from "@/lib/orry/mock-data";
import type { HealthTone, OrryModuleKey, OrryModulePageData, OrryStoreSnapshot, TableCell, TableRow } from "@/lib/orry/schema";

export const activityMap = createWorkspaceActivityMap();

export function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function compact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function cell(value: string, tone?: HealthTone, emphasis?: TableCell["emphasis"], align?: TableCell["align"]): TableCell {
  return { value, tone, emphasis, align };
}

export function rows(values: Array<{ id: string; cells: TableCell[] }>): TableRow[] {
  return values.map((value) => ({ id: value.id, cells: value.cells }));
}

export const moduleMeta: Record<OrryModuleKey, Pick<OrryModulePageData, "group" | "eyebrow" | "title" | "description" | "summary">> = {
  quotation: { group: "sales", eyebrow: "Sales", title: "Quotation", description: "Commercial proposals and conversion readiness.", summary: "Isolated quotation board for ERP work." },
  "sales-order": { group: "sales", eyebrow: "Sales", title: "Sales Order", description: "Confirmed sales demand and shipment readiness.", summary: "Sales orders expose demand, allocation, and risk." },
  invoice: { group: "sales", eyebrow: "Sales", title: "Invoice", description: "Invoice lifecycle, posting, and collection focus.", summary: "Invoices stay mock-backed and typed." },
  "purchase-requisition": { group: "purchasing", eyebrow: "Purchasing", title: "Purchase Requisition", description: "Internal replenishment intake before PO conversion.", summary: "Requisitions keep upstream demand visible." },
  "purchase-order": { group: "purchasing", eyebrow: "Purchasing", title: "Purchase Order", description: "Supplier commitments, lead time, and inbound planning.", summary: "PO visibility without touching legacy documents." },
  "stock-balance": { group: "inventory", eyebrow: "Inventory", title: "Stock Balance", description: "On-hand, reserved, and available stock in MAIN warehouse.", summary: "Uses a virtualized table path for >50 rows." },
  "goods-receive": { group: "inventory", eyebrow: "Inventory", title: "Goods Receive", description: "Inbound receipts, lots, and condition review.", summary: "Receiving remains mock-only with shared inventory rules." },
  "goods-issue": { group: "inventory", eyebrow: "Inventory", title: "Goods Issue", description: "Outbound issue validation against available stock.", summary: "Issue validations block negative stock." },
  "stock-transfer": { group: "inventory", eyebrow: "Inventory", title: "Stock Transfer", description: "Transfer planning with capacity guards.", summary: "Transfers demonstrate quantity and capacity checks." },
  "stock-checking": { group: "inventory", eyebrow: "Inventory", title: "Stock Checking", description: "Cycle count execution and variance control.", summary: "Cycle count visibility is isolated to this workspace." },
  "return-order": { group: "inventory", eyebrow: "Inventory", title: "Return Order", description: "Returns, condition codes, and disposition decisions.", summary: "Return rows model sellable, damaged, and expired conditions." },
  "account-receivable": { group: "finance", eyebrow: "Finance", title: "Account Receivable", description: "Aging, customer exposure, and follow-up queue.", summary: "AR priorities stay clear without touching legacy payments." },
  "account-payable": { group: "finance", eyebrow: "Finance", title: "Account Payable", description: "Vendor liabilities and treasury preparation.", summary: "AP stays lightweight and future-ready." },
  "general-ledger": { group: "finance", eyebrow: "Finance", title: "General Ledger", description: "Journals, accounts, and close-readiness view.", summary: "Ledger runs on typed GL mock entries." },
  "fixed-assets": { group: "asset", eyebrow: "Asset", title: "Fixed Assets", description: "Asset register, ownership, and depreciation cues.", summary: "Asset management stays bounded to ERP scope." },
  "master-data": { group: "system", eyebrow: "System", title: "Master Data", description: "Products, customers, vendors, and warehouse master.", summary: "Master data uses shared UI primitives." },
  users: { group: "system", eyebrow: "System", title: "Users", description: "ERP-facing access and approval visibility.", summary: "No identity changes outside this workspace." },
  settings: { group: "system", eyebrow: "System", title: "Settings", description: "ERP defaults, guard rails, and policy switches.", summary: "Settings stay mock-backed and isolated." },
};

export function getWorkspaceLandingData(snapshot: OrryStoreSnapshot) {
  const pendingDocs = [...snapshot.salesOrders, ...snapshot.purchaseOrders, ...snapshot.invoices].filter((item) => item.status === "PENDING").length;
  return {
    title: "ORRY ERP Workspace",
    description: "Scoped ERP UI + API + workflow workspace under isolated ORRY routes.",
    kpis: [
      { label: "Products", value: String(snapshot.products.length), hint: "Centralized product master", tone: "ok" as const },
      { label: "Pending Docs", value: String(pendingDocs), hint: "Documents waiting for approval", tone: pendingDocs ? "warning" as const : "ok" as const },
      { label: "Warehouse Fill", value: `${Math.round((snapshot.warehouses[0].usedCapacity / snapshot.warehouses[0].capacity) * 100)}%`, hint: "MAIN utilization", tone: "warning" as const },
      { label: "Critical AR", value: String(snapshot.customers.filter((item) => item.status === "critical").length), hint: "Accounts needing escalation", tone: "critical" as const },
    ],
    modules: ORRY_MODULES,
  };
}
