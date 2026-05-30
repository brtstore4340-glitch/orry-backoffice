import type { OrryModulePageData, OrryStoreSnapshot } from "@/lib/orry/schema";
import { activityMap, cell, compact, currency, moduleMeta, rows } from "@/lib/orry/workspace-common";

type OpsModule =
  | "purchase-requisition"
  | "purchase-order"
  | "stock-balance"
  | "goods-receive"
  | "goods-issue"
  | "stock-transfer"
  | "stock-checking"
  | "return-order";

function page(module: OpsModule, config: Pick<OrryModulePageData, "kpis" | "tabs" | "actions" | "columns" | "rows">): OrryModulePageData {
  return { module, ...moduleMeta[module], activities: activityMap[module], ...config };
}

export function getOpsPageData(module: OpsModule, snapshot: OrryStoreSnapshot) {
  switch (module) {
    case "purchase-requisition":
      return page(module, {
        kpis: [{ label: "Requests", value: "7", hint: "Approved and draft requests", tone: "ok" }, { label: "Urgent SKUs", value: String(snapshot.products.filter((item) => item.status !== "ok").length), hint: "Below target cover", tone: "warning" }, { label: "Spend Estimate", value: currency(snapshot.purchaseOrders.reduce((sum, item) => sum + item.totalAmount, 0)), hint: "Expected replenishment spend", tone: "ok" }, { label: "Blocked", value: "1", hint: "Threshold review needed", tone: "critical" }],
        tabs: [{ label: "All", value: "7", active: true }, { label: "Draft", value: "3" }, { label: "Pending", value: "2" }, { label: "Approved", value: "2" }],
        actions: [{ label: "Create requisition", href: "/orry/purchase-requisition", tone: "primary" }, { label: "Convert to PO", href: "/orry/purchase-order", tone: "secondary" }],
        columns: ["Req No.", "Requester", "Reason", "Needed By", "Budget", "Status"],
        rows: rows([{ id: "pr-1", cells: [cell("PR-260401", undefined, "primary"), cell("Ops Lead"), cell("Replenish low stock serum line"), cell("12 Apr 2026"), cell(currency(48000), undefined, undefined, "right"), cell("PENDING", "warning")] }, { id: "pr-2", cells: [cell("PR-260402", undefined, "primary"), cell("Retail Ops"), cell("Replace damaged display trays"), cell("18 Apr 2026"), cell(currency(12800), undefined, undefined, "right"), cell("APPROVED", "ok")] }]),
      });
    case "purchase-order":
      return page(module, {
        kpis: [{ label: "Open PO", value: String(snapshot.purchaseOrders.length), hint: "Supplier commitments", tone: "ok" }, { label: "Expected Spend", value: currency(snapshot.purchaseOrders.reduce((sum, item) => sum + item.totalAmount, 0)), hint: "Committed purchasing", tone: "ok" }, { label: "Lead Time Risk", value: "1", hint: "Vendor delay flagged", tone: "warning" }, { label: "Ready to Receive", value: "2", hint: "Inbound batches scheduled", tone: "ok" }],
        tabs: [{ label: "All", value: "6", active: true }, { label: "Draft", value: "1" }, { label: "Pending", value: "2" }, { label: "Approved", value: "3" }],
        actions: [{ label: "Create PO", href: "/api/orry/purchase-orders", tone: "primary" }, { label: "Review suppliers", href: "/orry/master-data", tone: "ghost" }],
        columns: ["PO No.", "Vendor", "Items", "Expected Date", "Amount", "Status"],
        rows: rows(snapshot.purchaseOrders.map((order) => ({ id: order.id, cells: [cell(order.documentNumber, undefined, "primary"), cell(order.customerOrVendorName), cell(String(order.itemCount)), cell(order.expectedDate), cell(currency(order.totalAmount), undefined, undefined, "right"), cell(order.status, order.status === "APPROVED" ? "ok" : order.status === "PENDING" ? "warning" : "neutral")] }))),
      });
    case "stock-balance":
      return page(module, {
        kpis: [{ label: "On Hand", value: compact(snapshot.stock.reduce((sum, item) => sum + item.stockOnHand, 0)), hint: "Units physically available", tone: "ok" }, { label: "Reserved", value: compact(snapshot.stock.reduce((sum, item) => sum + item.reserved, 0)), hint: "Units tied to demand", tone: "warning" }, { label: "Available", value: compact(snapshot.stock.reduce((sum, item) => sum + item.available, 0)), hint: "Free to issue", tone: "ok" }, { label: "Exceptions", value: String(snapshot.stock.filter((item) => item.condition !== "SELLABLE").length), hint: "Condition review required", tone: "critical" }],
        tabs: [{ label: "All lots", value: String(snapshot.stock.length), active: true }, { label: "Sellable", value: String(snapshot.stock.filter((item) => item.condition === "SELLABLE").length) }, { label: "Damaged", value: String(snapshot.stock.filter((item) => item.condition === "DAMAGED").length) }, { label: "Expired", value: String(snapshot.stock.filter((item) => item.condition === "EXPIRED").length) }],
        actions: [{ label: "Refresh stock", href: "/api/orry/stock", tone: "primary" }, { label: "Open issue queue", href: "/orry/goods-issue", tone: "secondary" }],
        columns: ["Lot", "Product", "Warehouse", "On Hand", "Reserved", "Available", "Condition"],
        rows: rows(snapshot.stock.map((item) => { const product = snapshot.products.find((productItem) => productItem.id === item.productId); return { id: item.id, cells: [cell(item.lotNumber, undefined, "primary"), cell(product?.name ?? item.productId), cell("MAIN / คลังหลัก"), cell(String(item.stockOnHand), undefined, undefined, "right"), cell(String(item.reserved), undefined, undefined, "right"), cell(String(item.available), item.available <= 20 ? "warning" : "ok", undefined, "right"), cell(item.condition, item.condition === "SELLABLE" ? "ok" : item.condition === "DAMAGED" ? "warning" : "critical")] }; })),
      });
    case "goods-receive":
      return page(module, {
        kpis: [{ label: "Today Receipts", value: "4", hint: "Inbound batches processed", tone: "ok" }, { label: "QC Hold", value: "1", hint: "Needs condition decision", tone: "warning" }, { label: "Inbound Value", value: currency(128400), hint: "Current receiving workload", tone: "ok" }, { label: "Dock SLA", value: "96%", hint: "Receiving within target window", tone: "ok" }],
        tabs: [{ label: "Queued", value: "3", active: true }, { label: "Received", value: "4" }, { label: "QC Hold", value: "1" }],
        actions: [{ label: "Post receipt", href: "/api/orry/stock", tone: "primary" }, { label: "Open PO", href: "/orry/purchase-order", tone: "ghost" }],
        columns: ["Receipt No.", "Vendor", "PO Ref", "Lots", "Received Qty", "Condition"],
        rows: rows([{ id: "gr-1", cells: [cell("GR-260401", undefined, "primary"), cell("Blue Carton Supply"), cell("PO-260401"), cell("3"), cell("420", undefined, undefined, "right"), cell("SELLABLE", "ok")] }, { id: "gr-2", cells: [cell("GR-260402", undefined, "primary"), cell("Bangkok Glass Works"), cell("PO-260402"), cell("1"), cell("120", undefined, undefined, "right"), cell("DAMAGED", "warning")] }]),
      });
    case "goods-issue":
      return page(module, {
        kpis: [{ label: "Issue Requests", value: "6", hint: "Ops demand lines in queue", tone: "warning" }, { label: "Ready to Pick", value: "4", hint: "Approved and stock-safe", tone: "ok" }, { label: "Blocked", value: "2", hint: "Approval or stock constraint", tone: "critical" }, { label: "Allocated Units", value: compact(snapshot.stock.reduce((sum, item) => sum + item.reserved, 0)), hint: "Current reservation level", tone: "warning" }],
        tabs: [{ label: "All", value: "6", active: true }, { label: "Pending", value: "2" }, { label: "Approved", value: "4" }],
        actions: [{ label: "Validate issue", href: "/api/orry/stock", tone: "primary" }, { label: "Review stock", href: "/orry/stock-balance", tone: "secondary" }],
        columns: ["Issue No.", "Order Ref", "Product", "Requested", "Available", "Result"],
        rows: rows(snapshot.stock.slice(0, 6).map((item, index) => { const product = snapshot.products.find((productItem) => productItem.id === item.productId); const requested = 10 + index * 4; const safe = item.available >= requested; return { id: `gi-${index + 1}`, cells: [cell(`GI-26040${index + 1}`, undefined, "primary"), cell(snapshot.salesOrders[index % snapshot.salesOrders.length]?.documentNumber ?? "SO-260401"), cell(product?.name ?? item.productId), cell(String(requested), undefined, undefined, "right"), cell(String(item.available), safe ? "ok" : "critical", undefined, "right"), cell(safe ? "READY" : "BLOCKED", safe ? "ok" : "critical")] }; })),
      });
    case "stock-transfer":
      return page(module, {
        kpis: [{ label: "Requested Moves", value: "5", hint: "Planned internal transfers", tone: "warning" }, { label: "Capacity Headroom", value: `${snapshot.warehouses[0].capacity - snapshot.warehouses[0].usedCapacity} units`, hint: "Remaining safe capacity", tone: "ok" }, { label: "Blocked Transfers", value: "1", hint: "Quantity exceeds limit", tone: "critical" }, { label: "Ready", value: "4", hint: "Can proceed after approval", tone: "ok" }],
        tabs: [{ label: "All", value: "5", active: true }, { label: "Pending", value: "2" }, { label: "Approved", value: "3" }],
        actions: [{ label: "Create transfer", href: "/api/orry/stock", tone: "primary" }, { label: "Inspect capacity", href: "/orry/stock-balance", tone: "ghost" }],
        columns: ["Transfer No.", "Product", "Source", "Target", "Qty", "Result"],
        rows: rows(snapshot.stock.slice(0, 5).map((item, index) => { const quantity = 18 + index * 5; const fits = snapshot.warehouses[0].usedCapacity + quantity <= snapshot.warehouses[0].capacity; const product = snapshot.products.find((productItem) => productItem.id === item.productId); return { id: `tr-${index + 1}`, cells: [cell(`TR-26040${index + 1}`, undefined, "primary"), cell(product?.name ?? item.productId), cell("Bulk Zone A"), cell("Retail Prep Zone"), cell(String(quantity), undefined, undefined, "right"), cell(fits ? "VALID" : "CAPACITY EXCEEDED", fits ? "ok" : "critical")] }; })),
      });
    case "stock-checking":
      return page(module, {
        kpis: [{ label: "Cycle Counts", value: "3", hint: "Open worksheets", tone: "ok" }, { label: "Variance", value: "2", hint: "Need recount", tone: "warning" }, { label: "Closed Today", value: "5", hint: "Checks reconciled", tone: "ok" }, { label: "Critical Gaps", value: "0", hint: "No severe mismatches", tone: "ok" }],
        tabs: [{ label: "Open", value: "3", active: true }, { label: "Variance", value: "2" }, { label: "Closed", value: "5" }],
        actions: [{ label: "Start count", href: "/orry/stock-checking", tone: "primary" }, { label: "Review differences", href: "/orry/stock-balance", tone: "secondary" }],
        columns: ["Count Sheet", "Area", "Lines", "Variance", "Owner", "Status"],
        rows: rows([{ id: "cc-1", cells: [cell("CC-260401", undefined, "primary"), cell("Aisle A"), cell("22"), cell("0", "ok", undefined, "right"), cell("Ops Lead"), cell("OPEN", "warning")] }, { id: "cc-2", cells: [cell("CC-260402", undefined, "primary"), cell("Retail Prep"), cell("14"), cell("3", "warning", undefined, "right"), cell("Warehouse Sup"), cell("VARIANCE", "critical")] }]),
      });
    case "return-order":
      return page(module, {
        kpis: [{ label: "Open Returns", value: "5", hint: "Returns under review", tone: "warning" }, { label: "Sellable", value: "3", hint: "Can re-enter stock after approval", tone: "ok" }, { label: "Damaged", value: "1", hint: "Needs write-off decision", tone: "warning" }, { label: "Expired", value: "1", hint: "Quarantine required", tone: "critical" }],
        tabs: [{ label: "All", value: "5", active: true }, { label: "Pending", value: "2" }, { label: "Approved", value: "2" }, { label: "Blocked", value: "1" }],
        actions: [{ label: "Receive return", href: "/orry/return-order", tone: "primary" }, { label: "Open stock", href: "/orry/stock-balance", tone: "secondary" }],
        columns: ["Return No.", "Customer", "Product", "Qty", "Condition", "Disposition"],
        rows: rows([{ id: "rt-1", cells: [cell("RT-260401", undefined, "primary"), cell("Luna Atelier"), cell("Glow Veil Serum"), cell("12", undefined, undefined, "right"), cell("SELLABLE", "ok"), cell("Await approval", "warning")] }, { id: "rt-2", cells: [cell("RT-260402", undefined, "primary"), cell("Maison Ploen"), cell("Rose Mist"), cell("4", undefined, undefined, "right"), cell("DAMAGED", "warning"), cell("Write-off review", "critical")] }]),
      });
  }
}
