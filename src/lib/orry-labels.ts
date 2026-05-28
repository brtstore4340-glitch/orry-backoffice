import type { ContactType, ProductKind, RoleCode } from "@/lib/types";
import { thaiCanonicalTerms } from "@/lib/thai-terminology";

export const thaiActionLabels = {
  create: "สร้างเอกสาร",
  edit: "แก้ไข",
  saveDraft: "บันทึกร่าง",
  submit: "ส่งอนุมัติ",
  approve: "อนุมัติ",
  reject: "ไม่อนุมัติ",
  send: "ส่งเอกสาร",
  share: "แชร์",
  email: "ส่งอีเมล",
  cancel: "ยกเลิกเอกสาร",
  duplicate: "ทำสำเนา",
  print: "พิมพ์เอกสาร",
  recordPayment: "บันทึกการชำระเงิน",
  recordReceipt: thaiCanonicalTerms.recordReceipt,
  addAttachment: "แนบไฟล์"
} as const;

const thaiWorkflowStatusLabels: Record<string, string> = {
  DRAFT: "ร่าง",
  PENDING: "รออนุมัติ",
  PENDING_APPROVAL: "รออนุมัติ",
  AWAITING_APPROVAL: "รออนุมัติ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ไม่อนุมัติ",
  ISSUED: "ออกเอกสารแล้ว",
  SENT: "ส่งแล้ว",
  ACCEPTED: "ตอบรับแล้ว",
  PARTIALLY_PAID: "ชำระบางส่วน",
  PARTIALLY_RECEIVED: "รับบางส่วน",
  RECEIVED: "รับครบแล้ว",
  PAID: "ชำระแล้ว",
  OVERDUE: "เกินกำหนด",
  FULFILLED: "ดำเนินการครบแล้ว",
  CANCELLED: "ยกเลิก",
  ARCHIVED: "เก็บถาวร"
};

const thaiOperationalStatusLabels: Record<string, string> = {
  OPEN: "ค้างเอกสาร",
  LOW_STOCK: "ใกล้ถึงจุดสั่งซื้อ",
  ACTIVE: "ใช้งาน",
  INACTIVE: "ไม่ใช้งาน",
  DISCONTINUED: "ยกเลิกขาย",
  SUCCESS: "สำเร็จ",
  FAILED: "ล้มเหลว"
};

export const thaiStatusLabels: Record<string, string> = {
  ...thaiWorkflowStatusLabels,
  ...thaiOperationalStatusLabels
};

export const thaiDocumentTypeLabels: Record<string, string> = {
  PROPOSAL: "ใบเสนอราคา",
  SALES_ORDER: "ใบสั่งขาย",
  BILLING_RECORD: thaiCanonicalTerms.billingNote,
  CASH_INVOICE: thaiCanonicalTerms.cashInvoice,
  TAX_INVOICE: "ใบกำกับภาษี",
  RECEIPT: "ใบเสร็จรับเงิน",
  EXPENSE: thaiCanonicalTerms.expense,
  PURCHASE_ORDER: "ใบสั่งซื้อ",
  WITHHOLDING_TAX: "ภาษีหัก ณ ที่จ่าย"
};

export const thaiContactTypeLabels: Record<ContactType, string> = {
  CUSTOMER: "ลูกค้า",
  COMPANY: "บริษัท",
  VENDOR: "ผู้ขาย",
  PARTNER: thaiCanonicalTerms.partner
};

export const thaiProductKindLabels: Record<ProductKind, string> = {
  INVENTORY: "สินค้า",
  SERVICE: "บริการ",
  NON_INVENTORY: "ไม่ตัดสต็อก"
};

export const thaiRoleLabels: Record<RoleCode, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  SALES: "ฝ่ายขาย",
  FINANCE: "การเงิน",
  OPERATIONS: "ปฏิบัติการ",
  EXECUTIVE: "ผู้บริหาร"
};

export const thaiNavItems = [
  { href: "/dashboard", label: "ภาพรวมงาน" },
  { href: "/contacts", label: "ผู้ติดต่อ" },
  { href: "/products", label: "สินค้าและบริการ" },
  { href: "/documents/quotations", label: "ใบเสนอราคา" },
  { href: "/documents/billing-notes", label: thaiCanonicalTerms.billingNote },
  { href: "/documents/cash-invoices", label: thaiCanonicalTerms.cashInvoice },
  { href: "/documents/tax-invoices", label: "ใบกำกับภาษี" },
  { href: "/documents/receipts", label: "ใบเสร็จรับเงิน" },
  { href: "/documents/expenses", label: thaiCanonicalTerms.expense },
  { href: "/documents/purchase-orders", label: "ใบสั่งซื้อ" },
  { href: "/inventory/receivings", label: "รับเข้าสินค้า" },
  { href: "/documents/withholding-tax", label: "ภาษีหัก ณ ที่จ่าย" },
  { href: "/settings/company", label: "ข้อมูลบริษัท" },
  { href: "/settings/bank-accounts", label: "บัญชีธนาคาร" },
  { href: "/admin/users", label: "ผู้ใช้งาน" },
  { href: "/admin/approvals", label: "คำขออนุมัติ" }
] as const;

export function formatThaiStatusLabel(value: string) {
  return thaiStatusLabels[value] ?? value.replaceAll("_", " ");
}

export function formatThaiDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(date);
}

export function formatThaiCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(amount);
}
