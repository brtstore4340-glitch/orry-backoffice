import { CompanyProfileView, ContactSummary, DashboardSnapshot, DocumentDetail, DocumentListItem, ProductSummary, UserSession } from "@/lib/types";

export const demoSession: UserSession = {
  id: "demo-admin",
  name: "Ariya Chanin",
  email: "admin@orry.local",
  role: "ADMIN"
};

export const fallbackCompanyProfile: CompanyProfileView = {
  displayName: "ORRY",
  legalName: "ORRY Commerce Co., Ltd.",
  taxId: "0105558096348",
  branchName: "Head Office",
  branchCode: "00000",
  phone: "02-114-7788",
  email: "ops@orry.co",
  website: "https://orry.co",
  address: "88 Sukhumvit 55, Khlong Tan Nuea, Watthana, Bangkok 10110",
  bankAccounts: [
    {
      bankName: "Bangkok Bank",
      accountName: "ORRY Commerce Co., Ltd.",
      accountNumber: "123-4-56789-0",
      branch: "Thong Lo",
      isPrimary: true
    }
  ]
};

export const fallbackContacts: ContactSummary[] = [
  {
    id: "acct-1",
    code: "ACCT-001",
    type: "CUSTOMER",
    displayName: "Luna Atelier",
    contactPerson: "Kanya Rung",
    email: "buyer@lunaatelier.co",
    phone: "081-222-3011",
    taxId: "1035548891123",
    openDocuments: 3
  },
  {
    id: "acct-2",
    code: "ACCT-002",
    type: "CUSTOMER",
    displayName: "Maison Ploen",
    contactPerson: "Napat Siri",
    email: "merch@maisonploen.com",
    phone: "089-444-1188",
    openDocuments: 1
  },
  {
    id: "acct-3",
    code: "VEND-001",
    type: "VENDOR",
    displayName: "Blue Carton Supply",
    contactPerson: "Preecha Son",
    email: "sales@bluecarton.co",
    phone: "02-991-8822",
    openDocuments: 1
  }
];

export const fallbackProducts: ProductSummary[] = [
  {
    id: "prd-1",
    sku: "ORRY-KISS-001",
    name: "Aurora Veil Mist",
    kind: "INVENTORY",
    stockOnHand: 148,
    reorderPoint: 40,
    unitPrice: 1290,
    barcode: "8851000000011"
  },
  {
    id: "prd-2",
    sku: "ORRY-KISS-002",
    name: "Midnight Veil Oil",
    kind: "INVENTORY",
    stockOnHand: 62,
    reorderPoint: 30,
    unitPrice: 1590,
    barcode: "8851000000028"
  },
  {
    id: "prd-3",
    sku: "ORRY-SVC-001",
    name: "Premium Campaign Styling",
    kind: "SERVICE",
    stockOnHand: 0,
    reorderPoint: 0,
    unitPrice: 18500
  }
];

export const fallbackDocuments: DocumentDetail[] = [
  {
    id: "doc-prp-13",
    documentNumber: "PRP-2026-0013",
    kind: "PROPOSAL",
    status: "AWAITING_APPROVAL",
    accountName: "Luna Atelier",
    issuedAt: "2026-03-24",
    dueAt: "2026-04-07",
    totalAmount: 45102.11,
    subtotalAmount: 44370,
    totalAfterDiscountAmount: 42151.5,
    discountAmount: 2218.5,
    vatAmount: 2950.61,
    withholdingAmount: 0,
    projectName: "Songkran Capsule Launch",
    referenceCode: "CMP-2026-Q2-01",
    notes: "Proposal prepared for retail launch bundle.",
    internalNotes: "Awaiting executive approval before confirmation.",
    lines: [
      { id: "line-prp-1", title: "Aurora Veil Mist", description: "Launch allocation for flagship shelf placement", quantity: 15, unitLabel: "bottle", unitPrice: 1290, lineTotal: 19350 },
      { id: "line-prp-2", title: "Premium Campaign Styling", description: "Creative direction and pop-up styling", quantity: 1, unitLabel: "project", unitPrice: 18500, lineTotal: 18500 },
      { id: "line-prp-3", title: "Midnight Veil Oil", description: "Mid-tier replenishment set", quantity: 4, unitLabel: "bottle", unitPrice: 1590, lineTotal: 6360 }
    ],
    payments: [],
    activities: [
      { id: "act-prp-1", action: "created", detail: "Proposal draft assembled from campaign brief.", createdAt: "2026-03-24 09:10", actor: "Ariya Chanin" },
      { id: "act-prp-2", action: "submitted", detail: "Submitted to executive approval queue.", createdAt: "2026-03-24 10:05", actor: "Ariya Chanin" }
    ],
    references: []
  },
  {
    id: "doc-so-13",
    documentNumber: "SO-2026-0013",
    kind: "SALES_ORDER",
    status: "APPROVED",
    accountName: "Luna Atelier",
    issuedAt: "2026-03-25",
    dueAt: "2026-04-05",
    totalAmount: 45102.11,
    subtotalAmount: 42151.5,
    totalAfterDiscountAmount: 42151.5,
    discountAmount: 0,
    vatAmount: 2950.61,
    withholdingAmount: 0,
    projectName: "Songkran Capsule Launch",
    referenceCode: "PRP-2026-0013",
    notes: "Approved commercial order awaiting warehouse release.",
    lines: [
      { id: "line-so-1", title: "Aurora Veil Mist", quantity: 15, unitLabel: "bottle", unitPrice: 1290, lineTotal: 19350 },
      { id: "line-so-2", title: "Premium Campaign Styling", quantity: 1, unitLabel: "project", unitPrice: 18500, lineTotal: 18500 },
      { id: "line-so-3", title: "Midnight Veil Oil", quantity: 4, unitLabel: "bottle", unitPrice: 1590, lineTotal: 6360 }
    ],
    payments: [],
    activities: [
      { id: "act-so-1", action: "created", detail: "Converted from approved proposal.", createdAt: "2026-03-25 08:40", actor: "Ariya Chanin" },
      { id: "act-so-2", action: "approved", detail: "Ready for fulfilment release.", createdAt: "2026-03-25 09:00", actor: "Ariya Chanin" }
    ],
    references: [{ label: "Converted from", documentNumber: "PRP-2026-0013", documentId: "doc-prp-13" }]
  },
  {
    id: "doc-bil-13",
    documentNumber: "BIL-2026-0013",
    kind: "BILLING_RECORD",
    status: "ISSUED",
    accountName: "Luna Atelier",
    issuedAt: "2026-03-27",
    dueAt: "2026-04-10",
    totalAmount: 45102.11,
    subtotalAmount: 42151.5,
    totalAfterDiscountAmount: 42151.5,
    discountAmount: 0,
    vatAmount: 2950.61,
    withholdingAmount: 0,
    projectName: "Songkran Capsule Launch",
    referenceCode: "SO-2026-0013",
    notes: "Issued after packing confirmation.",
    lines: [
      { id: "line-bil-1", title: "Aurora Veil Mist", quantity: 15, unitLabel: "bottle", unitPrice: 1290, lineTotal: 19350 },
      { id: "line-bil-2", title: "Premium Campaign Styling", quantity: 1, unitLabel: "project", unitPrice: 18500, lineTotal: 18500 },
      { id: "line-bil-3", title: "Midnight Veil Oil", quantity: 4, unitLabel: "bottle", unitPrice: 1590, lineTotal: 6360 }
    ],
    payments: [],
    activities: [
      { id: "act-bil-1", action: "issued", detail: "Collection team notified.", createdAt: "2026-03-27 16:20", actor: "Pim Narin" }
    ],
    references: [{ label: "Converted from", documentNumber: "SO-2026-0013", documentId: "doc-so-13" }]
  },
  {
    id: "doc-rct-9",
    documentNumber: "RCT-2026-0009",
    kind: "RECEIPT",
    status: "PAID",
    accountName: "Maison Ploen",
    issuedAt: "2026-03-20",
    dueAt: "2026-03-20",
    totalAmount: 25262.7,
    subtotalAmount: 23610,
    totalAfterDiscountAmount: 23610,
    discountAmount: 0,
    vatAmount: 1652.7,
    withholdingAmount: 0,
    projectName: "Retail Restock March",
    referenceCode: "BIL-2026-0007",
    notes: "Collected in full via transfer.",
    lines: [
      { id: "line-rct-1", title: "Midnight Veil Oil", quantity: 9, unitLabel: "bottle", unitPrice: 1590, lineTotal: 14310 },
      { id: "line-rct-2", title: "Aurora Veil Mist", quantity: 7, unitLabel: "bottle", unitPrice: 1290, lineTotal: 9030 }
    ],
    payments: [
      { id: "pay-rct-1", amount: 25262.7, method: "TRANSFER", direction: "INBOUND", paidAt: "2026-03-20 14:20", referenceNumber: "TRX-884220", note: "Collected from Maison Ploen." }
    ],
    activities: [
      { id: "act-rct-1", action: "paid", detail: "Transfer confirmed by finance.", createdAt: "2026-03-20 14:25", actor: "Pim Narin" }
    ],
    references: [{ label: "Related billing", documentNumber: "BIL-2026-0007", documentId: "doc-bil-7" }]
  }
];

export const fallbackDashboard: DashboardSnapshot = {
  metrics: [
    { label: "Booked billing", value: "฿70,364.81", hint: "Issued and collectible" },
    { label: "Collections landed", value: "฿25,262.70", hint: "Confirmed inbound cash" },
    { label: "Approvals waiting", value: "1", hint: "Executive queue" },
    { label: "Open commercial docs", value: "3", hint: "Proposal to billing chain" }
  ],
  urgentQueue: [
    { area: "Proposal desk", status: "Awaiting approval", note: "Songkran capsule commercial package needs executive sign-off." },
    { area: "Billing", status: "Issued", note: "Luna Atelier billing record is due in 12 days." },
    { area: "Inventory", status: "Monitor", note: "Midnight Veil Oil is approaching reorder point." }
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
