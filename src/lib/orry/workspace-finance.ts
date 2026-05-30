import type { OrryModulePageData, OrryStoreSnapshot } from "@/lib/orry/schema";
import { activityMap, cell, currency, moduleMeta, rows } from "@/lib/orry/workspace-common";

type FinanceModule = "account-receivable" | "account-payable" | "general-ledger";

function page(module: FinanceModule, config: Pick<OrryModulePageData, "kpis" | "tabs" | "actions" | "columns" | "rows">): OrryModulePageData {
  return { module, ...moduleMeta[module], activities: activityMap[module], ...config };
}

export function getFinancePageData(module: FinanceModule, snapshot: OrryStoreSnapshot) {
  if (module === "account-receivable") {
    return page(module, {
      kpis: [{ label: "Balance Due", value: currency(snapshot.customers.reduce((sum, item) => sum + item.balanceDue, 0)), hint: "Customer exposure", tone: "warning" }, { label: "Over Credit", value: String(snapshot.customers.filter((item) => item.balanceDue > item.creditLimit * 0.75).length), hint: "Near credit limit", tone: "critical" }, { label: "Current", value: "62%", hint: "Collection rate", tone: "ok" }, { label: "Follow Up", value: "3", hint: "Collector queue", tone: "warning" }],
      tabs: [{ label: "All", value: String(snapshot.customers.length), active: true }, { label: "Current", value: "2" }, { label: "Due Soon", value: "1" }, { label: "Overdue", value: "1" }],
      actions: [{ label: "Record follow-up", href: "/orry/account-receivable", tone: "primary" }, { label: "Open invoices", href: "/orry/invoice", tone: "secondary" }],
      columns: ["Customer", "Channel", "Credit Limit", "Balance Due", "Coverage", "Status"],
      rows: rows(snapshot.customers.map((customer) => ({ id: customer.id, cells: [cell(customer.name, undefined, "primary"), cell(customer.channel), cell(currency(customer.creditLimit), undefined, undefined, "right"), cell(currency(customer.balanceDue), undefined, undefined, "right"), cell(`${Math.round((customer.balanceDue / customer.creditLimit) * 100)}%`, customer.balanceDue > customer.creditLimit * 0.75 ? "warning" : "ok", undefined, "right"), cell(customer.status.toUpperCase(), customer.status)] }))),
    });
  }

  if (module === "account-payable") {
    return page(module, {
      kpis: [{ label: "Open AP", value: currency(snapshot.purchaseOrders.reduce((sum, item) => sum + item.totalAmount, 0)), hint: "Vendor liabilities", tone: "warning" }, { label: "Discount Window", value: "2", hint: "Eligible for early pay", tone: "ok" }, { label: "Due This Week", value: "3", hint: "Upcoming payment batch", tone: "warning" }, { label: "Critical", value: "1", hint: "Vendor escalation", tone: "critical" }],
      tabs: [{ label: "All", value: String(snapshot.vendors.length), active: true }, { label: "Current", value: "2" }, { label: "Due", value: "1" }, { label: "Escalated", value: "1" }],
      actions: [{ label: "Prepare payment batch", href: "/orry/account-payable", tone: "primary" }, { label: "Open PO", href: "/orry/purchase-order", tone: "ghost" }],
      columns: ["Vendor", "Lead Time", "Term", "Open PO Value", "Priority", "Status"],
      rows: rows(snapshot.vendors.map((vendor, index) => ({ id: vendor.id, cells: [cell(vendor.name, undefined, "primary"), cell(`${vendor.leadTimeDays} days`), cell(`${vendor.paymentTermDays} days`), cell(currency(snapshot.purchaseOrders[index % snapshot.purchaseOrders.length]?.totalAmount ?? 0), undefined, undefined, "right"), cell(index === 1 ? "Due this week" : "Planned", index === 1 ? "warning" : "ok"), cell(vendor.status.toUpperCase(), vendor.status)] }))),
    });
  }

  return page(module, {
    kpis: [{ label: "Journal Entries", value: String(snapshot.journalEntries.length), hint: "Typed mock postings", tone: "ok" }, { label: "Posted", value: String(snapshot.journalEntries.filter((item) => item.status === "POSTED").length), hint: "Entries already posted", tone: "ok" }, { label: "Draft Exposure", value: String(snapshot.journalEntries.filter((item) => item.status !== "POSTED").length), hint: "Entries awaiting close", tone: "warning" }, { label: "Ledger Accounts", value: String(snapshot.glAccounts.length), hint: "Core chart coverage", tone: "ok" }],
    tabs: [{ label: "Journal", value: String(snapshot.journalEntries.length), active: true }, { label: "Posted", value: "2" }, { label: "Awaiting", value: "1" }],
    actions: [{ label: "Create journal", href: "/api/orry/gl", tone: "primary" }, { label: "Open accounts", href: "/orry/general-ledger", tone: "secondary" }],
    columns: ["Journal No.", "Account", "Description", "Debit", "Credit", "Status"],
    rows: rows(snapshot.journalEntries.map((entry) => ({ id: entry.id, cells: [cell(entry.journalNumber, undefined, "primary"), cell(snapshot.glAccounts.find((account) => account.id === entry.accountId)?.name ?? entry.accountId), cell(entry.description), cell(currency(entry.debit), undefined, undefined, "right"), cell(currency(entry.credit), undefined, undefined, "right"), cell(entry.status, entry.status === "POSTED" ? "ok" : "warning")] }))),
  });
}
