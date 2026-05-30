import type { OrryModulePageData, OrryStoreSnapshot } from "@/lib/orry/schema";
import { activityMap, cell, compact, currency, moduleMeta, rows } from "@/lib/orry/workspace-common";

function page(module: "quotation" | "sales-order" | "invoice", config: Pick<OrryModulePageData, "kpis" | "tabs" | "actions" | "columns" | "rows">): OrryModulePageData {
  return { module, ...moduleMeta[module], activities: activityMap[module], ...config };
}

export function getSalesPageData(module: "quotation" | "sales-order" | "invoice", snapshot: OrryStoreSnapshot) {
  if (module === "quotation") {
    return page(module, {
      kpis: [
        { label: "Open Quotes", value: "10", hint: "Commercial proposals", tone: "ok" },
        { label: "Awaiting Approval", value: "4", hint: "Manager review backlog", tone: "warning" },
        { label: "Pipeline", value: currency(snapshot.salesOrders.reduce((sum, item) => sum + item.totalAmount, 0)), hint: "Quoted value", tone: "ok" },
        { label: "At Risk", value: "1", hint: "Expiring soon", tone: "critical" },
      ],
      tabs: [{ label: "All", value: "10", active: true }, { label: "Draft", value: "3" }, { label: "Pending", value: "4" }, { label: "Approved", value: "3" }],
      actions: [{ label: "Create quotation", href: "/api/orry/sales-orders", tone: "primary" }, { label: "Export pipeline", href: "/orry/quotation", tone: "secondary" }],
      columns: ["Quote No.", "Customer", "Owner", "Amount", "Status", "Valid Until"],
      rows: rows(snapshot.salesOrders.map((order) => ({ id: order.id, cells: [cell(`QT-${order.documentNumber.slice(-4)}`, undefined, "primary"), cell(order.customerOrVendorName), cell(order.createdByUserId), cell(currency(order.totalAmount), undefined, undefined, "right"), cell(order.status, order.status === "APPROVED" ? "ok" : order.status === "PENDING" ? "warning" : "neutral"), cell(order.shipmentWindow, undefined, "secondary")] }))),
    });
  }

  if (module === "sales-order") {
    return page(module, {
      kpis: [
        { label: "Confirmed Orders", value: String(snapshot.salesOrders.length), hint: "Demand lines in workflow", tone: "ok" },
        { label: "Reserved Units", value: compact(snapshot.stock.reduce((sum, item) => sum + item.reserved, 0)), hint: "Allocation against stock", tone: "warning" },
        { label: "Shipment Window", value: "2 days", hint: "Average promise lead", tone: "ok" },
        { label: "Held Orders", value: "1", hint: "Approval or payment hold", tone: "warning" },
      ],
      tabs: [{ label: "All", value: "12", active: true }, { label: "Draft", value: "2" }, { label: "Pending", value: "3" }, { label: "Approved", value: "7" }],
      actions: [{ label: "Create sales order", href: "/api/orry/sales-orders", tone: "primary" }, { label: "Schedule shipment", href: "/orry/sales-order", tone: "ghost" }],
      columns: ["Order No.", "Customer", "Items", "Shipment Window", "Amount", "Status"],
      rows: rows(snapshot.salesOrders.map((order) => ({ id: order.id, cells: [cell(order.documentNumber, undefined, "primary"), cell(order.customerOrVendorName), cell(String(order.itemCount)), cell(order.shipmentWindow), cell(currency(order.totalAmount), undefined, undefined, "right"), cell(order.status, order.status === "APPROVED" ? "ok" : order.status === "PENDING" ? "warning" : "neutral")] }))),
    });
  }

  return page(module, {
    kpis: [
      { label: "Open AR", value: currency(snapshot.invoices.reduce((sum, item) => sum + (item.totalAmount - item.paidAmount), 0)), hint: "Outstanding receivables", tone: "warning" },
      { label: "Posted", value: String(snapshot.invoices.filter((item) => item.status === "POSTED").length), hint: "Invoices posted to AR", tone: "ok" },
      { label: "Collected", value: currency(snapshot.invoices.reduce((sum, item) => sum + item.paidAmount, 0)), hint: "Applied cash receipts", tone: "ok" },
      { label: "Overdue", value: "1", hint: "Customer needs follow-up", tone: "critical" },
    ],
    tabs: [{ label: "All", value: "8", active: true }, { label: "Approved", value: "3" }, { label: "Posted", value: "4" }, { label: "Cancelled", value: "1" }],
    actions: [{ label: "Create invoice", href: "/api/orry/invoices", tone: "primary" }, { label: "Review aging", href: "/orry/account-receivable", tone: "secondary" }],
    columns: ["Invoice No.", "Customer", "Due Date", "Open Amount", "Paid", "Status"],
    rows: rows(snapshot.invoices.map((invoice) => ({ id: invoice.id, cells: [cell(invoice.documentNumber, undefined, "primary"), cell(invoice.customerOrVendorName), cell(invoice.dueDate), cell(currency(invoice.totalAmount - invoice.paidAmount), undefined, undefined, "right"), cell(currency(invoice.paidAmount), undefined, undefined, "right"), cell(invoice.status, invoice.status === "POSTED" ? "ok" : invoice.status === "APPROVED" ? "warning" : "neutral")] }))),
  });
}
