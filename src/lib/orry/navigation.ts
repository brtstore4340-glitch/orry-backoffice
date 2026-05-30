import type { OrryModuleKey, OrryNavGroupKey } from "@/lib/orry/schema";

export interface OrryNavigationItem {
  key: OrryModuleKey;
  label: string;
  href: string;
}

export interface OrryNavigationGroup {
  key: OrryNavGroupKey;
  label: string;
  items: OrryNavigationItem[];
}

export const ORRY_NAVIGATION: OrryNavigationGroup[] = [
  { key: "sales", label: "Sales", items: [{ key: "quotation", label: "Quotation", href: "/orry/quotation" }, { key: "sales-order", label: "Sales Order", href: "/orry/sales-order" }, { key: "invoice", label: "Invoice", href: "/orry/invoice" }] },
  { key: "purchasing", label: "Purchasing", items: [{ key: "purchase-requisition", label: "Purchase Requisition", href: "/orry/purchase-requisition" }, { key: "purchase-order", label: "Purchase Order", href: "/orry/purchase-order" }] },
  { key: "inventory", label: "Inventory", items: [{ key: "stock-balance", label: "Stock Balance", href: "/orry/stock-balance" }, { key: "goods-receive", label: "Goods Receive", href: "/orry/goods-receive" }, { key: "goods-issue", label: "Goods Issue", href: "/orry/goods-issue" }, { key: "stock-transfer", label: "Stock Transfer", href: "/orry/stock-transfer" }, { key: "stock-checking", label: "Stock Checking", href: "/orry/stock-checking" }, { key: "return-order", label: "Return Order", href: "/orry/return-order" }] },
  { key: "finance", label: "Finance", items: [{ key: "account-receivable", label: "Account Receivable", href: "/orry/account-receivable" }, { key: "account-payable", label: "Account Payable", href: "/orry/account-payable" }, { key: "general-ledger", label: "General Ledger", href: "/orry/general-ledger" }] },
  { key: "asset", label: "Asset", items: [{ key: "fixed-assets", label: "Fixed Assets", href: "/orry/fixed-assets" }] },
  { key: "system", label: "System", items: [{ key: "master-data", label: "Master Data", href: "/orry/master-data" }, { key: "users", label: "Users", href: "/orry/users" }, { key: "settings", label: "Settings", href: "/orry/settings" }] },
];

export const ORRY_MODULES = ORRY_NAVIGATION.flatMap((group) => group.items);

export function isOrryModuleKey(value: string): value is OrryModuleKey {
  return ORRY_MODULES.some((module) => module.key === value);
}
