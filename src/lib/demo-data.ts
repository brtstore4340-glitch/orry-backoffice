import { BankAccountSummary, CompanyBranchSummary, CompanyProfileView, CompanyTaxProfileView, ContactSummary, DashboardSnapshot, DocumentDetail, DocumentListItem, ProductSummary, UserSession } from "@/lib/types";

export const demoSession: UserSession = {
  id: "demo-admin",
  name: "อริยา ชานิน",
  email: "admin@orry.local",
  role: "ADMIN"
};

export const fallbackCompanyProfile: CompanyProfileView = {
  id: "company_orry",
  displayName: "ORRY",
  legalName: "บริษัท ออร์รี่ คอมเมิร์ซ จำกัด",
  taxId: "0105558096348",
  phone: "02-114-7788",
  email: "ops@orry.co",
  website: "https://orry.co",
  address: "88 ถนนสุขุมวิท 55 แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพมหานคร 10110",
  defaultBranchId: "branch-main",
  defaultBranchName: "สำนักงานใหญ่",
  defaultBranchCode: "00000",
  bankAccounts: [
    {
      id: "bank-1",
      bankName: "ธนาคารกรุงเทพ",
      accountName: "บริษัท ออร์รี่ คอมเมิร์ซ จำกัด",
      accountNumber: "123-4-56789-0",
      branch: "ทองหล่อ",
      isPrimary: true
    }
  ],
  branches: [
    {
      id: "branch-main",
      branchCode: "00000",
      branchName: "สำนักงานใหญ่",
      isHeadOffice: true,
      active: true
    }
  ]
};

export const fallbackCompanyTaxProfile: CompanyTaxProfileView = {
  taxId: "0105558096348",
  vatRegistered: true,
  branchId: "branch-main",
  branchName: "สำนักงานใหญ่",
  branchCode: "00000",
  withholdingEnabled: true,
  taxOffice: "สรรพากรพื้นที่กรุงเทพมหานคร 1",
  revenueCode: "100000"
};

export const fallbackCompanyBranches: CompanyBranchSummary[] = [
  {
    id: "branch-main",
    branchCode: "00000",
    branchName: "สำนักงานใหญ่",
    isHeadOffice: true,
    active: true
  }
];

export const fallbackContacts: ContactSummary[] = [
  {
    id: "acct-1",
    code: "ACCT-001",
    type: "CUSTOMER",
    displayName: "ลูน่า อะเตลิเยร์",
    contactPerson: "กัญญา รุ่ง",
    email: "buyer@lunaatelier.co",
    phone: "081-222-3011",
    taxId: "1035548891123",
    openDocuments: 3
  },
  {
    id: "acct-2",
    code: "ACCT-002",
    type: "CUSTOMER",
    displayName: "เมซงพลีน",
    contactPerson: "นภัทร ศิริ",
    email: "merch@maisonploen.com",
    phone: "089-444-1188",
    openDocuments: 1
  },
  {
    id: "acct-3",
    code: "VEND-001",
    type: "VENDOR",
    displayName: "บลูคาร์ตองซัพพลาย",
    contactPerson: "ปรีชา สอน",
    email: "sales@bluecarton.co",
    phone: "02-991-8822",
    openDocuments: 1
  }
];

export const fallbackProducts: ProductSummary[] = [
  {
    id: "prd-1",
    sku: "ORRY-KISS-001",
    name: "ออโรราเวลมิสต์",
    kind: "INVENTORY",
    stockOnHand: 148,
    reorderPoint: 40,
    unitPrice: 1290,
    barcode: "8851000000011"
  },
  {
    id: "prd-2",
    sku: "ORRY-KISS-002",
    name: "มิดไนต์เวลออยล์",
    kind: "INVENTORY",
    stockOnHand: 62,
    reorderPoint: 30,
    unitPrice: 1590,
    barcode: "8851000000028"
  },
  {
    id: "prd-3",
    sku: "ORRY-SVC-001",
    name: "บริการจัดแต่งแคมเปญพรีเมียม",
    kind: "SERVICE",
    stockOnHand: 0,
    reorderPoint: 0,
    unitPrice: 18500
  }
];

export const fallbackBankAccounts: BankAccountSummary[] = [
  {
    id: "bank-1",
    bankName: "ธนาคารกรุงเทพ",
    accountName: "บริษัท ออร์รี่ คอมเมิร์ซ จำกัด",
    accountNumber: "123-4-56789-0",
    branch: "ทองหล่อ",
    swiftCode: "BKKBTHBK",
    isPrimary: true
  }
];

export const fallbackDocuments: DocumentDetail[] = [
  {
    id: "doc-prp-13",
    documentNumber: "PRP-2026-0013",
    kind: "PROPOSAL",
    moduleKey: "quotation",
    status: "AWAITING_APPROVAL",
    accountName: "ลูน่า อะเตลิเยร์",
    issuedAt: "2026-03-24",
    dueAt: "2026-04-07",
    totalAmount: 45102.11,
    branchName: "สำนักงานใหญ่",
    subtotalAmount: 44370,
    totalAfterDiscountAmount: 42151.5,
    discountAmount: 2218.5,
    vatAmount: 2950.61,
    withholdingAmount: 0,
    projectName: "แคมเปญซัมเมอร์คอลเลกชัน",
    referenceCode: "CMP-2026-Q2-01",
    notes: "จัดทำใบเสนอราคาสำหรับชุดเปิดตัวหน้าร้าน",
    internalNotes: "รออนุมัติจากผู้บริหารก่อนยืนยัน",
    lines: [
      { id: "line-prp-1", title: "มิสต์ออโรรา เวล", description: "โควตาสำหรับชั้นวางหน้าร้านหลัก", quantity: 15, unitLabel: "ขวด", unitPrice: 1290, lineTotal: 19350 },
      { id: "line-prp-2", title: "บริการจัดสไตลิ่งพรีเมียม", description: "งานครีเอทีฟและจัดพื้นที่แคมเปญ", quantity: 1, unitLabel: "โครงการ", unitPrice: 18500, lineTotal: 18500 },
      { id: "line-prp-3", title: "ออยล์มิดไนต์ เวล", description: "ชุดเติมสต็อกระดับกลาง", quantity: 4, unitLabel: "ขวด", unitPrice: 1590, lineTotal: 6360 }
    ],
    payments: [],
    activities: [
      { id: "act-prp-1", action: "created", detail: "รวบรวมฉบับร่างจากบรีฟแคมเปญแล้ว", createdAt: "2026-03-24 09:10", actor: "อาริยา ชานิน" },
      { id: "act-prp-2", action: "submitted", detail: "ส่งเข้าคิวอนุมัติของผู้บริหารแล้ว", createdAt: "2026-03-24 10:05", actor: "อาริยา ชานิน" }
    ],
    references: []
  },
  {
    id: "doc-so-13",
    documentNumber: "SO-2026-0013",
    kind: "SALES_ORDER",
    status: "APPROVED",
    accountName: "ลูน่า อะเตลิเยร์",
    issuedAt: "2026-03-25",
    dueAt: "2026-04-05",
    totalAmount: 45102.11,
    branchName: "สำนักงานใหญ่",
    subtotalAmount: 42151.5,
    totalAfterDiscountAmount: 42151.5,
    discountAmount: 0,
    vatAmount: 2950.61,
    withholdingAmount: 0,
    projectName: "แคมเปญซัมเมอร์คอลเลกชัน",
    referenceCode: "PRP-2026-0013",
    notes: "คำสั่งซื้อเชิงพาณิชย์ที่อนุมัติแล้ว รอคลังปล่อยสินค้า",
    lines: [
      { id: "line-so-1", title: "มิสต์ออโรรา เวล", quantity: 15, unitLabel: "ขวด", unitPrice: 1290, lineTotal: 19350 },
      { id: "line-so-2", title: "บริการจัดสไตลิ่งพรีเมียม", quantity: 1, unitLabel: "โครงการ", unitPrice: 18500, lineTotal: 18500 },
      { id: "line-so-3", title: "ออยล์มิดไนต์ เวล", quantity: 4, unitLabel: "ขวด", unitPrice: 1590, lineTotal: 6360 }
    ],
    payments: [],
    activities: [
      { id: "act-so-1", action: "created", detail: "แปลงมาจากใบเสนอราคาที่อนุมัติแล้ว", createdAt: "2026-03-25 08:40", actor: "อาริยา ชานิน" },
      { id: "act-so-2", action: "approved", detail: "พร้อมปล่อยให้คลังดำเนินการ", createdAt: "2026-03-25 09:00", actor: "อาริยา ชานิน" }
    ],
    references: [{ label: "แปลงมาจาก", documentNumber: "PRP-2026-0013", documentId: "doc-prp-13" }]
  },
  {
    id: "doc-bil-13",
    documentNumber: "BIL-2026-0013",
    kind: "BILLING_RECORD",
    moduleKey: "billing_note",
    status: "ISSUED",
    accountName: "ลูน่า อะเตลิเยร์",
    issuedAt: "2026-03-27",
    dueAt: "2026-04-10",
    totalAmount: 45102.11,
    branchName: "สำนักงานใหญ่",
    subtotalAmount: 42151.5,
    totalAfterDiscountAmount: 42151.5,
    discountAmount: 0,
    vatAmount: 2950.61,
    withholdingAmount: 0,
    projectName: "แคมเปญซัมเมอร์คอลเลกชัน",
    referenceCode: "SO-2026-0013",
    notes: "ออกเอกสารหลังยืนยันการแพ็กสินค้าแล้ว",
    lines: [
      { id: "line-bil-1", title: "มิสต์ออโรรา เวล", quantity: 15, unitLabel: "ขวด", unitPrice: 1290, lineTotal: 19350 },
      { id: "line-bil-2", title: "บริการจัดสไตลิ่งพรีเมียม", quantity: 1, unitLabel: "โครงการ", unitPrice: 18500, lineTotal: 18500 },
      { id: "line-bil-3", title: "ออยล์มิดไนต์ เวล", quantity: 4, unitLabel: "ขวด", unitPrice: 1590, lineTotal: 6360 }
    ],
    payments: [],
    activities: [
      { id: "act-bil-1", action: "issued", detail: "แจ้งทีมติดตามการรับชำระแล้ว", createdAt: "2026-03-27 16:20", actor: "พิม นรินทร์" }
    ],
    references: [{ label: "แปลงมาจาก", documentNumber: "SO-2026-0013", documentId: "doc-so-13" }]
  },
  {
    id: "doc-rct-9",
    documentNumber: "RCT-2026-0009",
    kind: "RECEIPT",
    moduleKey: "receipt",
    status: "PAID",
    accountName: "เมซงพลีน",
    issuedAt: "2026-03-20",
    dueAt: "2026-03-20",
    totalAmount: 25262.7,
    branchName: "สำนักงานใหญ่",
    subtotalAmount: 23610,
    totalAfterDiscountAmount: 23610,
    discountAmount: 0,
    vatAmount: 1652.7,
    withholdingAmount: 0,
    projectName: "เติมสต็อกร้านเดือนมีนาคม",
    referenceCode: "BIL-2026-0007",
    notes: "รับชำระครบถ้วนผ่านการโอนเงิน",
    lines: [
      { id: "line-rct-1", title: "ออยล์มิดไนต์ เวล", quantity: 9, unitLabel: "ขวด", unitPrice: 1590, lineTotal: 14310 },
      { id: "line-rct-2", title: "มิสต์ออโรรา เวล", quantity: 7, unitLabel: "ขวด", unitPrice: 1290, lineTotal: 9030 }
    ],
    payments: [
      { id: "pay-rct-1", amount: 25262.7, method: "TRANSFER", direction: "INBOUND", paidAt: "2026-03-20 14:20", referenceNumber: "TRX-884220", note: "รับจากเมซงพลีนแล้ว" }
    ],
    activities: [
      { id: "act-rct-1", action: "paid", detail: "ฝ่ายการเงินยืนยันรายการโอนแล้ว", createdAt: "2026-03-20 14:25", actor: "พิม นรินทร์" }
    ],
    references: [{ label: "เอกสารที่เกี่ยวข้อง", documentNumber: "BIL-2026-0007", documentId: "doc-bil-7" }]
  }
];

export const fallbackDashboard: DashboardSnapshot = {
  metrics: [
    { label: "ยอดออกบิล", value: "฿70,364.81", hint: "เอกสารที่ออกแล้วและตามเก็บได้" },
    { label: "ยอดรับชำระ", value: "฿25,262.70", hint: "เงินเข้ายืนยันแล้ว" },
    { label: "รออนุมัติ", value: "1", hint: "คิวผู้บริหาร" },
    { label: "เอกสารเชิงพาณิชย์", value: "3", hint: "จากใบเสนอราคาถึงใบวางบิล/ใบแจ้งหนี้" }
  ],
  urgentQueue: [
    { area: "คิวใบเสนอราคา", status: "รออนุมัติ", note: "ชุดแคมเปญซัมเมอร์ต้องได้รับการอนุมัติจากผู้บริหาร" },
    { area: "งานวางบิล", status: "ออกแล้ว", note: "ใบวางบิล/ใบแจ้งหนี้ของลูน่า อะเตลิเยร์จะครบกำหนดใน 12 วัน" },
    { area: "คลังสินค้า", status: "เฝ้าระวัง", note: "ออยล์มิดไนต์ เวลใกล้ถึงจุดสั่งซื้อใหม่" }
  ],
  recentDocuments: fallbackDocuments,
  lowStock: fallbackProducts.filter((product) => product.stockOnHand > 0 && product.stockOnHand <= product.reorderPoint * 2),
  recentActivity: fallbackDocuments.flatMap((item) => item.activities).slice(0, 5)
};

export function fallbackDocumentList(kind?: DocumentListItem["kind"]): DocumentListItem[] {
  return fallbackDocuments.filter((document) => (kind ? document.kind === kind : true));
}

export function fallbackDocumentDetail(id: string): DocumentDetail | null {
  return fallbackDocuments.find((document) => document.id === id) ?? null;
}
