import { getDocumentById, getDocuments } from "@/lib/repository";
import { getPrisma } from "@/lib/db";
import { formatThaiCurrency, formatThaiDate, thaiActionLabels, thaiDocumentTypeLabels, thaiStatusLabels } from "@/lib/orry-labels";
import { thaiCanonicalTerms } from "@/lib/thai-terminology";
import type { AccountingDocumentAction, DocumentKind, DocumentModuleKey, DocumentStatus, PersistedDocumentModuleKey } from "@/lib/types";

export interface AccountingDocumentLine {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unitLabel: string;
  unitPrice: number;
  lineTotal: number;
}

export interface AccountingDocumentEvent {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
  actor?: string;
  category?: "status" | "email" | "share" | "payment" | "attachment" | "audit";
}

export interface AccountingDocumentPayment {
  id: string;
  amount: number;
  method: string;
  direction: "INBOUND" | "OUTBOUND";
  paidAt: string;
  referenceNumber?: string;
  note?: string;
}

export interface AccountingDocumentAttachment {
  id: string;
  fileName: string;
  storagePath: string;
  mimeType?: string;
  fileSize?: number;
}

export interface AccountingDocumentView {
  id: string;
  documentNumber: string;
  moduleKey: DocumentModuleKey;
  moduleLabel: string;
  status: DocumentStatus | string;
  accountName: string;
  branchName?: string;
  issuedAt: string;
  dueAt?: string;
  totalAmount: number;
  projectName?: string;
  referenceCode?: string;
  notes?: string;
  internalNotes?: string;
  subtotalAmount: number;
  vatAmount: number;
  discountAmount: number;
  totalAfterDiscountAmount: number;
  withholdingAmount: number;
  lines: AccountingDocumentLine[];
  payments: AccountingDocumentPayment[];
  attachments: AccountingDocumentAttachment[];
  activities: AccountingDocumentEvent[];
  references: Array<{ label: string; documentNumber: string; documentId: string }>;
}

export interface AccountingModuleDefinition {
  key: DocumentModuleKey;
  route: string;
  title: string;
  description: string;
  baseKind?: DocumentKind;
  createLabel: string;
  statusOptions: string[];
  actionKeys: AccountingDocumentAction["key"][];
}

const actionLabels: Record<AccountingDocumentAction["key"], string> = {
  create: thaiActionLabels.create,
  edit: thaiActionLabels.edit,
  saveDraft: thaiActionLabels.saveDraft,
  submit: thaiActionLabels.submit,
  approve: thaiActionLabels.approve,
  reject: thaiActionLabels.reject,
  send: thaiActionLabels.send,
  share: thaiActionLabels.share,
  email: thaiActionLabels.email,
  cancel: thaiActionLabels.cancel,
  duplicate: thaiActionLabels.duplicate,
  print: thaiActionLabels.print,
  recordPayment: thaiActionLabels.recordPayment,
  recordReceipt: thaiActionLabels.recordReceipt,
  addAttachment: thaiActionLabels.addAttachment
};

const baseModules: AccountingModuleDefinition[] = [
  {
    key: "quotation",
    route: "/documents/quotations",
    title: "ใบเสนอราคา",
    description: "ออกแบบข้อเสนอ เชื่อมการอนุมัติ และตามรอยการตอบรับของลูกค้า",
    baseKind: "PROPOSAL",
    createLabel: "สร้างใบเสนอราคา",
    statusOptions: ["DRAFT", "AWAITING_APPROVAL", "APPROVED", "SENT", "ACCEPTED", "REJECTED", "CANCELLED", "ARCHIVED"],
    actionKeys: ["create", "saveDraft", "submit", "approve", "reject", "send", "share", "email", "duplicate", "print", "cancel", "addAttachment"]
  },
  {
    key: "billing_note",
    route: "/documents/billing-notes",
    title: thaiCanonicalTerms.billingNote,
    description: "รวบรวมรายการที่ออกบิลแล้ว พร้อมส่งต่อการรับชำระ",
    baseKind: "BILLING_RECORD",
    createLabel: `สร้าง${thaiCanonicalTerms.billingNote}`,
    statusOptions: ["DRAFT", "APPROVED", "SENT", "PAID", "CANCELLED", "ARCHIVED"],
    actionKeys: ["create", "saveDraft", "send", "share", "email", "duplicate", "print", "cancel", "addAttachment"]
  },
  {
    key: "cash_invoice",
    route: "/documents/cash-invoices",
    title: thaiCanonicalTerms.cashInvoice,
    description: "ออกเอกสารรับชำระทันทีและเก็บหลักฐานการรับเงิน",
    baseKind: "BILLING_RECORD",
    createLabel: `สร้าง${thaiCanonicalTerms.cashInvoice}`,
    statusOptions: ["DRAFT", "APPROVED", "ISSUED", "PAID", "PARTIALLY_PAID", "CANCELLED", "ARCHIVED"],
    actionKeys: ["create", "saveDraft", "submit", "approve", "send", "recordPayment", "share", "email", "duplicate", "print", "cancel", "addAttachment"]
  },
  {
    key: "tax_invoice",
    route: "/documents/tax-invoices",
    title: "ใบกำกับภาษี",
    description: "ควบคุมภาษีขาย ยอดค้างชำระ และสถานะเกินกำหนด",
    baseKind: "BILLING_RECORD",
    createLabel: "สร้างใบกำกับภาษี",
    statusOptions: ["DRAFT", "APPROVED", "ISSUED", "PAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED", "ARCHIVED"],
    actionKeys: ["create", "saveDraft", "submit", "approve", "send", "recordPayment", "share", "email", "duplicate", "print", "cancel", "addAttachment"]
  },
  {
    key: "receipt",
    route: "/documents/receipts",
    title: "ใบเสร็จรับเงิน",
    description: "บันทึกการรับชำระเงินและปิดรายการด้วยหลักฐานที่ตรวจสอบย้อนหลังได้",
    baseKind: "RECEIPT",
    createLabel: "สร้างใบเสร็จรับเงิน",
    statusOptions: ["DRAFT", "ISSUED", "PAID", "CANCELLED", "ARCHIVED"],
    actionKeys: ["create", "saveDraft", "recordReceipt", "share", "email", "duplicate", "print", "cancel", "addAttachment"]
  },
  {
    key: "expense",
    route: "/documents/expenses",
    title: thaiCanonicalTerms.expense,
    description: "คุมค่าใช้จ่ายและบันทึกการจ่ายเงินจริงพร้อมภาษีหัก ณ ที่จ่าย",
    baseKind: "EXPENSE",
    createLabel: `สร้าง${thaiCanonicalTerms.expense}`,
    statusOptions: ["DRAFT", "AWAITING_APPROVAL", "APPROVED", "PAID", "PARTIALLY_PAID", "CANCELLED", "ARCHIVED"],
    actionKeys: ["create", "saveDraft", "submit", "approve", "reject", "recordPayment", "share", "email", "duplicate", "print", "cancel", "addAttachment"]
  },
  {
    key: "purchase_order",
    route: "/documents/purchase-orders",
    title: "ใบสั่งซื้อ",
    description: "สั่งซื้อจากผู้ขาย ติดตามการส่ง และเชื่อมรับสินค้า",
    baseKind: "PURCHASE_ORDER",
    createLabel: "สร้างใบสั่งซื้อ",
    statusOptions: ["DRAFT", "APPROVED", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED", "ARCHIVED"],
    actionKeys: ["create", "saveDraft", "submit", "approve", "send", "share", "email", "duplicate", "print", "cancel", "addAttachment"]
  },
  {
    key: "inventory_receiving",
    route: "/inventory/receivings",
    title: "รับเข้าสินค้า",
    description: "บันทึกรับสินค้าเข้าคลังหลัก ตรวจนับ และเชื่อมประวัติการเคลื่อนไหว",
    createLabel: "สร้างใบรับสินค้า",
    statusOptions: ["DRAFT", "APPROVED", "RECEIVED", "CANCELLED", "ARCHIVED"],
    actionKeys: ["create", "saveDraft", "approve", "recordReceipt", "print", "cancel"]
  },
  {
    key: "withholding_tax",
    route: "/documents/withholding-tax",
    title: "ภาษีหัก ณ ที่จ่าย",
    description: "ออกหนังสือรับรองหัก ณ ที่จ่ายและติดตามการนำส่ง",
    createLabel: "สร้างหนังสือหัก ณ ที่จ่าย",
    statusOptions: ["DRAFT", "APPROVED", "ISSUED", "CANCELLED", "ARCHIVED"],
    actionKeys: ["create", "saveDraft", "approve", "print", "cancel"]
  }
];

const specialFallback: Partial<Record<DocumentModuleKey, AccountingDocumentView[]>> = {
  inventory_receiving: [
    {
      id: "recv-2026-0001",
      documentNumber: "RCV-2026-0001",
      moduleKey: "inventory_receiving",
      moduleLabel: "รับเข้าสินค้า",
      status: "RECEIVED",
      accountName: "คลังหลัก",
      issuedAt: "2026-03-28",
      dueAt: undefined,
      totalAmount: 43800,
      projectName: "รับล็อตสินค้าเดือนมีนาคม",
      referenceCode: "PO-2026-0108",
      notes: "ตรวจรับสินค้าเข้าคลังหลักเรียบร้อยแล้ว",
      internalNotes: "บันทึกจากรอบรับสินค้าแรกของเดือน",
      subtotalAmount: 43800,
      vatAmount: 0,
      discountAmount: 0,
      totalAfterDiscountAmount: 43800,
      withholdingAmount: 0,
      lines: [
        { id: "recv-line-1", title: "มิสต์ออโรรา เวล", description: "รับเข้าตามใบสั่งซื้อ", quantity: 12, unitLabel: "ขวด", unitPrice: 1290, lineTotal: 15480 },
        { id: "recv-line-2", title: "ออยล์มิดไนต์ เวล", description: "รับเข้าตามล็อตเติมคลัง", quantity: 18, unitLabel: "ขวด", unitPrice: 1590, lineTotal: 28620 }
      ],
      payments: [],
      attachments: [],
      activities: [
        { id: "recv-act-1", action: "receive", detail: "ตรวจนับและรับสินค้าเข้าคลังหลักแล้ว", createdAt: "2026-03-28 10:15", actor: "ฝ่ายปฏิบัติการ", category: "status" },
        { id: "recv-act-2", action: "audit", detail: "ตรวจยอดรับสินค้ากับใบสั่งซื้อเรียบร้อย", createdAt: "2026-03-28 10:25", actor: "คลังสินค้า", category: "audit" }
      ],
      references: [{ label: "อ้างอิงใบสั่งซื้อ", documentNumber: "PO-2026-0108", documentId: "po-2026-0108" }]
    }
  ],
  withholding_tax: [
    {
      id: "wt-2026-0001",
      documentNumber: "WHT-2026-0001",
      moduleKey: "withholding_tax",
      moduleLabel: "ภาษีหัก ณ ที่จ่าย",
      status: "ISSUED",
      accountName: "บริษัท มาสอง จำกัด",
      issuedAt: "2026-03-27",
      dueAt: "2026-04-07",
      totalAmount: 1800,
      projectName: "ค่าบริการออกแบบแคมเปญ",
      referenceCode: "EXP-2026-0042",
      notes: "ออกหนังสือรับรองและเตรียมนำส่งภาษี",
      internalNotes: "หัก 3% จากยอดค่าบริการ",
      subtotalAmount: 60000,
      vatAmount: 0,
      discountAmount: 0,
      totalAfterDiscountAmount: 60000,
      withholdingAmount: 1800,
      lines: [
        { id: "wt-line-1", title: "ค่าบริการออกแบบ", description: "ฐานภาษีสำหรับหัก ณ ที่จ่าย", quantity: 1, unitLabel: "งาน", unitPrice: 60000, lineTotal: 60000 }
      ],
      payments: [],
      attachments: [],
      activities: [
        { id: "wt-act-1", action: "issued", detail: "ออกหนังสือรับรองหัก ณ ที่จ่ายแล้ว", createdAt: "2026-03-27 16:30", actor: "ฝ่ายการเงิน", category: "status" }
      ],
      references: [{ label: "อ้างอิงค่าใช้จ่าย", documentNumber: "EXP-2026-0042", documentId: "exp-2026-0042" }]
    }
  ]
};

function mapBaseDocument(moduleKey: DocumentModuleKey, document: Awaited<ReturnType<typeof getDocuments>>[number]): AccountingDocumentView {
  const moduleLabel = thaiDocumentTypeLabels[document.kind] ?? document.kind;
  return {
    id: document.id,
    documentNumber: document.documentNumber,
    moduleKey,
    moduleLabel,
    status: document.status,
    accountName: document.accountName,
    branchName: document.branchName,
    issuedAt: document.issuedAt,
    dueAt: document.dueAt,
    totalAmount: document.totalAmount,
    projectName: document.projectName,
    referenceCode: document.referenceCode,
    notes: undefined,
    internalNotes: undefined,
    subtotalAmount: 0,
    vatAmount: 0,
    discountAmount: 0,
    totalAfterDiscountAmount: 0,
    withholdingAmount: 0,
    lines: [],
    payments: [],
    attachments: [],
    activities: [],
    references: []
  };
}

function baseKindForModule(moduleKey: DocumentModuleKey): DocumentKind | undefined {
  return moduleCatalog.find((module) => module.key === moduleKey)?.baseKind;
}

function persistedModuleKey(moduleKey: DocumentModuleKey): PersistedDocumentModuleKey | undefined {
  switch (moduleKey) {
    case "quotation":
    case "billing_note":
    case "cash_invoice":
    case "tax_invoice":
    case "receipt":
    case "expense":
    case "purchase_order":
      return moduleKey;
    default:
      return undefined;
  }
}

export function getModuleBaseKind(moduleKey: DocumentModuleKey) {
  return baseKindForModule(moduleKey);
}

export const moduleCatalog = baseModules;

export function getModuleDefinition(moduleKey: DocumentModuleKey) {
  return moduleCatalog.find((module) => module.key === moduleKey) ?? moduleCatalog[0];
}

export function getModuleActions(moduleKey: DocumentModuleKey) {
  return getModuleDefinition(moduleKey).actionKeys.map((key) => ({ key, label: actionLabels[key] }));
}

export function getModuleStatusOptions(moduleKey: DocumentModuleKey) {
  return getModuleDefinition(moduleKey).statusOptions.map((status) => ({
    value: status,
    label: thaiStatusLabels[status] ?? status
  }));
}

export function getModuleListPath(moduleKey: DocumentModuleKey) {
  return getModuleDefinition(moduleKey).route;
}

export function getModuleCreatePath(moduleKey: DocumentModuleKey) {
  return `${getModuleListPath(moduleKey)}/new`;
}

export function getModuleDetailPath(moduleKey: DocumentModuleKey, id: string) {
  return `${getModuleListPath(moduleKey)}/${id}`;
}

export function getModuleTitle(moduleKey: DocumentModuleKey) {
  return getModuleDefinition(moduleKey).title;
}

export function getModuleDescription(moduleKey: DocumentModuleKey) {
  return getModuleDefinition(moduleKey).description;
}

export function getModuleDisplayKind(moduleKey: DocumentModuleKey) {
  const baseKind = baseKindForModule(moduleKey);
  return baseKind ? thaiDocumentTypeLabels[baseKind] ?? baseKind : getModuleDefinition(moduleKey).title;
}

export function getModuleKeyForKind(kind: DocumentKind): DocumentModuleKey {
  const match = moduleCatalog.find((module) => module.baseKind === kind);
  return match?.key ?? "quotation";
}

export function resolveModuleKeyFromDocument(document: { kind: DocumentKind; moduleKey?: PersistedDocumentModuleKey }) {
  return document.moduleKey ?? getModuleKeyForKind(document.kind);
}

export async function listAccountingDocuments(moduleKey: DocumentModuleKey): Promise<AccountingDocumentView[]> {
  const baseKind = baseKindForModule(moduleKey);
  if (baseKind) {
    const documents = await getDocuments(baseKind, persistedModuleKey(moduleKey));
    return documents.map((document) => ({
      ...mapBaseDocument(moduleKey, document),
      moduleLabel: getModuleDisplayKind(moduleKey),
      status: document.status,
      subtotalAmount: document.totalAmount,
      vatAmount: 0,
      discountAmount: 0,
      totalAfterDiscountAmount: document.totalAmount,
      withholdingAmount: 0,
      lines: [],
      payments: [],
      attachments: [],
      activities: [],
      references: []
    }));
  }

  const prisma = getPrisma() as any;
  if (prisma) {
    try {
      if (moduleKey === "inventory_receiving") {
        const receipts = await prisma.inventoryReceipt.findMany({
          include: { warehouse: true, lines: { include: { product: true }, orderBy: { createdAt: "asc" } } },
          orderBy: { updatedAt: "desc" }
        });

        return receipts.map((receipt: any) => ({
          id: receipt.id,
          documentNumber: receipt.receiptNumber,
          moduleKey,
          moduleLabel: getModuleDisplayKind(moduleKey),
          status: receipt.status,
          accountName: receipt.warehouse?.name ?? "คลังหลัก",
          issuedAt: receipt.receivedAt?.toISOString().slice(0, 10) ?? receipt.createdAt.toISOString().slice(0, 10),
          totalAmount: receipt.lines.reduce((sum: number, line: any) => sum + Number(line.unitCost ?? 0) * Number(line.quantity ?? 0), 0),
          referenceCode: receipt.purchaseOrderId ?? receipt.documentId ?? undefined,
          notes: receipt.notes ?? undefined,
          internalNotes: undefined,
          subtotalAmount: receipt.lines.reduce((sum: number, line: any) => sum + Number(line.unitCost ?? 0) * Number(line.quantity ?? 0), 0),
          vatAmount: 0,
          discountAmount: 0,
          totalAfterDiscountAmount: receipt.lines.reduce((sum: number, line: any) => sum + Number(line.unitCost ?? 0) * Number(line.quantity ?? 0), 0),
          withholdingAmount: 0,
          lines: receipt.lines.map((line: any) => ({
            id: line.id,
            title: line.product?.name ?? "รายการสินค้า",
            description: line.product?.description ?? line.description ?? undefined,
            quantity: Number(line.quantity),
            unitLabel: line.product?.unitLabel ?? "หน่วย",
            unitPrice: Number(line.unitCost),
            lineTotal: Number(line.unitCost) * Number(line.quantity)
          })),
          payments: [],
          attachments: [],
          activities: [
            {
              id: receipt.id,
              action: "รับสินค้า",
              detail: "บันทึกรับเข้าสินค้าจากฐานข้อมูลจริง",
              createdAt: receipt.updatedAt.toISOString(),
              actor: undefined,
              category: "status"
            }
          ],
          references: []
        }));
      }

      if (moduleKey === "withholding_tax") {
        const documents = await prisma.withholdingTaxDocument.findMany({
          include: { contact: true, lines: { orderBy: { createdAt: "asc" } } },
          orderBy: { updatedAt: "desc" }
        });

        return documents.map((document: any) => ({
          id: document.id,
          documentNumber: document.documentNumber,
          moduleKey,
          moduleLabel: getModuleDisplayKind(moduleKey),
          status: document.status,
          accountName: document.contact?.displayName ?? "คู่ค้า",
          issuedAt: document.issuedAt.toISOString().slice(0, 10),
          totalAmount: Number(document.withholdingAmount ?? 0),
          notes: document.notes ?? undefined,
          subtotalAmount: Number(document.totalAmount ?? 0),
          vatAmount: 0,
          discountAmount: 0,
          totalAfterDiscountAmount: Number(document.totalAmount ?? 0),
          withholdingAmount: Number(document.withholdingAmount ?? 0),
          lines: document.lines.map((line: any) => ({
            id: line.id,
            title: line.description,
            description: undefined,
            quantity: 1,
            unitLabel: "รายการ",
            unitPrice: Number(line.amount),
            lineTotal: Number(line.amount)
          })),
          payments: [],
          attachments: [],
          activities: [
            {
              id: document.id,
              action: "ออกหนังสือ",
              detail: "บันทึกหนังสือหัก ณ ที่จ่ายจากฐานข้อมูลจริง",
              createdAt: document.updatedAt.toISOString(),
              actor: undefined,
              category: "status"
            }
          ],
          references: []
        }));
      }
    } catch {
      // Fall through to seeded fallback records.
    }
  }

  return specialFallback[moduleKey] ?? [];
}

export async function getAccountingDocument(moduleKey: DocumentModuleKey, id: string): Promise<AccountingDocumentView | null> {
  const baseKind = baseKindForModule(moduleKey);
  if (baseKind) {
    const document = await getDocumentById(id);
    if (!document || document.kind !== baseKind || (persistedModuleKey(moduleKey) && document.moduleKey !== persistedModuleKey(moduleKey))) {
      return null;
    }
    const detail = document as any;

    return {
      id: document.id,
      documentNumber: document.documentNumber,
      moduleKey,
      moduleLabel: getModuleDisplayKind(moduleKey),
      status: document.status,
      accountName: document.accountName,
      issuedAt: document.issuedAt,
      dueAt: document.dueAt,
      totalAmount: document.totalAmount,
      projectName: document.projectName,
      referenceCode: document.referenceCode,
      notes: document.notes,
      internalNotes: document.internalNotes,
      subtotalAmount: document.subtotalAmount,
      vatAmount: document.vatAmount,
      discountAmount: document.discountAmount,
      totalAfterDiscountAmount: document.totalAfterDiscountAmount,
      withholdingAmount: document.withholdingAmount,
      lines: document.lines,
      payments: document.payments,
      attachments: (detail.attachments ?? []).map((attachment: any) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        storagePath: attachment.storagePath,
        mimeType: attachment.mimeType ?? undefined,
        fileSize: attachment.fileSize ?? undefined
      })),
      activities: [
        ...document.activities,
        ...(detail.statusHistory ?? []).map((entry: any) => ({
          id: entry.id,
          action: "สถานะเปลี่ยน",
          detail: `${thaiStatusLabels[entry.fromStatus ?? "DRAFT"] ?? entry.fromStatus ?? "ร่าง"} → ${thaiStatusLabels[entry.toStatus] ?? entry.toStatus}`,
          createdAt: entry.createdAt.toISOString(),
          actor: entry.changedBy?.name ?? undefined,
          category: "status" as const
        })),
        ...(detail.emailLogs ?? []).map((entry: any) => ({
          id: entry.id,
          action: "ส่งอีเมล",
          detail: `${entry.sentTo} · ${entry.status}`,
          createdAt: entry.createdAt.toISOString(),
          actor: undefined,
          category: "email" as const
        })),
        ...(detail.shareLogs ?? []).map((entry: any) => ({
          id: entry.id,
          action: "แชร์เอกสาร",
          detail: `${entry.channel}${entry.sharedTo ? ` · ${entry.sharedTo}` : ""}`,
          createdAt: entry.sharedAt.toISOString(),
          actor: entry.sharedBy?.name ?? undefined,
          category: "share" as const
        }))
      ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
      references: document.references
    };
  }

  const prisma = getPrisma() as any;
  if (prisma) {
    try {
      if (moduleKey === "inventory_receiving") {
        const receipt = await prisma.inventoryReceipt.findUnique({
          where: { id },
          include: { warehouse: true, lines: { include: { product: true }, orderBy: { createdAt: "asc" } } }
        });

        if (receipt) {
          const total = receipt.lines.reduce((sum: number, line: any) => sum + Number(line.unitCost) * Number(line.quantity), 0);
          return {
            id: receipt.id,
            documentNumber: receipt.receiptNumber,
            moduleKey,
            moduleLabel: getModuleDisplayKind(moduleKey),
            status: receipt.status,
            accountName: receipt.warehouse?.name ?? "คลังหลัก",
            issuedAt: receipt.receivedAt?.toISOString().slice(0, 10) ?? receipt.createdAt.toISOString().slice(0, 10),
            totalAmount: total,
            referenceCode: receipt.purchaseOrderId ?? receipt.documentId ?? undefined,
            notes: receipt.notes ?? undefined,
            internalNotes: undefined,
            subtotalAmount: total,
            vatAmount: 0,
            discountAmount: 0,
            totalAfterDiscountAmount: total,
            withholdingAmount: 0,
            lines: receipt.lines.map((line: any) => ({
              id: line.id,
              title: line.product?.name ?? "รายการสินค้า",
              description: line.product?.description ?? line.description ?? undefined,
              quantity: Number(line.quantity),
              unitLabel: line.product?.unitLabel ?? "หน่วย",
              unitPrice: Number(line.unitCost),
              lineTotal: Number(line.unitCost) * Number(line.quantity)
            })),
            payments: [],
            attachments: [],
            activities: [
              {
                id: receipt.id,
                action: "รับสินค้า",
                detail: "บันทึกรับเข้าสินค้าจากฐานข้อมูลจริง",
                createdAt: receipt.updatedAt.toISOString(),
                actor: undefined,
                category: "status"
              }
            ],
            references: []
          };
        }
      }

      if (moduleKey === "withholding_tax") {
        const document = await prisma.withholdingTaxDocument.findUnique({
          where: { id },
          include: { contact: true, lines: { orderBy: { createdAt: "asc" } } }
        });

        if (document) {
          return {
            id: document.id,
            documentNumber: document.documentNumber,
            moduleKey,
            moduleLabel: getModuleDisplayKind(moduleKey),
            status: document.status,
            accountName: document.contact?.displayName ?? "คู่ค้า",
            issuedAt: document.issuedAt.toISOString().slice(0, 10),
            totalAmount: Number(document.withholdingAmount ?? 0),
            notes: document.notes ?? undefined,
            subtotalAmount: Number(document.totalAmount ?? 0),
            vatAmount: 0,
            discountAmount: 0,
            totalAfterDiscountAmount: Number(document.totalAmount ?? 0),
            withholdingAmount: Number(document.withholdingAmount ?? 0),
            lines: document.lines.map((line: any) => ({
              id: line.id,
              title: line.description,
              description: undefined,
              quantity: 1,
              unitLabel: "รายการ",
              unitPrice: Number(line.amount),
              lineTotal: Number(line.amount)
            })),
            payments: [],
            attachments: [],
            activities: [
              {
                id: document.id,
                action: "ออกหนังสือ",
                detail: "บันทึกหนังสือหัก ณ ที่จ่ายจากฐานข้อมูลจริง",
                createdAt: document.updatedAt.toISOString(),
                actor: undefined,
                category: "status"
              }
            ],
            references: []
          };
        }
      }
    } catch {
      // Fall through to seeded fallback records.
    }
  }

  return (specialFallback[moduleKey] ?? []).find((document) => document.id === id) ?? null;
}

export function resolveDocumentStatusTone(status: string) {
  if (["APPROVED", "ISSUED", "SENT", "ACCEPTED", "PAID", "RECEIVED"].includes(status)) {
    return "success";
  }

  if (["AWAITING_APPROVAL", "OVERDUE"].includes(status)) {
    return "warning";
  }

  if (["REJECTED", "CANCELLED"].includes(status)) {
    return "danger";
  }

  return "neutral";
}

export function formatAccountingAmount(amount: number) {
  return formatThaiCurrency(amount);
}

export function formatAccountingDate(value: string | Date | null | undefined) {
  return formatThaiDate(value);
}

export function getDocumentKindLabel(kind: DocumentKind) {
  return thaiDocumentTypeLabels[kind] ?? kind;
}
