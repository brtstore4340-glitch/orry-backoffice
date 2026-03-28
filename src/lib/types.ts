export type RoleCode = "ADMIN" | "SALES" | "FINANCE" | "OPERATIONS" | "EXECUTIVE";
export type DocumentKind = "PROPOSAL" | "SALES_ORDER" | "BILLING_RECORD" | "RECEIPT" | "PURCHASE_ORDER" | "EXPENSE";
export type DocumentStatus = "DRAFT" | "AWAITING_APPROVAL" | "APPROVED" | "ISSUED" | "FULFILLED" | "PAID" | "CANCELLED";
export type PaymentMethod = "CASH" | "TRANSFER" | "CREDIT_CARD" | "CHEQUE";
export type ContactType = "CUSTOMER" | "COMPANY" | "VENDOR" | "PARTNER";
export type ProductKind = "INVENTORY" | "SERVICE" | "NON_INVENTORY";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: RoleCode;
}

export interface DashboardMetric {
  label: string;
  value: string;
  hint?: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
  actor?: string;
}

export interface ContactSummary {
  id: string;
  code: string;
  type: ContactType;
  displayName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  openDocuments: number;
}

export interface ProductSummary {
  id: string;
  sku: string;
  name: string;
  kind: ProductKind;
  stockOnHand: number;
  reorderPoint: number;
  unitPrice: number;
  barcode?: string;
}

export interface DocumentListItem {
  id: string;
  documentNumber: string;
  kind: DocumentKind;
  status: DocumentStatus;
  accountName: string;
  issuedAt: string;
  dueAt?: string;
  totalAmount: number;
  projectName?: string;
  referenceCode?: string;
}

export interface DocumentLineItem {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unitLabel: string;
  unitPrice: number;
  lineTotal: number;
}

export interface PaymentItem {
  id: string;
  amount: number;
  method: PaymentMethod;
  direction: "INBOUND" | "OUTBOUND";
  paidAt: string;
  referenceNumber?: string;
  note?: string;
}

export interface DocumentDetail extends DocumentListItem {
  notes?: string;
  internalNotes?: string;
  subtotalAmount: number;
  vatAmount: number;
  discountAmount: number;
  totalAfterDiscountAmount: number;
  totalAmount: number;
  withholdingAmount: number;
  lines: DocumentLineItem[];
  payments: PaymentItem[];
  activities: ActivityItem[];
  references: Array<{ label: string; documentNumber: string; documentId: string }>;
}

export interface CompanyProfileView {
  displayName: string;
  legalName: string;
  taxId?: string;
  branchName?: string;
  branchCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  bankAccounts: Array<{
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch?: string;
    isPrimary: boolean;
  }>;
}

export interface DashboardSnapshot {
  metrics: DashboardMetric[];
  urgentQueue: Array<{ area: string; status: string; note: string }>;
  recentDocuments: DocumentListItem[];
  lowStock: ProductSummary[];
  recentActivity: ActivityItem[];
}