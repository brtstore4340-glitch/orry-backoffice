import { getPrisma } from "@/lib/db";
import { fallbackCompanyProfile, fallbackContacts, fallbackDashboard, fallbackDocumentDetail, fallbackDocumentList, fallbackProducts } from "@/lib/demo-data";
import { ActivityItem, CompanyProfileView, ContactSummary, DashboardSnapshot, DocumentDetail, DocumentKind, DocumentListItem, DocumentStatus, ProductSummary } from "@/lib/types";

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value ?? 0);
}

function sortByDate<T extends { createdAt?: string; issuedAt?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftDate = new Date(left.createdAt ?? left.issuedAt ?? 0).getTime();
    const rightDate = new Date(right.createdAt ?? right.issuedAt ?? 0).getTime();
    return rightDate - leftDate;
  });
}

function mapDocument(document: {
  id: string;
  documentNumber: string;
  kind: DocumentKind;
  status: DocumentStatus;
  issuedAt: Date;
  dueAt: Date | null;
  totalAmount: unknown;
  projectName: string | null;
  referenceCode: string | null;
  ownerId?: string | null;
  contact: { displayName: string } | null;
}): DocumentListItem {
  return {
    id: document.id,
    documentNumber: document.documentNumber,
    kind: document.kind,
    status: document.status,
    accountName: document.contact?.displayName ?? "Unassigned account",
    issuedAt: document.issuedAt.toISOString().slice(0, 10),
    dueAt: document.dueAt?.toISOString().slice(0, 10),
    totalAmount: toNumber(document.totalAmount),
    projectName: document.projectName ?? undefined,
    referenceCode: document.referenceCode ?? undefined
  };
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const prisma = getPrisma() as any;
  if (!prisma) return fallbackDashboard;

  const [documents, products, activities] = await Promise.all([
    prisma.businessDocument.findMany({ include: { contact: true }, orderBy: { issuedAt: "desc" }, take: 6 }),
    prisma.product.findMany({ orderBy: { stockOnHand: "asc" }, take: 6 }),
    prisma.documentActivity.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 6 })
  ]);

  const issuedTotal = documents.reduce((sum: number, document: any) => sum + toNumber(document.totalAmount), 0);
  const awaiting = documents.filter((document: any) => document.status === "AWAITING_APPROVAL").length;

  return {
    metrics: [
      { label: "Booked billing", value: new Intl.NumberFormat("en-US", { style: "currency", currency: "THB" }).format(issuedTotal), hint: "Issued and collectible" },
      { label: "Collections landed", value: new Intl.NumberFormat("en-US", { style: "currency", currency: "THB" }).format(0), hint: "Payment ledger total" },
      { label: "Approvals waiting", value: String(awaiting), hint: "Needs decision" },
      { label: "Tracked documents", value: String(documents.length), hint: "Across proposal to receipt" }
    ],
    urgentQueue: [
      { area: "Approvals", status: awaiting ? `${awaiting} waiting` : "Clear", note: "Review proposal and billing transitions." },
      { area: "Collections", status: "Operational", note: "Use billing and receipts pages to monitor settlement." },
      { area: "Inventory", status: "Monitor", note: "Reorder when stock approaches the threshold." }
    ],
    recentDocuments: documents.map(mapDocument),
    lowStock: products.map((product: any) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      kind: product.kind,
      stockOnHand: product.stockOnHand,
      reorderPoint: product.reorderPoint,
      unitPrice: toNumber(product.unitPrice),
      barcode: product.barcode ?? undefined
    })),
    recentActivity: activities.map((activity: any) => ({
      id: activity.id,
      action: activity.action,
      detail: activity.detail ?? "",
      createdAt: activity.createdAt.toISOString(),
      actor: activity.actor?.name ?? undefined
    }))
  };
}

export async function getContacts(): Promise<ContactSummary[]> {
  const prisma = getPrisma() as any;
  if (!prisma) return fallbackContacts;

  const contacts = await prisma.contact.findMany({
    include: { _count: { select: { documents: true } } },
    orderBy: { updatedAt: "desc" }
  });

  return contacts.map((contact: any) => ({
    id: contact.id,
    code: contact.code,
    type: contact.type,
    displayName: contact.displayName,
    contactPerson: contact.contactPerson ?? undefined,
    email: contact.email ?? undefined,
    phone: contact.mobile ?? contact.phone ?? undefined,
    taxId: contact.taxId ?? undefined,
    openDocuments: contact._count.documents
  }));
}

export async function getProducts(): Promise<ProductSummary[]> {
  const prisma = getPrisma() as any;
  if (!prisma) return fallbackProducts;

  const products = await prisma.product.findMany({ orderBy: [{ active: "desc" }, { stockOnHand: "asc" }] });
  return products.map((product: any) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    kind: product.kind,
    stockOnHand: product.stockOnHand,
    reorderPoint: product.reorderPoint,
    unitPrice: toNumber(product.unitPrice),
    barcode: product.barcode ?? undefined
  }));
}

export async function getDocuments(kind?: DocumentKind): Promise<DocumentListItem[]> {
  const prisma = getPrisma() as any;
  if (!prisma) return fallbackDocumentList(kind);

  const documents = await prisma.businessDocument.findMany({
    where: kind ? { kind } : undefined,
    include: { contact: true },
    orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }]
  });

  return documents.map(mapDocument);
}

export async function getDocumentById(id: string): Promise<DocumentDetail | null> {
  const prisma = getPrisma() as any;
  if (!prisma) return fallbackDocumentDetail(id);

  const document = await prisma.businessDocument.findUnique({
    where: { id },
    include: {
      contact: true,
      lines: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paidAt: "desc" } },
      activities: { include: { actor: true }, orderBy: { createdAt: "desc" } },
      outgoingReferences: { include: { targetDocument: true } },
      incomingReferences: { include: { sourceDocument: true } }
    }
  });

  if (!document) return null;

  const references = [
    ...document.outgoingReferences.map((reference: any) => ({
      label: reference.type === "CONVERTED_FROM" ? "Converted from" : "Related to",
      documentNumber: reference.targetDocument.documentNumber,
      documentId: reference.targetDocument.id
    })),
    ...document.incomingReferences.map((reference: any) => ({
      label: reference.type === "CONVERTED_FROM" ? "Converted into" : "Referenced by",
      documentNumber: reference.sourceDocument.documentNumber,
      documentId: reference.sourceDocument.id
    }))
  ];

  return {
    ...mapDocument(document),
    notes: document.notes ?? undefined,
    internalNotes: document.internalNotes ?? undefined,
    subtotalAmount: toNumber(document.subtotalAmount),
    vatAmount: toNumber(document.vatAmount),
    discountAmount: toNumber(document.discountAmount),
    totalAfterDiscountAmount: toNumber(document.totalAfterDiscountAmount),
    totalAmount: toNumber(document.totalAmount),
    withholdingAmount: toNumber(document.withholdingAmount),
    lines: document.lines.map((line: any) => ({
      id: line.id,
      title: line.title,
      description: line.description ?? undefined,
      quantity: toNumber(line.quantity),
      unitLabel: line.unitLabel,
      unitPrice: toNumber(line.unitPrice),
      lineTotal: toNumber(line.lineTotal)
    })),
    payments: document.payments.map((payment: any) => ({
      id: payment.id,
      amount: toNumber(payment.amount),
      method: payment.method,
      direction: payment.direction,
      paidAt: payment.paidAt.toISOString(),
      referenceNumber: payment.referenceNumber ?? undefined,
      note: payment.note ?? undefined
    })),
    activities: sortByDate<ActivityItem>(document.activities.map((activity: any) => ({
      id: activity.id,
      action: activity.action,
      detail: activity.detail ?? "",
      createdAt: activity.createdAt.toISOString(),
      actor: activity.actor?.name ?? undefined
    }))),
    references
  };
}

export async function getDocumentPolicyData(id: string) {
  const prisma = getPrisma() as any;
  if (!prisma) {
    const fallback = fallbackDocumentDetail(id);
    return fallback
      ? {
          id: fallback.id,
          kind: fallback.kind,
          status: fallback.status,
          ownerId: fallback.id === "doc-prp-13" ? demoOwnerId() : undefined,
          totalAmount: fallback.totalAmount,
          paymentTotal: fallback.payments.reduce((sum, payment) => sum + payment.amount, 0)
        }
      : null;
  }

  const document = await prisma.businessDocument.findUnique({
    where: { id },
    select: {
      id: true,
      kind: true,
      status: true,
      ownerId: true,
      totalAmount: true,
      payments: { select: { amount: true } }
    }
  });

  if (!document) {
    return null;
  }

  return {
    id: document.id,
    kind: document.kind,
    status: document.status,
    ownerId: document.ownerId ?? undefined,
    totalAmount: toNumber(document.totalAmount),
    paymentTotal: document.payments.reduce((sum: number, payment: any) => sum + toNumber(payment.amount), 0)
  };
}

function demoOwnerId() {
  return "demo-admin";
}

export async function getCompanyProfile(): Promise<CompanyProfileView> {
  const prisma = getPrisma() as any;
  if (!prisma) return fallbackCompanyProfile;

  const company = await prisma.companyProfile.findFirst({ include: { bankAccounts: { orderBy: { isPrimary: "desc" } } } });
  if (!company) return fallbackCompanyProfile;

  return {
    displayName: company.displayName,
    legalName: company.legalName,
    taxId: company.taxId ?? undefined,
    branchName: company.branchName ?? undefined,
    branchCode: company.branchCode ?? undefined,
    phone: company.phone ?? undefined,
    email: company.email ?? undefined,
    website: company.website ?? undefined,
    address: company.address ?? undefined,
    bankAccounts: company.bankAccounts.map((account: any) => ({
      bankName: account.bankName,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      branch: account.branch ?? undefined,
      isPrimary: account.isPrimary
    }))
  };
}

export async function createContact(input: { code: string; displayName: string; contactPerson?: string; email?: string }) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  return prisma.contact.create({
    data: {
      code: input.code,
      type: "CUSTOMER",
      displayName: input.displayName,
      contactPerson: input.contactPerson,
      email: input.email
    }
  });
}

export async function updateDocumentStatus(input: { id: string; status: DocumentStatus; actorId?: string }) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const updated = await prisma.businessDocument.update({ where: { id: input.id }, data: { status: input.status } });
  await prisma.documentActivity.create({
    data: {
      documentId: updated.id,
      actorId: input.actorId,
      action: "status-updated",
      detail: `Status changed to ${input.status.replaceAll("_", " ").toLowerCase()}.`
    }
  });
  return updated;
}

export async function createDraftDocument(input: { kind: DocumentKind; note?: string; actorId?: string }) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const [contact, owner] = await Promise.all([
    prisma.contact.findFirst({ orderBy: { createdAt: "asc" } }),
    input.actorId ? prisma.user.findUnique({ where: { id: input.actorId } }) : prisma.user.findFirst({ orderBy: { createdAt: "asc" } })
  ]);

  const prefixMap: Record<DocumentKind, string> = {
    PROPOSAL: "PRP",
    SALES_ORDER: "SO",
    BILLING_RECORD: "BIL",
    RECEIPT: "RCT",
    PURCHASE_ORDER: "PO",
    EXPENSE: "EXP"
  };

  const counter = await prisma.documentCounter.upsert({
    where: { kind: input.kind },
    update: { lastNumber: { increment: 1 } },
    create: { kind: input.kind, prefix: prefixMap[input.kind], lastNumber: 1 }
  });

  const number = `${counter.prefix}-${new Date().getFullYear()}-${String(counter.lastNumber).padStart(4, "0")}`;

  return prisma.businessDocument.create({
    data: {
      documentNumber: number,
      kind: input.kind,
      status: "DRAFT",
      contactId: contact?.id,
      ownerId: owner?.id,
      issuedAt: new Date(),
      dueAt: new Date(),
      paymentTermLabel: "Created from ORRY quick desk",
      salesOwnerName: owner?.name,
      notes: input.note,
      subtotalAmount: 0,
      totalAfterDiscountAmount: 0,
      totalAmount: 0,
      lines: {
        create: {
          title: "Placeholder scope",
          description: "Add line items after initial draft creation.",
          quantity: 1,
          unitLabel: "set",
          unitPrice: 0,
          lineTotal: 0,
          sortOrder: 0
        }
      }
    }
  });
}
