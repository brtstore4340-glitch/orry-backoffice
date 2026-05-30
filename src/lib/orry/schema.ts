export type HealthTone = "ok" | "warning" | "critical" | "neutral";
export type DocumentStatus = "DRAFT" | "PENDING" | "APPROVED" | "POSTED" | "CANCELLED";
export type ReturnCondition = "SELLABLE" | "DAMAGED" | "EXPIRED";
export type OrryNavGroupKey = "sales" | "purchasing" | "inventory" | "finance" | "asset" | "system";
export type OrryModuleKey =
  | "quotation"
  | "sales-order"
  | "invoice"
  | "purchase-requisition"
  | "purchase-order"
  | "stock-balance"
  | "goods-receive"
  | "goods-issue"
  | "stock-transfer"
  | "stock-checking"
  | "return-order"
  | "account-receivable"
  | "account-payable"
  | "general-ledger"
  | "fixed-assets"
  | "master-data"
  | "users"
  | "settings";

export type ApiResourceKey =
  | "products"
  | "customers"
  | "vendors"
  | "stock"
  | "sales-orders"
  | "purchase-orders"
  | "invoices"
  | "gl";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  reorderPoint: number;
  status: HealthTone;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  channel: string;
  creditLimit: number;
  balanceDue: number;
  status: HealthTone;
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  leadTimeDays: number;
  paymentTermDays: number;
  status: HealthTone;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  capacity: number;
  usedCapacity: number;
}

export interface Stock {
  id: string;
  productId: string;
  warehouseId: string;
  lotNumber: string;
  stockOnHand: number;
  reserved: number;
  available: number;
  maxCapacity: number;
  condition: ReturnCondition;
  updatedAt: string;
}

export interface WorkflowDocument {
  id: string;
  documentNumber: string;
  customerOrVendorName: string;
  totalAmount: number;
  status: DocumentStatus;
  createdByUserId: string;
  approvedByUserId?: string;
  postedAt?: string;
  updatedAt: string;
}

export interface SalesOrder extends WorkflowDocument {
  customerId: string;
  itemCount: number;
  shipmentWindow: string;
}

export interface PurchaseOrder extends WorkflowDocument {
  vendorId: string;
  itemCount: number;
  expectedDate: string;
}

export interface Invoice extends WorkflowDocument {
  customerId: string;
  dueDate: string;
  paidAmount: number;
}

export interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  balance: number;
}

export interface JournalEntry extends WorkflowDocument {
  journalNumber: string;
  accountId: string;
  description: string;
  debit: number;
  credit: number;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  timestamp: string;
  user: string;
  result: "SUCCESS" | "WARNING" | "FAILED";
  detail: string;
}

export interface ModuleKpi {
  label: string;
  value: string;
  hint: string;
  tone?: HealthTone;
}

export interface ModuleTab {
  label: string;
  value: string;
  active?: boolean;
}

export interface ModuleAction {
  label: string;
  href: string;
  tone?: "primary" | "secondary" | "ghost";
}

export interface TableCell {
  value: string;
  tone?: HealthTone;
  emphasis?: "primary" | "secondary";
  align?: "left" | "right" | "center";
}

export interface TableRow {
  id: string;
  cells: TableCell[];
}

export interface OrryModulePageData {
  module: OrryModuleKey;
  group: OrryNavGroupKey;
  title: string;
  eyebrow: string;
  description: string;
  summary: string;
  kpis: ModuleKpi[];
  tabs: ModuleTab[];
  actions: ModuleAction[];
  columns: string[];
  rows: TableRow[];
  activities: ActivityLogEntry[];
}

export interface OrryStoreSnapshot {
  products: Product[];
  customers: Customer[];
  vendors: Vendor[];
  warehouses: Warehouse[];
  stock: Stock[];
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  invoices: Invoice[];
  glAccounts: GLAccount[];
  journalEntries: JournalEntry[];
}

export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
  meta?: Record<string, string | number | boolean>;
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: "VALIDATION_ERROR" | "NOT_FOUND" | "INVALID_TRANSITION" | "INVENTORY_VIOLATION";
    message: string;
    details?: Record<string, string | number | boolean>;
  };
}
