import { thaiCanonicalTerms } from "@/lib/thai-terminology";

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  draft: "ร่าง",
  pending_approval: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ไม่อนุมัติ",
  sent: "ส่งแล้ว",
  accepted: "ตอบรับแล้ว",
  partially_paid: "ชำระบางส่วน",
  paid: "ชำระแล้ว",
  overdue: "เกินกำหนด",
  partially_received: "รับบางส่วน",
  received: "รับครบแล้ว",
  cancelled: "ยกเลิก",
  archived: "เก็บถาวร",
  active: "ใช้งาน",
  inactive: "ไม่ใช้งาน",
  suspended: "ระงับ",
  reset_required: "ต้องเปลี่ยนรหัสผ่าน",
  settled: "ปิดรายการแล้ว",
  billed: "วางบิลแล้ว",
  issued: "ออกเอกสารแล้ว",
};

export const DOCUMENT_ACTION_LABELS: Record<string, string> = {
  create: "สร้างเอกสาร",
  edit: "แก้ไข",
  save_draft: "บันทึกร่าง",
  submit: "ส่งอนุมัติ",
  approve: "อนุมัติ",
  reject: "ไม่อนุมัติ",
  send: "ส่งเอกสาร",
  share: "แชร์",
  email: "ส่งอีเมล",
  cancel: "ยกเลิกเอกสาร",
  duplicate: "ทำสำเนา",
  print: "พิมพ์เอกสาร",
  record_payment: "บันทึกการชำระเงิน",
  record_receipt: thaiCanonicalTerms.recordReceipt,
  add_attachment: "แนบไฟล์",
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  quotation: "ใบเสนอราคา",
  billing_note: thaiCanonicalTerms.billingNote,
  cash_invoice: thaiCanonicalTerms.cashInvoice,
  tax_invoice: "ใบกำกับภาษี",
  receipt: "ใบเสร็จรับเงิน",
  expense: thaiCanonicalTerms.expense,
  purchase_order: "ใบสั่งซื้อ",
  receiving_inventory: "รับเข้าสินค้า",
  withholding_tax: "ภาษีหัก ณ ที่จ่าย",
};

export function toThaiStatus(status?: string | null) {
  if (!status) {
    return "ไม่ระบุสถานะ";
  }

  const normalized = status.trim().toLowerCase();
  return DOCUMENT_STATUS_LABELS[normalized] ?? normalized.replaceAll("_", " ");
}

export function toThaiAction(action?: string | null) {
  if (!action) {
    return "ดำเนินการ";
  }

  const normalized = action.trim().toLowerCase();
  return DOCUMENT_ACTION_LABELS[normalized] ?? normalized.replaceAll("_", " ");
}
