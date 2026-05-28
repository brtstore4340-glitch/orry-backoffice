import { getPrisma } from "@/lib/db";
import { fallbackBankAccounts, fallbackCompanyBranches, fallbackCompanyProfile, fallbackCompanyTaxProfile, fallbackContacts, fallbackDashboard, fallbackDocumentDetail, fallbackDocumentList, fallbackProducts } from "@/lib/demo-data";
import { thaiCanonicalTerms } from "@/lib/thai-terminology";
import { ActivityItem, BankAccountDetail, BankAccountSummary, CompanyBranchSummary, CompanyProfileView, CompanyTaxProfileView, ContactDetail, ContactSummary, DashboardSnapshot, DocumentDetail, DocumentKind, DocumentListItem, DocumentModuleKey, DocumentStatus, PaymentMethod, PersistedDocumentModuleKey, ProductDetail, ProductSummary } from "@/lib/types";

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

function moduleCodeFromKey(moduleKey: PersistedDocumentModuleKey) {
  switch (moduleKey) {
    case "quotation":
      return "QUOTATION";
    case "billing_note":
      return "BILLING_NOTE";
    case "cash_invoice":
      return "CASH_INVOICE";
    case "tax_invoice":
      return "TAX_INVOICE";
    case "receipt":
      return "RECEIPT";
    case "expense":
      return "EXPENSE";
    case "purchase_order":
      return "PURCHASE_ORDER";
  }
}

function keyFromModuleCode(moduleCode: string | null | undefined, kind: DocumentKind): PersistedDocumentModuleKey {
  switch (moduleCode) {
    case "QUOTATION":
      return "quotation";
    case "BILLING_NOTE":
      return "billing_note";
    case "CASH_INVOICE":
      return "cash_invoice";
    case "TAX_INVOICE":
      return "tax_invoice";
    case "RECEIPT":
      return "receipt";
    case "EXPENSE":
      return "expense";
    case "PURCHASE_ORDER":
      return "purchase_order";
    default:
      switch (kind) {
        case "PROPOSAL":
          return "quotation";
        case "RECEIPT":
          return "receipt";
        case "EXPENSE":
          return "expense";
        case "PURCHASE_ORDER":
          return "purchase_order";
        default:
          return "billing_note";
      }
  }
}

function outboundPaymentKind(kind: DocumentKind) {
  return kind === "EXPENSE" || kind === "PURCHASE_ORDER";
}

function mapDocument(document: {
  id: string;
  documentNumber: string;
  kind: DocumentKind;
  moduleCode?: string | null;
  status: DocumentStatus;
  issuedAt: Date;
  dueAt: Date | null;
  totalAmount: unknown;
  projectName: string | null;
  referenceCode: string | null;
  ownerId?: string | null;
  branch?: { name: string } | null;
  contact: { displayName: string } | null;
}): DocumentListItem {
  return {
    id: document.id,
    documentNumber: document.documentNumber,
    kind: document.kind,
    moduleKey: keyFromModuleCode(document.moduleCode, document.kind),
    status: document.status,
    accountName: document.contact?.displayName ?? "ยังไม่ได้เลือกคู่ค้า",
    issuedAt: document.issuedAt.toISOString().slice(0, 10),
    dueAt: document.dueAt?.toISOString().slice(0, 10),
    totalAmount: toNumber(document.totalAmount),
    projectName: document.projectName ?? undefined,
    referenceCode: document.referenceCode ?? undefined,
    branchName: document.branch?.name ?? undefined
  };
}

function mapBankAccount(account: {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string | null;
  swiftCode?: string | null;
  isPrimary: boolean;
  companyProfile?: { displayName: string } | null;
}): BankAccountSummary {
  return {
    id: account.id,
    bankName: account.bankName,
    accountName: account.accountName,
    accountNumber: account.accountNumber,
    branch: account.branch ?? undefined,
    swiftCode: account.swiftCode ?? undefined,
    isPrimary: account.isPrimary
  };
}

function mapContact(contact: any): ContactDetail {
  return {
    id: contact.id,
    code: contact.code,
    type: contact.type,
    displayName: contact.displayName,
    contactPerson: contact.contactPerson ?? undefined,
    email: contact.email ?? undefined,
    phone: contact.mobile ?? contact.phone ?? undefined,
    taxId: contact.taxId ?? undefined,
    openDocuments: contact._count?.documents ?? 0,
    legalName: contact.legalName ?? undefined,
    mobile: contact.mobile ?? undefined,
    address: contact.address ?? undefined,
    zipCode: contact.zipCode ?? undefined,
    notes: contact.notes ?? undefined
  };
}

function mapProduct(product: any): ProductDetail {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    kind: product.kind,
    stockOnHand: product.stockOnHand,
    reorderPoint: product.reorderPoint,
    unitPrice: toNumber(product.unitPrice),
    barcode: product.barcode ?? undefined,
    description: product.description ?? undefined,
    cost: toNumber(product.cost),
    active: product.active
  };
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  try {
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
  } catch {
    return fallbackDashboard;
  }
}

export async function getContacts(): Promise<ContactSummary[]> {
  try {
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
  } catch {
    return fallbackContacts;
  }
}

export async function getProducts(): Promise<ProductSummary[]> {
  try {
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
  } catch {
    return fallbackProducts;
  }
}

export async function getDocuments(kind?: DocumentKind, moduleKey?: PersistedDocumentModuleKey): Promise<DocumentListItem[]> {
  try {
    const prisma = getPrisma() as any;
    if (!prisma) {
      return fallbackDocumentList(kind).filter((document) => !moduleKey || document.moduleKey === moduleKey);
    }

    const documents = await prisma.businessDocument.findMany({
      where: {
        ...(kind ? { kind } : {}),
        ...(moduleKey ? { moduleCode: moduleCodeFromKey(moduleKey) } : {})
      },
      include: { contact: true, branch: true },
      orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }]
    });

    return documents.map(mapDocument);
  } catch {
    return fallbackDocumentList(kind).filter((document) => !moduleKey || document.moduleKey === moduleKey);
  }
}

export async function getDocumentById(id: string): Promise<DocumentDetail | null> {
  try {
    const prisma = getPrisma() as any;
    if (!prisma) return fallbackDocumentDetail(id);

    const document = await prisma.businessDocument.findUnique({
      where: { id },
      include: {
        contact: true,
        branch: true,
        lines: { orderBy: { sortOrder: "asc" } },
        payments: { orderBy: { paidAt: "desc" } },
        paymentsPaid: { orderBy: { paidAt: "desc" } },
        attachments: { orderBy: { createdAt: "desc" } },
        activities: { include: { actor: true }, orderBy: { createdAt: "desc" } },
        statusHistory: { include: { changedBy: true }, orderBy: { createdAt: "desc" } },
        emailLogs: { orderBy: { createdAt: "desc" } },
        shareLogs: { include: { sharedBy: true }, orderBy: { sharedAt: "desc" } },
        outgoingReferences: { include: { targetDocument: true } },
        incomingReferences: { include: { sourceDocument: true } }
      }
    });

    if (!document) return null;

    const references = [
      ...document.outgoingReferences.map((reference: any) => ({
        label: reference.type === "CONVERTED_FROM" ? "แปลงมาจาก" : "เกี่ยวข้องกับ",
        documentNumber: reference.targetDocument.documentNumber,
        documentId: reference.targetDocument.id
      })),
      ...document.incomingReferences.map((reference: any) => ({
        label: reference.type === "CONVERTED_FROM" ? "แปลงเป็น" : "อ้างอิงโดย",
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
      })).concat(document.paymentsPaid.map((payment: any) => ({
        id: payment.id,
        amount: toNumber(payment.amount),
        method: payment.method,
        direction: "OUTBOUND",
        paidAt: payment.paidAt.toISOString(),
        referenceNumber: payment.referenceNumber ?? undefined,
        note: payment.note ?? undefined
      }))),
      activities: sortByDate<ActivityItem>(document.activities.map((activity: any) => ({
        id: activity.id,
        action: activity.action,
        detail: activity.detail ?? "",
        createdAt: activity.createdAt.toISOString(),
        actor: activity.actor?.name ?? undefined
      }))),
      attachments: document.attachments,
      statusHistory: document.statusHistory,
      emailLogs: document.emailLogs,
      shareLogs: document.shareLogs,
      references
    };
  } catch {
    return fallbackDocumentDetail(id);
  }
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
      payments: { select: { amount: true } },
      paymentsPaid: { select: { amount: true } }
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
    paymentTotal:
      document.payments.reduce((sum: number, payment: any) => sum + toNumber(payment.amount), 0) +
      document.paymentsPaid.reduce((sum: number, payment: any) => sum + toNumber(payment.amount), 0)
  };
}

function demoOwnerId() {
  return "demo-admin";
}

async function getCompanyWithRelations(prisma: any) {
  return prisma.companyProfile.findFirst({
    include: {
      bankAccounts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      branches: { orderBy: [{ isHeadOffice: "desc" }, { createdAt: "asc" }, { code: "asc" }] },
      taxProfiles: { include: { branch: true }, orderBy: { createdAt: "asc" } }
    }
  });
}

export async function getCompanyProfile(): Promise<CompanyProfileView> {
  try {
    const prisma = getPrisma() as any;
    if (!prisma) return fallbackCompanyProfile;

    const company = await getCompanyWithRelations(prisma);
    if (!company) return fallbackCompanyProfile;

    const defaultBranch = company.branches[0];

    return {
      id: company.id,
      displayName: company.displayName,
      legalName: company.legalName,
      taxId: company.taxId ?? undefined,
      phone: company.phone ?? undefined,
      email: company.email ?? undefined,
      website: company.website ?? undefined,
      address: company.address ?? undefined,
      defaultBranchId: defaultBranch?.id,
      defaultBranchName: defaultBranch?.name ?? undefined,
      defaultBranchCode: defaultBranch?.taxBranchCode ?? defaultBranch?.code ?? undefined,
      bankAccounts: company.bankAccounts.map((account: any) => ({
        id: account.id,
        bankName: account.bankName,
        accountName: account.accountName,
        accountNumber: account.accountNumber,
        branch: account.branch ?? undefined,
        isPrimary: account.isPrimary
      })),
      branches: company.branches.map((branch: any) => ({
        id: branch.id,
        branchCode: branch.taxBranchCode ?? branch.code,
        branchName: branch.name,
        isHeadOffice: branch.isHeadOffice,
        active: branch.active
      }))
    };
  } catch {
    return fallbackCompanyProfile;
  }
}

export async function getCompanyTaxProfile(): Promise<CompanyTaxProfileView> {
  try {
    const prisma = getPrisma() as any;
    if (!prisma) return fallbackCompanyTaxProfile;

    const company = await getCompanyWithRelations(prisma);
    if (!company) return fallbackCompanyTaxProfile;

    const taxProfile = company.taxProfiles[0];
    const branch = taxProfile?.branch ?? company.branches[0];

    return {
      taxId: taxProfile?.taxId ?? company.taxId ?? undefined,
      vatRegistered: taxProfile?.vatRegistered ?? company.vatRegistered,
      branchId: branch?.id,
      branchName: branch?.name ?? undefined,
      branchCode: branch?.taxBranchCode ?? branch?.code ?? undefined,
      withholdingEnabled: true,
      taxOffice: "สรรพากรพื้นที่กรุงเทพมหานคร 1",
      revenueCode: company.defaultCurrency === "THB" ? "100000" : undefined
    };
  } catch {
    return fallbackCompanyTaxProfile;
  }
}

export async function updateCompanyProfile(input: {
  displayName: string;
  legalName: string;
  taxId?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  logoPath?: string;
}) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const company = await prisma.companyProfile.findFirst();
  if (!company) {
    return prisma.companyProfile.create({
      data: {
        displayName: input.displayName,
        legalName: input.legalName,
        taxId: input.taxId,
        phone: input.phone,
        email: input.email,
        website: input.website,
        address: input.address,
        logoPath: input.logoPath
      }
    });
  }

  return prisma.companyProfile.update({
    where: { id: company.id },
    data: {
      displayName: input.displayName,
      legalName: input.legalName,
      taxId: input.taxId,
      phone: input.phone,
      email: input.email,
      website: input.website,
      address: input.address,
      logoPath: input.logoPath
    }
  });
}

export async function updateCompanyTaxProfile(input: {
  taxId?: string;
  vatRegistered: boolean;
  branchId?: string;
  withholdingEnabled: boolean;
  taxOffice?: string;
  revenueCode?: string;
}) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const company = await getCompanyWithRelations(prisma);
  if (!company) {
    return null;
  }

  const branchId = input.branchId ?? company.branches[0]?.id;
  const branch = branchId ? company.branches.find((item: any) => item.id === branchId) : undefined;
  const profile = company.taxProfiles[0];

  if (!profile) {
    return prisma.companyTaxProfile.create({
      data: {
        companyProfileId: company.id,
        branchId,
        taxId: input.taxId,
        vatRegistered: input.vatRegistered,
        branchCode: branch?.taxBranchCode ?? branch?.code
      }
    });
  }

  return prisma.companyTaxProfile.update({
    where: { id: profile.id },
    data: {
      branchId,
      taxId: input.taxId,
      vatRegistered: input.vatRegistered,
      branchCode: branch?.taxBranchCode ?? branch?.code
    }
  });
}

export async function listCompanyBranches(): Promise<CompanyBranchSummary[]> {
  try {
    const prisma = getPrisma() as any;
    if (!prisma) return fallbackCompanyBranches;

    const company = await prisma.companyProfile.findFirst({
      include: { branches: { orderBy: [{ isHeadOffice: "desc" }, { createdAt: "asc" }, { code: "asc" }] } }
    });
    if (!company) return fallbackCompanyBranches;

    if (!company.branches.length) return fallbackCompanyBranches;

    return company.branches.map((branch: any) => ({
      id: branch.id,
      branchCode: branch.taxBranchCode ?? branch.code,
      branchName: branch.name,
      isHeadOffice: branch.isHeadOffice,
      active: branch.active
    }));
  } catch {
    return fallbackCompanyBranches;
  }
}

export async function getCompanyBranchById(id: string): Promise<CompanyBranchSummary | null> {
  const prisma = getPrisma() as any;
  if (!prisma) {
    return fallbackCompanyBranches.find((branch) => branch.id === id) ?? null;
  }

  const branch = await prisma.companyBranch.findUnique({ where: { id } });
  if (!branch) return null;

  return {
    id: branch.id,
    branchCode: branch.taxBranchCode ?? branch.code,
    branchName: branch.name,
    isHeadOffice: branch.isHeadOffice,
    active: branch.active
  };
}

export async function createCompanyBranch(input: {
  companyProfileId?: string;
  branchCode: string;
  branchName: string;
  isHeadOffice?: boolean;
  active?: boolean;
}) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const companyProfileId = input.companyProfileId ?? (await prisma.companyProfile.findFirst())?.id;
  if (!companyProfileId) return null;

  if (input.isHeadOffice) {
    await prisma.companyBranch.updateMany({
      where: { companyProfileId },
      data: { isHeadOffice: false }
    });
  }

  return prisma.companyBranch.create({
    data: {
      companyProfileId,
      code: input.branchCode,
      name: input.branchName,
      taxBranchCode: input.branchCode,
      isHeadOffice: input.isHeadOffice ?? false,
      active: input.active ?? true
    }
  });
}

export async function updateCompanyBranch(input: {
  id: string;
  branchCode: string;
  branchName: string;
  isHeadOffice?: boolean;
  active?: boolean;
}) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const current = await prisma.companyBranch.findUnique({ where: { id: input.id } });
  if (!current) return null;

  if (input.isHeadOffice) {
    await prisma.companyBranch.updateMany({
      where: { companyProfileId: current.companyProfileId },
      data: { isHeadOffice: false }
    });
  }

  return prisma.companyBranch.update({
    where: { id: input.id },
    data: {
      code: input.branchCode,
      taxBranchCode: input.branchCode,
      name: input.branchName,
      isHeadOffice: input.isHeadOffice,
      active: input.active
    }
  });
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

export async function updateContact(input: {
  id: string;
  code: string;
  displayName: string;
  type: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  notes?: string;
}) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  return prisma.contact.update({
    where: { id: input.id },
    data: {
      code: input.code,
      displayName: input.displayName,
      type: input.type,
      contactPerson: input.contactPerson,
      email: input.email,
      phone: input.phone,
      mobile: input.mobile,
      address: input.address,
      notes: input.notes
    }
  });
}

export async function getContactById(id: string): Promise<ContactDetail | null> {
  const prisma = getPrisma() as any;
  if (!prisma) {
    return fallbackContacts.find((contact) => contact.id === id) ?? null;
  }

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: { _count: { select: { documents: true } } }
  });

  if (!contact) return null;
  return mapContact(contact);
}

export async function getProductById(id: string): Promise<ProductDetail | null> {
  const prisma = getPrisma() as any;
  if (!prisma) {
    return fallbackProducts.find((product) => product.id === id)
      ? {
          ...fallbackProducts.find((product) => product.id === id)!,
          description: undefined,
          cost: fallbackProducts.find((product) => product.id === id)!.unitPrice,
          active: true
        }
      : null;
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return null;
  return mapProduct(product);
}

export async function createProduct(input: {
  sku: string;
  name: string;
  kind: string;
  unitLabel?: string;
  unitPrice: number;
  cost?: number;
  stockOnHand?: number;
  reorderPoint?: number;
  barcode?: string;
  description?: string;
}) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  return prisma.product.create({
    data: {
      sku: input.sku,
      name: input.name,
      kind: input.kind,
      unitLabel: input.unitLabel ?? "ชิ้น",
      unitPrice: input.unitPrice,
      cost: input.cost ?? input.unitPrice,
      stockOnHand: input.stockOnHand ?? 0,
      reorderPoint: input.reorderPoint ?? 0,
      barcode: input.barcode,
      description: input.description
    }
  });
}

export async function updateProduct(input: {
  id: string;
  sku: string;
  name: string;
  kind: string;
  unitLabel?: string;
  unitPrice: number;
  cost?: number;
  stockOnHand?: number;
  reorderPoint?: number;
  barcode?: string;
  description?: string;
  active?: boolean;
}) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  return prisma.product.update({
    where: { id: input.id },
    data: {
      sku: input.sku,
      name: input.name,
      kind: input.kind,
      unitLabel: input.unitLabel,
      unitPrice: input.unitPrice,
      cost: input.cost,
      stockOnHand: input.stockOnHand,
      reorderPoint: input.reorderPoint,
      barcode: input.barcode,
      description: input.description,
      active: input.active
    }
  });
}

export async function getBankAccounts(): Promise<BankAccountSummary[]> {
  const prisma = getPrisma() as any;
  if (!prisma) return fallbackBankAccounts;

  const company = await prisma.companyProfile.findFirst({
    include: { bankAccounts: { orderBy: { isPrimary: "desc" } } }
  });

  if (!company) return fallbackBankAccounts;

  return company.bankAccounts.map((account: any) => mapBankAccount({ ...account, companyProfile: company }));
}

export async function getBankAccountById(id: string): Promise<BankAccountDetail | null> {
  const prisma = getPrisma() as any;
  if (!prisma) {
    const account = fallbackBankAccounts.find((item) => item.id === id);
    return account ? { ...account, companyDisplayName: fallbackCompanyProfile.displayName, active: true } : null;
  }

  const account = await prisma.bankAccount.findUnique({
    where: { id },
    include: { companyProfile: true }
  });

  if (!account) return null;

  return {
    ...mapBankAccount(account),
    companyDisplayName: account.companyProfile?.displayName ?? undefined,
    active: true
  };
}

export async function createBankAccount(input: {
  companyProfileId?: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  swiftCode?: string;
  isPrimary?: boolean;
}) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const companyProfileId = input.companyProfileId ?? (await prisma.companyProfile.findFirst())?.id;
  if (!companyProfileId) {
    return null;
  }

  return prisma.bankAccount.create({
    data: {
      companyProfile: { connect: { id: companyProfileId } },
      bankName: input.bankName,
      accountName: input.accountName,
      accountNumber: input.accountNumber,
      branch: input.branch,
      swiftCode: input.swiftCode,
      isPrimary: input.isPrimary ?? false
    }
  });
}

export async function updateBankAccount(input: {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  swiftCode?: string;
  isPrimary?: boolean;
}) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  return prisma.bankAccount.update({
    where: { id: input.id },
    data: {
      bankName: input.bankName,
      accountName: input.accountName,
      accountNumber: input.accountNumber,
      branch: input.branch,
      swiftCode: input.swiftCode,
      isPrimary: input.isPrimary
    }
  });
}

async function getDefaultBranch(prisma: any, companyProfileId?: string) {
  const branch = await prisma.companyBranch.findFirst({
    where: companyProfileId ? { companyProfileId } : undefined,
    orderBy: [{ isHeadOffice: "desc" }, { createdAt: "asc" }, { code: "asc" }]
  });
  return branch ?? null;
}

async function getDefaultWarehouse(prisma: any) {
  return prisma.warehouse.findFirst({ orderBy: { createdAt: "asc" } });
}

function getDocumentPrefix(moduleKey: PersistedDocumentModuleKey) {
  switch (moduleKey) {
    case "quotation":
      return "QTN";
    case "billing_note":
      return "BN";
    case "cash_invoice":
      return "CIV";
    case "tax_invoice":
      return "TIV";
    case "receipt":
      return "RCT";
    case "expense":
      return "EXP";
    case "purchase_order":
      return "PO";
  }
}

export async function updateDocumentStatus(input: { id: string; status: DocumentStatus; actorId?: string }) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const current = await prisma.businessDocument.findUnique({
    where: { id: input.id },
    select: { status: true },
  });
  if (!current) return null;

  const updated = await prisma.businessDocument.update({ where: { id: input.id }, data: { status: input.status } });
  await prisma.documentStatusHistory.create({
    data: {
      documentId: updated.id,
      fromStatus: current.status,
      toStatus: input.status,
      changedById: input.actorId,
      note: undefined,
    }
  });
  await prisma.documentActivity.create({
    data: {
      documentId: updated.id,
      actorId: input.actorId,
      action: "status-updated",
      detail: `เปลี่ยนสถานะเป็น ${input.status.replaceAll("_", " ").toLowerCase()}`
    }
  });
  return updated;
}

async function recalculateDocumentTotals(prisma: any, documentId: string) {
  const document = await prisma.businessDocument.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      discountAmount: true,
      vatEnabled: true,
      taxInclusive: true,
      withholdingEnabled: true,
      withholdingPercent: true,
      deductionAmount: true,
      lines: {
        select: {
          lineTotal: true,
        },
      },
    },
  });

  if (!document) return null;

  const subtotalAmount = document.lines.reduce((sum: number, line: any) => sum + toNumber(line.lineTotal), 0);
  const discountAmount = toNumber(document.discountAmount);
  const totalAfterDiscountAmount = Math.max(subtotalAmount - discountAmount, 0);
  const vatBase = document.taxInclusive ? totalAfterDiscountAmount / 1.07 : totalAfterDiscountAmount;
  const vatAmount = document.vatEnabled ? Number((vatBase * 0.07).toFixed(2)) : 0;
  const withholdingAmount = document.withholdingEnabled
    ? Number(((totalAfterDiscountAmount * toNumber(document.withholdingPercent)) / 100).toFixed(2))
    : 0;
  const deductionAmount = toNumber(document.deductionAmount);
  const totalAmount = Math.max(totalAfterDiscountAmount + vatAmount - withholdingAmount - deductionAmount, 0);

  return prisma.businessDocument.update({
    where: { id: documentId },
    data: {
      subtotalAmount,
      totalAfterDiscountAmount,
      vatAmount,
      withholdingAmount,
      totalAmount,
    },
  });
}

export async function updateDocumentContact(input: { documentId: string; contactId: string; actorId?: string }) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const updated = await prisma.businessDocument.update({
    where: { id: input.documentId },
    data: { contactId: input.contactId },
  });

  await prisma.documentActivity.create({
    data: {
      documentId: input.documentId,
      actorId: input.actorId,
      action: "contact-updated",
      detail: "อัปเดตคู่ค้าในเอกสาร",
    },
  });

  return updated;
}

export async function addDocumentLine(input: {
  documentId: string;
  productId: string;
  quantity: number;
  unitPrice?: number;
  description?: string;
  actorId?: string;
}) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const [document, product, lastLine] = await Promise.all([
    prisma.businessDocument.findUnique({ where: { id: input.documentId }, select: { id: true } }),
    prisma.product.findUnique({ where: { id: input.productId } }),
    prisma.documentLine.findFirst({
      where: { documentId: input.documentId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    }),
  ]);

  if (!document || !product) return null;

  const quantity = input.quantity > 0 ? input.quantity : 1;
  const unitPrice = input.unitPrice ?? toNumber(product.unitPrice);
  const lineTotal = Number((quantity * unitPrice).toFixed(2));

  const line = await prisma.documentLine.create({
    data: {
      documentId: input.documentId,
      productId: product.id,
      title: product.name,
      description: input.description || product.description || undefined,
      unitLabel: product.unitLabel,
      quantity,
      unitPrice,
      lineTotal,
      sortOrder: (lastLine?.sortOrder ?? 0) + 1,
    },
  });

  await recalculateDocumentTotals(prisma, input.documentId);
  await prisma.documentActivity.create({
    data: {
      documentId: input.documentId,
      actorId: input.actorId,
      action: "line-added",
      detail: `เพิ่มรายการ ${product.name}`,
    },
  });

  return line;
}

export async function updateDocumentLine(input: {
  documentId: string;
  lineId: string;
  quantity: number;
  unitPrice: number;
  description?: string;
  actorId?: string;
}) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const current = await prisma.documentLine.findUnique({
    where: { id: input.lineId },
    select: { id: true, documentId: true, title: true },
  });

  if (!current || current.documentId !== input.documentId) return null;

  const quantity = input.quantity > 0 ? input.quantity : 1;
  const unitPrice = input.unitPrice >= 0 ? input.unitPrice : 0;
  const lineTotal = Number((quantity * unitPrice).toFixed(2));

  const line = await prisma.documentLine.update({
    where: { id: input.lineId },
    data: {
      quantity,
      unitPrice,
      lineTotal,
      description: input.description || undefined,
    },
  });

  await recalculateDocumentTotals(prisma, input.documentId);
  await prisma.documentActivity.create({
    data: {
      documentId: input.documentId,
      actorId: input.actorId,
      action: "line-updated",
      detail: `อัปเดตรายการ ${current.title}`,
    },
  });

  return line;
}

export async function createDraftDocument(input: {
  kind: DocumentKind;
  moduleKey: PersistedDocumentModuleKey;
  note?: string;
  actorId?: string;
  branchId?: string;
}) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const [contact, owner, companyProfile] = await Promise.all([
    prisma.contact.findFirst({ orderBy: { createdAt: "asc" } }),
    input.actorId ? prisma.user.findUnique({ where: { id: input.actorId } }) : prisma.user.findFirst({ orderBy: { createdAt: "asc" } }),
    prisma.companyProfile.findFirst()
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
      paymentTermLabel: "สร้างจากศูนย์ควบคุม ORRY",
      salesOwnerName: owner?.name,
      notes: input.note,
      moduleCode: moduleCodeFromKey(input.moduleKey),
      subtotalAmount: 0,
      totalAfterDiscountAmount: 0,
      totalAmount: 0,
      companyProfileId: companyProfile?.id,
      branchId: input.branchId ?? (await getDefaultBranch(prisma, companyProfile?.id))?.id ?? undefined,
      lines: {
        create: {
          title: "ฉบับร่างเริ่มต้น",
          description: "เพิ่มรายการภายหลังจากสร้างฉบับร่างแล้ว",
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

export async function createInventoryReceivingDraft(input: { note?: string; branchId?: string }) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const warehouse = await getDefaultWarehouse(prisma);
  if (!warehouse) {
    return null;
  }

  const receiptNumber = `RCV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  return prisma.inventoryReceipt.create({
    data: {
      warehouseId: warehouse.id,
      receiptNumber,
      status: "DRAFT",
      notes: input.note
    }
  });
}

export async function updateInventoryReceivingStatus(input: { id: string; status: DocumentStatus }) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  return prisma.inventoryReceipt.update({
    where: { id: input.id },
    data: {
      status: input.status,
      receivedAt: input.status === "RECEIVED" ? new Date() : undefined
    }
  });
}

export async function createWithholdingTaxDraft(input: { note?: string }) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const contact = await prisma.contact.findFirst({ orderBy: { createdAt: "asc" } });
  const documentNumber = `WHT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

  return prisma.withholdingTaxDocument.create({
    data: {
      documentNumber,
      status: "DRAFT",
      contactId: contact?.id,
      issuedAt: new Date(),
      totalAmount: 0,
      withholdingRate: 3,
      withholdingAmount: 0,
      notes: input.note
    }
  });
}

export async function updateWithholdingTaxStatus(input: { id: string; status: DocumentStatus }) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  return prisma.withholdingTaxDocument.update({
    where: { id: input.id },
    data: { status: input.status }
  });
}

export async function getDocumentDispatchInfo(id: string) {
  const prisma = getPrisma() as any;
  if (!prisma) {
    const fallback = fallbackDocumentDetail(id);
    return fallback
      ? {
          documentNumber: fallback.documentNumber,
          title: fallback.moduleKey ?? fallback.kind
        }
      : null;
  }

  const document = await prisma.businessDocument.findUnique({
    where: { id },
    select: { documentNumber: true, moduleCode: true, kind: true }
  });

  if (!document) return null;

  return {
    documentNumber: document.documentNumber,
    title: getDocumentPrefix(keyFromModuleCode(document.moduleCode, document.kind))
  };
}

export async function addDocumentAttachment(input: {
  documentId: string;
  uploadedById?: string;
  fileName: string;
  storagePath: string;
  mimeType?: string;
  fileSize?: number;
}) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const attachment = await prisma.documentAttachment.create({
    data: {
      documentId: input.documentId,
      uploadedById: input.uploadedById,
      fileName: input.fileName,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      fileSize: input.fileSize
    }
  });

  await prisma.documentActivity.create({
    data: {
      documentId: input.documentId,
      actorId: input.uploadedById,
      action: "attachment-added",
      detail: `แนบไฟล์ ${input.fileName}`
    }
  });

  return attachment;
}

export async function addDocumentShare(input: {
  documentId: string;
  sharedById?: string;
  shareToken: string;
  channel: string;
  sharedTo?: string;
  message?: string;
}) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  await prisma.businessDocument.update({
    where: { id: input.documentId },
    data: {
      shareToken: input.shareToken,
      sharedAt: new Date()
    }
  });

  const shareLog = await prisma.documentShareLog.create({
    data: {
      documentId: input.documentId,
      sharedById: input.sharedById,
      shareToken: input.shareToken,
      channel: input.channel,
      sharedTo: input.sharedTo,
      message: input.message
    }
  });

  await prisma.documentActivity.create({
    data: {
      documentId: input.documentId,
      actorId: input.sharedById,
      action: "document-shared",
      detail: `แชร์เอกสารผ่าน ${input.channel}${input.sharedTo ? ` ไปยัง ${input.sharedTo}` : ""}`
    }
  });

  return shareLog;
}

export async function addDocumentEmailLog(input: {
  documentId: string;
  sentTo: string;
  subject?: string;
  bodyPreview?: string;
  providerMessageId?: string;
  status: string;
  sentAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
}) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const emailLog = await prisma.documentEmailLog.create({
    data: {
      documentId: input.documentId,
      sentTo: input.sentTo,
      subject: input.subject,
      bodyPreview: input.bodyPreview,
      providerMessageId: input.providerMessageId,
      status: input.status,
      sentAt: input.sentAt,
      failedAt: input.failedAt,
      errorMessage: input.errorMessage
    }
  });

  await prisma.documentActivity.create({
    data: {
      documentId: input.documentId,
      action: "email-recorded",
      detail: `บันทึกการส่งอีเมลไปยัง ${input.sentTo} (${input.status})`
    }
  });

  return emailLog;
}

export async function addDocumentPayment(input: {
  documentId: string;
  actorId?: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  note?: string;
  moduleKey: DocumentModuleKey;
}) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const document = await prisma.businessDocument.findUnique({
    where: { id: input.documentId },
    select: { kind: true }
  });
  if (!document) return null;

  if (outboundPaymentKind(document.kind)) {
    const payment = await prisma.paymentPaid.create({
      data: {
        documentId: input.documentId,
        actorId: input.actorId,
        method: input.method,
        amount: input.amount,
        paidAt: new Date(),
        referenceNumber: input.referenceNumber,
        note: input.note
      }
    });

    await prisma.documentActivity.create({
      data: {
        documentId: input.documentId,
        actorId: input.actorId,
        action: "payment-recorded",
        detail: `บันทึกจ่าย ${Number(input.amount).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`
      }
    });

    return payment;
  }

  const payment = await prisma.paymentEntry.create({
    data: {
      documentId: input.documentId,
      actorId: input.actorId,
      direction: "INBOUND",
      method: input.method,
      amount: input.amount,
      paidAt: new Date(),
      referenceNumber: input.referenceNumber,
      note: input.note
    }
  });

  await prisma.documentActivity.create({
    data: {
      documentId: input.documentId,
      actorId: input.actorId,
      action: "payment-recorded",
      detail: `${thaiCanonicalTerms.recordReceipt} ${Number(input.amount).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`
    }
  });

  return payment;
}
