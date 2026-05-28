export const thaiCanonicalTerms = {
  billingNote: "ใบวางบิล/ใบแจ้งหนี้",
  cashInvoice: "เอกสารขายเงินสด",
  expense: "ค่าใช้จ่าย",
  partner: "คู่ค้า",
  recordReceipt: "บันทึกการรับชำระเงิน",
  bankAccountMapping: "การจับคู่ช่องทางรับ-จ่ายเงิน",
  contactsOverview: "ภาพรวมผู้ติดต่อ",
  contactsDirectory: "รายชื่อผู้ติดต่อ"
} as const;

export const thaiTranslationGovernanceNote = [
  "ใช้คำตาม glossary กลางใน src/lib/thai-terminology.ts และ reports/flowaccount-canonical-thai-glossary.md",
  "ถ้าคำเดียวกันถูกใช้ซ้ำในหลายจอ ให้แก้จากค่ากลางก่อนแก้ข้อความเฉพาะหน้า",
  "อ้างอิง FlowAccount เฉพาะด้านคำศัพท์โดเมน ไม่คัดลอกแบรนด์หรือข้อความการตลาดมาแสดงใน ORRY",
  "หลีกเลี่ยงคำทับศัพท์ตรงตัวเมื่อมีคำธุรกิจไทยที่ใช้จริง เช่น เอกสารขายเงินสด, ค่าใช้จ่าย, คู่ค้า"
] as const;
