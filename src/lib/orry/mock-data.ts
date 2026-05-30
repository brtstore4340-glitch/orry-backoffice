import { calculateAvailableStock } from "@/lib/orry/inventory";
import { createModuleActivityFeed } from "@/lib/orry/activity-log";
import type {
  Customer,
  GLAccount,
  Invoice,
  JournalEntry,
  OrryStoreSnapshot,
  Product,
  PurchaseOrder,
  SalesOrder,
  Stock,
  Vendor,
  Warehouse,
} from "@/lib/orry/schema";

const MAIN_WAREHOUSE: Warehouse = {
  id: "wh-main",
  code: "MAIN",
  name: "MAIN / คลังหลัก",
  capacity: 1600,
  usedCapacity: 940,
};

function isoDay(offset: number) {
  return new Date(Date.UTC(2026, 3, 1 + offset, 9, 0, 0)).toISOString();
}

const products: Product[] = [
  { id: "prd-001", sku: "ORY-GLW-001", name: "Glow Veil Serum", category: "Skin Care", unit: "Bottle", price: 1290, reorderPoint: 36, status: "ok" },
  { id: "prd-002", sku: "ORY-NGT-002", name: "Night Repair Oil", category: "Skin Care", unit: "Bottle", price: 1590, reorderPoint: 28, status: "ok" },
  { id: "prd-003", sku: "ORY-MSK-003", name: "Hydra Silk Mask", category: "Treatment", unit: "Box", price: 890, reorderPoint: 42, status: "warning" },
  { id: "prd-004", sku: "ORY-CLM-004", name: "Velvet Cleanser", category: "Cleanser", unit: "Bottle", price: 740, reorderPoint: 40, status: "ok" },
  { id: "prd-005", sku: "ORY-SPR-005", name: "Rose Mist", category: "Mist", unit: "Bottle", price: 620, reorderPoint: 48, status: "warning" },
  { id: "prd-006", sku: "ORY-BDL-006", name: "Travel Ritual Set", category: "Bundle", unit: "Set", price: 2190, reorderPoint: 18, status: "critical" },
  { id: "prd-007", sku: "ORY-ACC-007", name: "Retail Display Tray", category: "Asset", unit: "Unit", price: 3200, reorderPoint: 4, status: "ok" },
  { id: "prd-008", sku: "ORY-SVC-008", name: "Campaign Styling Service", category: "Service", unit: "Project", price: 18500, reorderPoint: 0, status: "ok" },
];

const customers: Customer[] = [
  { id: "cus-001", code: "CUS-001", name: "Luna Atelier", channel: "Department Store", creditLimit: 420000, balanceDue: 126200, status: "warning" },
  { id: "cus-002", code: "CUS-002", name: "Maison Ploen", channel: "Boutique", creditLimit: 260000, balanceDue: 48120, status: "ok" },
  { id: "cus-003", code: "CUS-003", name: "Velvet Glow Clinic", channel: "Clinic", creditLimit: 380000, balanceDue: 0, status: "ok" },
  { id: "cus-004", code: "CUS-004", name: "Siam Duty Free", channel: "Travel Retail", creditLimit: 650000, balanceDue: 229500, status: "critical" },
];

const vendors: Vendor[] = [
  { id: "ven-001", code: "VEN-001", name: "Blue Carton Supply", leadTimeDays: 7, paymentTermDays: 30, status: "ok" },
  { id: "ven-002", code: "VEN-002", name: "Bangkok Glass Works", leadTimeDays: 10, paymentTermDays: 45, status: "warning" },
  { id: "ven-003", code: "VEN-003", name: "Pure Aroma Labs", leadTimeDays: 12, paymentTermDays: 30, status: "ok" },
];

const salesOrders: SalesOrder[] = [
  { id: "so-001", documentNumber: "SO-260401", customerId: "cus-001", customerOrVendorName: "Luna Atelier", totalAmount: 84500, status: "APPROVED", createdByUserId: "user-sales-01", approvedByUserId: "user-mgr-01", itemCount: 5, shipmentWindow: "09 Apr 2026", updatedAt: isoDay(1) },
  { id: "so-002", documentNumber: "SO-260402", customerId: "cus-002", customerOrVendorName: "Maison Ploen", totalAmount: 32100, status: "PENDING", createdByUserId: "user-sales-02", itemCount: 3, shipmentWindow: "10 Apr 2026", updatedAt: isoDay(2) },
  { id: "so-003", documentNumber: "SO-260403", customerId: "cus-004", customerOrVendorName: "Siam Duty Free", totalAmount: 162000, status: "DRAFT", createdByUserId: "user-sales-01", itemCount: 8, shipmentWindow: "14 Apr 2026", updatedAt: isoDay(3) },
];

const purchaseOrders: PurchaseOrder[] = [
  { id: "po-001", documentNumber: "PO-260401", vendorId: "ven-001", customerOrVendorName: "Blue Carton Supply", totalAmount: 48200, status: "APPROVED", createdByUserId: "user-ops-01", approvedByUserId: "user-fin-01", itemCount: 4, expectedDate: "13 Apr 2026", updatedAt: isoDay(2) },
  { id: "po-002", documentNumber: "PO-260402", vendorId: "ven-002", customerOrVendorName: "Bangkok Glass Works", totalAmount: 71200, status: "PENDING", createdByUserId: "user-ops-02", itemCount: 2, expectedDate: "15 Apr 2026", updatedAt: isoDay(3) },
  { id: "po-003", documentNumber: "PO-260403", vendorId: "ven-003", customerOrVendorName: "Pure Aroma Labs", totalAmount: 96800, status: "DRAFT", createdByUserId: "user-ops-02", itemCount: 5, expectedDate: "19 Apr 2026", updatedAt: isoDay(4) },
];

const invoices: Invoice[] = [
  { id: "inv-001", documentNumber: "INV-260401", customerId: "cus-001", customerOrVendorName: "Luna Atelier", totalAmount: 84500, paidAmount: 24000, dueDate: "20 Apr 2026", status: "POSTED", createdByUserId: "user-fin-01", approvedByUserId: "user-fin-head", postedAt: isoDay(4), updatedAt: isoDay(4) },
  { id: "inv-002", documentNumber: "INV-260402", customerId: "cus-002", customerOrVendorName: "Maison Ploen", totalAmount: 32100, paidAmount: 0, dueDate: "18 Apr 2026", status: "APPROVED", createdByUserId: "user-fin-01", approvedByUserId: "user-fin-head", updatedAt: isoDay(5) },
  { id: "inv-003", documentNumber: "INV-260403", customerId: "cus-004", customerOrVendorName: "Siam Duty Free", totalAmount: 162000, paidAmount: 0, dueDate: "25 Apr 2026", status: "PENDING", createdByUserId: "user-fin-02", updatedAt: isoDay(6) },
];

const glAccounts: GLAccount[] = [
  { id: "gl-1000", code: "1000", name: "Cash and Bank", type: "ASSET", balance: 1845000 },
  { id: "gl-1100", code: "1100", name: "Accounts Receivable", type: "ASSET", balance: 403820 },
  { id: "gl-2000", code: "2000", name: "Accounts Payable", type: "LIABILITY", balance: 208940 },
  { id: "gl-4000", code: "4000", name: "Sales Revenue", type: "REVENUE", balance: 1235080 },
  { id: "gl-5100", code: "5100", name: "Freight Expense", type: "EXPENSE", balance: 47280 },
];

const journalEntries: JournalEntry[] = [
  { id: "jr-001", journalNumber: "GL-260401", accountId: "gl-1100", description: "Invoice posting batch", debit: 84500, credit: 0, status: "POSTED", customerOrVendorName: "Ledger", totalAmount: 84500, documentNumber: "GL-260401", createdByUserId: "user-fin-01", postedAt: isoDay(4), updatedAt: isoDay(4) },
  { id: "jr-002", journalNumber: "GL-260402", accountId: "gl-4000", description: "Sales revenue recognition", debit: 0, credit: 84500, status: "POSTED", customerOrVendorName: "Ledger", totalAmount: 84500, documentNumber: "GL-260402", createdByUserId: "user-fin-01", postedAt: isoDay(4), updatedAt: isoDay(4) },
  { id: "jr-003", journalNumber: "GL-260403", accountId: "gl-2000", description: "Packaging accrual", debit: 0, credit: 48200, status: "APPROVED", customerOrVendorName: "Ledger", totalAmount: 48200, documentNumber: "GL-260403", createdByUserId: "user-fin-02", updatedAt: isoDay(5) },
];

function createStockRows(sourceProducts: Product[]): Stock[] {
  const conditions: Stock["condition"][] = ["SELLABLE", "SELLABLE", "SELLABLE", "DAMAGED", "SELLABLE", "EXPIRED"];
  return Array.from({ length: 64 }, (_, index) => {
    const product = sourceProducts[index % sourceProducts.length];
    const stockOnHand = 26 + (index % 11) * 7;
    const reserved = index % 5 === 0 ? 8 : index % 3;
    return {
      id: `stk-${index + 1}`,
      productId: product.id,
      warehouseId: MAIN_WAREHOUSE.id,
      lotNumber: `LOT-26${(index + 1).toString().padStart(3, "0")}`,
      stockOnHand,
      reserved,
      available: calculateAvailableStock(stockOnHand, reserved),
      maxCapacity: 220,
      condition: conditions[index % conditions.length],
      updatedAt: isoDay(index % 7),
    };
  });
}

export function createOrrySeedData(): OrryStoreSnapshot {
  return {
    products: [...products],
    customers: [...customers],
    vendors: [...vendors],
    warehouses: [{ ...MAIN_WAREHOUSE }],
    stock: createStockRows(products),
    salesOrders: [...salesOrders],
    purchaseOrders: [...purchaseOrders],
    invoices: [...invoices],
    glAccounts: [...glAccounts],
    journalEntries: [...journalEntries],
  };
}

export function createWorkspaceActivityMap() {
  return {
    quotation: createModuleActivityFeed("quotation"),
    "sales-order": createModuleActivityFeed("sales-order"),
    invoice: createModuleActivityFeed("invoice"),
    "purchase-requisition": createModuleActivityFeed("purchase-requisition"),
    "purchase-order": createModuleActivityFeed("purchase-order"),
    "stock-balance": createModuleActivityFeed("stock-balance"),
    "goods-receive": createModuleActivityFeed("goods-receive"),
    "goods-issue": createModuleActivityFeed("goods-issue"),
    "stock-transfer": createModuleActivityFeed("stock-transfer"),
    "stock-checking": createModuleActivityFeed("stock-checking"),
    "return-order": createModuleActivityFeed("return-order"),
    "account-receivable": createModuleActivityFeed("account-receivable"),
    "account-payable": createModuleActivityFeed("account-payable"),
    "general-ledger": createModuleActivityFeed("general-ledger"),
    "fixed-assets": createModuleActivityFeed("fixed-assets"),
    "master-data": createModuleActivityFeed("master-data"),
    users: createModuleActivityFeed("users"),
    settings: createModuleActivityFeed("settings"),
  };
}
