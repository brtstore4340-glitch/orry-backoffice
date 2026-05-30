import type { OrryModulePageData, OrryStoreSnapshot } from "@/lib/orry/schema";
import { activityMap, cell, currency, moduleMeta, rows } from "@/lib/orry/workspace-common";

type SystemModule = "fixed-assets" | "master-data" | "users" | "settings";

function page(module: SystemModule, config: Pick<OrryModulePageData, "kpis" | "tabs" | "actions" | "columns" | "rows">): OrryModulePageData {
  return { module, ...moduleMeta[module], activities: activityMap[module], ...config };
}

export function getSystemPageData(module: SystemModule, snapshot: OrryStoreSnapshot) {
  switch (module) {
    case "fixed-assets":
      return page(module, {
        kpis: [{ label: "Asset Register", value: "12", hint: "Tracked non-current assets", tone: "ok" }, { label: "Due for Review", value: "2", hint: "Inspection or maintenance needed", tone: "warning" }, { label: "NBV", value: currency(186400), hint: "Net book value", tone: "ok" }, { label: "Retirements", value: "0", hint: "No disposals this cycle", tone: "ok" }],
        tabs: [{ label: "All", value: "12", active: true }, { label: "In Use", value: "10" }, { label: "Maintenance", value: "2" }],
        actions: [{ label: "Register asset", href: "/orry/fixed-assets", tone: "primary" }, { label: "Depreciation plan", href: "/orry/fixed-assets", tone: "ghost" }],
        columns: ["Asset Code", "Asset Name", "Owner", "Acquired", "NBV", "Status"],
        rows: rows([{ id: "fa-1", cells: [cell("FA-001", undefined, "primary"), cell("Retail display kiosk"), cell("Store Ops"), cell("2025-10-11"), cell(currency(42000), undefined, undefined, "right"), cell("IN SERVICE", "ok")] }, { id: "fa-2", cells: [cell("FA-002", undefined, "primary"), cell("Photo studio lighting rig"), cell("Marketing"), cell("2024-05-02"), cell(currency(18400), undefined, undefined, "right"), cell("MAINTENANCE", "warning")] }]),
      });
    case "master-data":
      return page(module, {
        kpis: [{ label: "Products", value: String(snapshot.products.length), hint: "Centralized SKU list", tone: "ok" }, { label: "Customers", value: String(snapshot.customers.length), hint: "Commercial master", tone: "ok" }, { label: "Vendors", value: String(snapshot.vendors.length), hint: "Supply master", tone: "ok" }, { label: "Fields Missing", value: "2", hint: "Records needing completion", tone: "warning" }],
        tabs: [{ label: "Products", value: String(snapshot.products.length), active: true }, { label: "Customers", value: String(snapshot.customers.length) }, { label: "Vendors", value: String(snapshot.vendors.length) }],
        actions: [{ label: "Add product", href: "/api/orry/products", tone: "primary" }, { label: "Add customer", href: "/api/orry/customers", tone: "secondary" }],
        columns: ["Code", "Name", "Type", "Reference", "Status", "Last Update"],
        rows: rows([...snapshot.products.slice(0, 3).map((product) => ({ id: product.id, cells: [cell(product.sku, undefined, "primary"), cell(product.name), cell("Product"), cell(product.category), cell(product.status.toUpperCase(), product.status), cell("Today")] })), ...snapshot.customers.slice(0, 2).map((customer) => ({ id: customer.id, cells: [cell(customer.code, undefined, "primary"), cell(customer.name), cell("Customer"), cell(customer.channel), cell(customer.status.toUpperCase(), customer.status), cell("Yesterday")] }))]),
      });
    case "users":
      return page(module, {
        kpis: [{ label: "Active Users", value: "18", hint: "ERP operators with access", tone: "ok" }, { label: "Pending Approval", value: "1", hint: "Needs admin action", tone: "warning" }, { label: "Admins", value: "3", hint: "Privileged approvers", tone: "ok" }, { label: "Role Drift", value: "0", hint: "No mismatched roles detected", tone: "ok" }],
        tabs: [{ label: "All", value: "18", active: true }, { label: "Pending", value: "1" }, { label: "Admins", value: "3" }],
        actions: [{ label: "Invite user", href: "/orry/users", tone: "primary" }, { label: "Review approvals", href: "/orry/users", tone: "secondary" }],
        columns: ["User", "Role", "Team", "Approval", "Last Active", "Status"],
        rows: rows([{ id: "usr-1", cells: [cell("Anya Ops", undefined, "primary"), cell("OPERATIONS"), cell("Warehouse"), cell("APPROVED", "ok"), cell("8 mins ago"), cell("ACTIVE", "ok")] }, { id: "usr-2", cells: [cell("Mina Finance", undefined, "primary"), cell("FINANCE"), cell("Finance"), cell("APPROVED", "ok"), cell("22 mins ago"), cell("ACTIVE", "ok")] }, { id: "usr-3", cells: [cell("New Buyer", undefined, "primary"), cell("SALES"), cell("Sales"), cell("PENDING", "warning"), cell("Never"), cell("LOCKED", "critical")] }]),
      });
    case "settings":
      return page(module, {
        kpis: [{ label: "Policies", value: "8", hint: "ERP settings in this workspace", tone: "ok" }, { label: "Warnings", value: "1", hint: "One config needs verification", tone: "warning" }, { label: "Warehouse Scope", value: "MAIN", hint: "Phase 1 warehouse boundary", tone: "ok" }, { label: "Workflow Guards", value: "Enabled", hint: "Transition validation active", tone: "ok" }],
        tabs: [{ label: "General", value: "4", active: true }, { label: "Workflow", value: "2" }, { label: "Inventory", value: "2" }],
        actions: [{ label: "Save settings", href: "/orry/settings", tone: "primary" }, { label: "Review policies", href: "/orry/settings", tone: "secondary" }],
        columns: ["Setting", "Category", "Value", "Owner", "Last Changed", "Health"],
        rows: rows([{ id: "st-1", cells: [cell("Default warehouse", undefined, "primary"), cell("Inventory"), cell("MAIN / คลังหลัก"), cell("Operations"), cell("Today"), cell("HEALTHY", "ok")] }, { id: "st-2", cells: [cell("Creator cannot approve", undefined, "primary"), cell("Workflow"), cell("Enabled"), cell("Finance"), cell("Today"), cell("HEALTHY", "ok")] }, { id: "st-3", cells: [cell("Outbound email proof", undefined, "primary"), cell("Notification"), cell("Not verified"), cell("IT"), cell("Pending"), cell("REVIEW", "warning")] }]),
      });
  }
}
