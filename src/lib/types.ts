export type RoleCode = "ADMIN" | "SALES" | "FINANCE" | "OPERATIONS" | "EXECUTIVE";
export type DocumentKind = "PROPOSAL" | "SALES_ORDER" | "BILLING_RECORD" | "RECEIPT" | "PURCHASE_ORDER" | "EXPENSE";
export type DocumentStatus =
  | "DRAFT"
  | "AWAITING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "ISSUED"
  | "SENT"
  | "ACCEPTED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "FULFILLED"
  | "CANCELLED"
  | "ARCHIVED";
export type DocumentModuleKey =
  | "quotation"
  | "billing_note"
  | "cash_invoice"
  | "tax_invoice"
  | "receipt"
  | "expense"
  | "purchase_order"
  | "inventory_receiving"
  | "withholding_tax";
export type PersistedDocumentModuleKey =
  | "quotation"
  | "billing_note"
  | "cash_invoice"
  | "tax_invoice"
  | "receipt"
  | "expense"
  | "purchase_order";
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

export interface DocumentTimelineItem extends ActivityItem {
  category?: "status" | "email" | "share" | "payment" | "attachment" | "audit";
  fromStatus?: DocumentStatus | string;
  toStatus?: DocumentStatus | string;
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
  moduleKey?: PersistedDocumentModuleKey;
  status: DocumentStatus;
  accountName: string;
  issuedAt: string;
  dueAt?: string;
  totalAmount: number;
  projectName?: string;
  referenceCode?: string;
  branchName?: string;
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
  attachments?: Array<{
    id: string;
    fileName: string;
    storagePath: string;
    mimeType?: string;
    fileSize?: number;
  }>;
  statusHistory?: Array<{
    id: string;
    fromStatus?: DocumentStatus | string;
    toStatus: DocumentStatus | string;
    changedBy?: { name?: string };
    createdAt: Date;
  }>;
  emailLogs?: Array<{
    id: string;
    sentTo: string;
    status: string;
    createdAt: Date;
  }>;
  shareLogs?: Array<{
    id: string;
    channel: string;
    sharedTo?: string;
    sharedBy?: { name?: string };
    sharedAt: Date;
  }>;
  references: Array<{ label: string; documentNumber: string; documentId: string }>;
}

export interface AccountingDocumentAction {
  key: "create" | "edit" | "saveDraft" | "submit" | "approve" | "reject" | "send" | "share" | "email" | "cancel" | "duplicate" | "print" | "recordPayment" | "recordReceipt" | "addAttachment";
  label: string;
}

export interface CompanyProfileView {
  id: string;
  displayName: string;
  legalName: string;
  taxId?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  defaultBranchId?: string;
  defaultBranchName?: string;
  defaultBranchCode?: string;
  bankAccounts: Array<{
    id: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch?: string;
    isPrimary: boolean;
  }>;
  branches: CompanyBranchSummary[];
}

export interface CompanyTaxProfileView {
  taxId?: string;
  vatRegistered: boolean;
  branchId?: string;
  branchName?: string;
  branchCode?: string;
  withholdingEnabled: boolean;
  taxOffice?: string;
  revenueCode?: string;
}

export interface CompanyBranchSummary {
  id: string;
  branchCode: string;
  branchName: string;
  isHeadOffice: boolean;
  active: boolean;
}

export interface ContactDetail extends ContactSummary {
  legalName?: string;
  mobile?: string;
  address?: string;
  zipCode?: string;
  notes?: string;
}

export interface ProductDetail extends ProductSummary {
  description?: string;
  cost: number;
  active: boolean;
}

export interface BankAccountSummary {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  swiftCode?: string;
  isPrimary: boolean;
}

export interface BankAccountDetail extends BankAccountSummary {
  companyDisplayName?: string;
  active: boolean;
}

export interface DashboardSnapshot {
  metrics: DashboardMetric[];
  urgentQueue: Array<{ area: string; status: string; note: string }>;
  recentDocuments: DocumentListItem[];
  lowStock: ProductSummary[];
  recentActivity: ActivityItem[];
}
