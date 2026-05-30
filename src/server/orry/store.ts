import { ContactType, DocumentKind, DocumentModuleCode, DocumentStatus as PrismaDocumentStatus, type Prisma, type PrismaClient, ProductKind } from "@prisma/client";
import { getPrisma } from "@/lib/db";
import type { ApiResourceKey, Customer, DocumentStatus, GLAccount, Invoice, JournalEntry, OrryStoreSnapshot, Product, PurchaseOrder, SalesOrder, Stock, Vendor, Warehouse } from "@/lib/orry/schema";
import { InventoryValidationError } from "@/lib/orry/inventory";
import { WorkflowTransitionError } from "@/lib/orry/workflow";
import { assertCreatorCannotSelfApprove, assertTransitionAllowed, buildInventoryOperationPlan, buildShipmentPlan, mapDbStatusToOrry, type PersistedDocumentStatus, type StoreDocumentResource } from "@/server/orry/store-rules";

type DbClient = PrismaClient | Prisma.TransactionClient;

class StorePersistenceError extends Error {
  constructor(message = "ORRY store persistence is unavailable.") {
    super(message);
    this.name = "StorePersistenceError";
  }
}

let storeDbClientFactory: (() => PrismaClient) | null = null;

function getDbClient() {
  const prisma = getPrisma();
  if (!prisma) {
    throw new StorePersistenceError();
  }
  return prisma as PrismaClient;
}

function resolveDbClient() {
  return (storeDbClientFactory ?? getDbClient)();
}

export function setStoreDbClientForTesting(factory: (() => PrismaClient) | null) {
  storeDbClientFactory = factory;
}

function toNumber(value: Prisma.Decimal | number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return Number(value?.toString() ?? 0);
}

function readString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

function readNumber(value: unknown, field: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} must be a valid number.`);
  }
  return parsed;
}

async function getDefaultWarehouse(client: DbClient) {
  const main = await client.warehouse.findFirst({
    where: { code: "MAIN", active: true },
    orderBy: { createdAt: "asc" },
  });
  return main ?? client.warehouse.findFirst({ orderBy: { createdAt: "asc" } });
}

async function getDefaultOwner(client: DbClient, actorId?: string) {
  if (actorId) {
    const actor = await client.user.findUnique({ where: { id: actorId } });
    if (actor) return actor;
  }
  return client.user.findFirst({ orderBy: { createdAt: "asc" } });
}

function productStatus(stockOnHand: number, reorderPoint: number): Product["status"] {
  if (stockOnHand <= Math.max(1, Math.floor(reorderPoint / 2))) return "critical";
  if (stockOnHand <= reorderPoint) return "warning";
  return "ok";
}

function contactStatus(balanceDue: number, creditLimit: number): Customer["status"] {
  if (balanceDue > creditLimit * 0.75) return "critical";
  if (balanceDue > creditLimit * 0.35) return "warning";
  return "ok";
}

function vendorStatus(leadTimeDays: number): Vendor["status"] {
  if (leadTimeDays >= 12) return "warning";
  return "ok";
}

function mapProduct(product: {
  id: string;
  sku: string;
  name: string;
  unitLabel: string;
  unitPrice: Prisma.Decimal | number;
  reorderPoint: number;
  stockOnHand: number;
  category?: { name: string } | null;
}): Product {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category?.name ?? "General",
    unit: product.unitLabel,
    price: toNumber(product.unitPrice),
    reorderPoint: product.reorderPoint,
    status: productStatus(product.stockOnHand, product.reorderPoint),
  };
}

function mapCustomer(contact: { id: string; code: string; displayName: string; documents: Array<{ totalAmount: Prisma.Decimal | number }>; }): Customer {
  const balanceDue = contact.documents.reduce((sum, item) => sum + toNumber(item.totalAmount), 0);
  const creditLimit = Math.max(250000, balanceDue * 2 || 250000);
  return {
    id: contact.id,
    code: contact.code,
    name: contact.displayName,
    channel: "Customer",
    creditLimit,
    balanceDue,
    status: contactStatus(balanceDue, creditLimit),
  };
}

function mapVendor(contact: { id: string; code: string; displayName: string; createdAt: Date }): Vendor {
  const leadTimeDays = 7 + (contact.createdAt.getDate() % 5);
  return {
    id: contact.id,
    code: contact.code,
    name: contact.displayName,
    leadTimeDays,
    paymentTermDays: 30,
    status: vendorStatus(leadTimeDays),
  };
}

function mapWarehouse(warehouse: { id: string; code: string; name: string; balances: Array<{ quantity: number }> }): Warehouse {
  const usedCapacity = warehouse.balances.reduce((sum, balance) => sum + balance.quantity, 0);
  return {
    id: warehouse.id,
    code: warehouse.code,
    name: warehouse.name,
    capacity: Math.max(usedCapacity, 1),
    usedCapacity,
  };
}

function mapStock(balance: {
  id: string;
  quantity: number;
  updatedAt: Date;
  warehouseId: string;
  productId: string;
  warehouse: { code: string };
}, reserved: number): Stock {
  const maxCapacity = Math.max(balance.quantity + Math.max(reserved, 0), 1);
  return {
    id: balance.id,
    productId: balance.productId,
    warehouseId: balance.warehouseId,
    lotNumber: `${balance.warehouse.code}-${balance.id.slice(-6).toUpperCase()}`,
    stockOnHand: balance.quantity,
    reserved,
    available: balance.quantity - reserved,
    maxCapacity,
    condition: "SELLABLE",
    updatedAt: balance.updatedAt.toISOString(),
  };
}

function mapWorkflowDocumentStatus(resource: StoreDocumentResource, status: PersistedDocumentStatus) {
  return mapDbStatusToOrry(resource, status);
}

function mapSalesOrder(document: {
  id: string;
  documentNumber: string;
  contactId: string | null;
  contact: { displayName: string } | null;
  totalAmount: Prisma.Decimal | number;
  ownerId: string | null;
  status: PersistedDocumentStatus;
  lines: Array<unknown>;
  dueAt: Date | null;
  updatedAt: Date;
}): SalesOrder {
  return {
    id: document.id,
    documentNumber: document.documentNumber,
    customerId: document.contactId ?? "",
    customerOrVendorName: document.contact?.displayName ?? "Unknown customer",
    totalAmount: toNumber(document.totalAmount),
    status: mapWorkflowDocumentStatus("sales-orders", document.status),
    createdByUserId: document.ownerId ?? "",
    itemCount: document.lines.length,
    shipmentWindow: document.dueAt?.toISOString().slice(0, 10) ?? document.updatedAt.toISOString().slice(0, 10),
    updatedAt: document.updatedAt.toISOString(),
  };
}

function mapPurchaseOrder(document: {
  id: string;
  documentNumber: string;
  contactId: string | null;
  contact: { displayName: string } | null;
  totalAmount: Prisma.Decimal | number;
  ownerId: string | null;
  status: PersistedDocumentStatus;
  lines: Array<unknown>;
  dueAt: Date | null;
  updatedAt: Date;
}): PurchaseOrder {
  return {
    id: document.id,
    documentNumber: document.documentNumber,
    vendorId: document.contactId ?? "",
    customerOrVendorName: document.contact?.displayName ?? "Unknown vendor",
    totalAmount: toNumber(document.totalAmount),
    status: mapWorkflowDocumentStatus("purchase-orders", document.status),
    createdByUserId: document.ownerId ?? "",
    itemCount: document.lines.length,
    expectedDate: document.dueAt?.toISOString().slice(0, 10) ?? document.updatedAt.toISOString().slice(0, 10),
    updatedAt: document.updatedAt.toISOString(),
  };
}

function mapInvoice(document: {
  id: string;
  documentNumber: string;
  contactId: string | null;
  contact: { displayName: string } | null;
  totalAmount: Prisma.Decimal | number;
  ownerId: string | null;
  status: PersistedDocumentStatus;
  dueAt: Date | null;
  payments: Array<{ amount: Prisma.Decimal | number }>;
  updatedAt: Date;
}): Invoice {
  return {
    id: document.id,
    documentNumber: document.documentNumber,
    customerId: document.contactId ?? "",
    customerOrVendorName: document.contact?.displayName ?? "Unknown customer",
    totalAmount: toNumber(document.totalAmount),
    status: mapWorkflowDocumentStatus("invoices", document.status),
    createdByUserId: document.ownerId ?? "",
    dueDate: document.dueAt?.toISOString().slice(0, 10) ?? document.updatedAt.toISOString().slice(0, 10),
    paidAmount: document.payments.reduce((sum, item) => sum + toNumber(item.amount), 0),
    updatedAt: document.updatedAt.toISOString(),
  };
}

function mapGlAccount(account: { id: string; code: string; name: string; type: string; balance: Prisma.Decimal | number }): GLAccount {
  return {
    id: account.id,
    code: account.code,
    name: account.name,
    type: account.type as GLAccount["type"],
    balance: toNumber(account.balance),
  };
}

function mapJournalEntry(entry: { id: string; journalNumber: string; accountId: string; description: string; debit: Prisma.Decimal | number; credit: Prisma.Decimal | number; status: PersistedDocumentStatus; createdById: string | null; postedAt: Date | null; updatedAt: Date }): JournalEntry {
  return {
    id: entry.id,
    journalNumber: entry.journalNumber,
    accountId: entry.accountId,
    description: entry.description,
    debit: toNumber(entry.debit),
    credit: toNumber(entry.credit),
    documentNumber: entry.journalNumber,
    customerOrVendorName: "Ledger",
    totalAmount: toNumber(entry.debit) || toNumber(entry.credit),
    status: mapWorkflowDocumentStatus("gl", entry.status),
    createdByUserId: entry.createdById ?? "",
    postedAt: entry.postedAt?.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

async function listOutstandingReservations(client: DbClient) {
  const approvedOrders = await client.businessDocument.findMany({
    where: { kind: DocumentKind.SALES_ORDER, status: PrismaDocumentStatus.APPROVED },
    select: { lines: { select: { productId: true, quantity: true } } },
  });

  const reservedByProduct = new Map<string, number>();
  for (const order of approvedOrders) {
    for (const line of order.lines) {
      if (!line.productId) continue;
      reservedByProduct.set(line.productId, (reservedByProduct.get(line.productId) ?? 0) + toNumber(line.quantity));
    }
  }
  return reservedByProduct;
}

export async function getOrryStoreSnapshot(): Promise<OrryStoreSnapshot> {
  const prisma = resolveDbClient();
  const [products, customerContacts, vendorContacts, warehouses, balances, salesOrders, purchaseOrders, invoices, glAccounts, journalEntries, reservations] = await Promise.all([
    prisma.product.findMany({ include: { category: { select: { name: true } } }, orderBy: { name: "asc" } }),
    prisma.contact.findMany({ where: { type: ContactType.CUSTOMER }, include: { documents: { where: { kind: { in: [DocumentKind.SALES_ORDER, DocumentKind.BILLING_RECORD, DocumentKind.RECEIPT] } }, select: { totalAmount: true } } }, orderBy: { displayName: "asc" } }),
    prisma.contact.findMany({ where: { type: ContactType.VENDOR }, orderBy: { displayName: "asc" } }),
    prisma.warehouse.findMany({ include: { balances: { select: { quantity: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.inventoryBalance.findMany({ include: { warehouse: { select: { code: true } } }, orderBy: { updatedAt: "desc" } }),
    prisma.businessDocument.findMany({ where: { kind: DocumentKind.SALES_ORDER }, include: { contact: { select: { displayName: true } }, lines: { select: { id: true } } }, orderBy: { updatedAt: "desc" } }),
    prisma.businessDocument.findMany({ where: { kind: DocumentKind.PURCHASE_ORDER }, include: { contact: { select: { displayName: true } }, lines: { select: { id: true } } }, orderBy: { updatedAt: "desc" } }),
    prisma.businessDocument.findMany({ where: { kind: DocumentKind.BILLING_RECORD }, include: { contact: { select: { displayName: true } }, payments: { select: { amount: true } } }, orderBy: { updatedAt: "desc" } }),
    prisma.generalLedgerAccount.findMany({ orderBy: { code: "asc" } }),
    prisma.journalEntry.findMany({ orderBy: { updatedAt: "desc" } }),
    listOutstandingReservations(prisma),
  ]);

  return {
    products: products.map(mapProduct),
    customers: customerContacts.map(mapCustomer),
    vendors: vendorContacts.map(mapVendor),
    warehouses: warehouses.map(mapWarehouse),
    stock: balances.map((balance) => mapStock(balance, reservations.get(balance.productId) ?? 0)),
    salesOrders: salesOrders.map(mapSalesOrder),
    purchaseOrders: purchaseOrders.map(mapPurchaseOrder),
    invoices: invoices.map(mapInvoice),
    glAccounts: glAccounts.map(mapGlAccount),
    journalEntries: journalEntries.map(mapJournalEntry),
  };
}

export async function listResource(resource: ApiResourceKey) {
  const snapshot = await getOrryStoreSnapshot();
  switch (resource) {
    case "products":
      return snapshot.products;
    case "customers":
      return snapshot.customers;
    case "vendors":
      return snapshot.vendors;
    case "stock":
      return snapshot.stock;
    case "sales-orders":
      return snapshot.salesOrders;
    case "purchase-orders":
      return snapshot.purchaseOrders;
    case "invoices":
      return snapshot.invoices;
    case "gl":
      return { accounts: snapshot.glAccounts, journals: snapshot.journalEntries };
  }
}

async function createDocumentResource(client: DbClient, input: {
  kind: DocumentKind;
  moduleCode: DocumentModuleCode;
  contactType: ContactType;
  documentNumber: string;
  actorId?: string;
  totalAmount: number;
  dueDate?: string;
}) {
  const [contact, owner, companyProfile, warehouse] = await Promise.all([
    client.contact.findFirst({ where: { type: input.contactType }, orderBy: { createdAt: "asc" } }),
    getDefaultOwner(client, input.actorId),
    client.companyProfile.findFirst({ orderBy: { createdAt: "asc" } }),
    getDefaultWarehouse(client),
  ]);

  return client.businessDocument.create({
    data: {
      documentNumber: input.documentNumber,
      kind: input.kind,
      moduleCode: input.moduleCode,
      status: PrismaDocumentStatus.DRAFT,
      contactId: contact?.id,
      ownerId: owner?.id,
      companyProfileId: companyProfile?.id,
      warehouseId: warehouse?.id,
      issuedAt: new Date(),
      dueAt: input.dueDate ? new Date(input.dueDate) : new Date(),
      totalAmount: input.totalAmount,
      subtotalAmount: input.totalAmount,
      totalAfterDiscountAmount: input.totalAmount,
      notes: "Created from ORRY ERP scoped store.",
      lines: {
        create: {
          title: "Initial line",
          quantity: 1,
          unitLabel: "unit",
          unitPrice: input.totalAmount,
          lineTotal: input.totalAmount,
          sortOrder: 0,
        },
      },
    },
    include: { contact: { select: { displayName: true } }, lines: { select: { id: true } }, payments: { select: { amount: true } } },
  });
}

export async function createResource(resource: ApiResourceKey, payload: Record<string, unknown>) {
  const prisma = resolveDbClient();

  switch (resource) {
    case "products":
      return mapProduct(await prisma.product.create({
        data: {
          sku: readString(payload.sku, "sku"),
          name: readString(payload.name, "name"),
          kind: ProductKind.INVENTORY,
          unitLabel: readString(payload.unit ?? "Unit", "unit"),
          unitPrice: readNumber(payload.price ?? 0, "price"),
          cost: readNumber(payload.price ?? 0, "price"),
          reorderPoint: readNumber(payload.reorderPoint ?? 0, "reorderPoint"),
          stockOnHand: 0,
        },
        include: { category: { select: { name: true } } },
      }));
    case "customers":
      return mapCustomer(await prisma.contact.create({
        data: {
          code: readString(payload.code, "code"),
          type: ContactType.CUSTOMER,
          displayName: readString(payload.name, "name"),
        },
        include: { documents: { select: { totalAmount: true } } },
      }));
    case "vendors":
      return mapVendor(await prisma.contact.create({
        data: {
          code: readString(payload.code, "code"),
          type: ContactType.VENDOR,
          displayName: readString(payload.name, "name"),
        },
      }));
    case "stock": {
      const warehouse = await getDefaultWarehouse(prisma);
      if (!warehouse) throw new Error("MAIN warehouse is required.");
      const productId = readString(payload.productId, "productId");
      const quantity = readNumber(payload.stockOnHand ?? 0, "stockOnHand");
      const balance = await prisma.inventoryBalance.upsert({
        where: { warehouseId_productId: { warehouseId: warehouse.id, productId } },
        update: { quantity },
        create: { warehouseId: warehouse.id, productId, quantity },
        include: { warehouse: { select: { code: true } } },
      });
      await prisma.product.update({ where: { id: productId }, data: { stockOnHand: quantity } });
      return mapStock(balance, 0);
    }
    case "sales-orders":
      return mapSalesOrder(await createDocumentResource(prisma, { kind: DocumentKind.SALES_ORDER, moduleCode: DocumentModuleCode.SALES_ORDER, contactType: ContactType.CUSTOMER, documentNumber: readString(payload.documentNumber ?? `SO-${Date.now()}`, "documentNumber"), actorId: typeof payload.createdByUserId === "string" ? payload.createdByUserId : undefined, totalAmount: readNumber(payload.totalAmount ?? 0, "totalAmount"), dueDate: typeof payload.shipmentWindow === "string" ? payload.shipmentWindow : undefined }));
    case "purchase-orders":
      return mapPurchaseOrder(await createDocumentResource(prisma, { kind: DocumentKind.PURCHASE_ORDER, moduleCode: DocumentModuleCode.PURCHASE_ORDER, contactType: ContactType.VENDOR, documentNumber: readString(payload.documentNumber ?? `PO-${Date.now()}`, "documentNumber"), actorId: typeof payload.createdByUserId === "string" ? payload.createdByUserId : undefined, totalAmount: readNumber(payload.totalAmount ?? 0, "totalAmount"), dueDate: typeof payload.expectedDate === "string" ? payload.expectedDate : undefined }));
    case "invoices":
      return mapInvoice(await createDocumentResource(prisma, { kind: DocumentKind.BILLING_RECORD, moduleCode: DocumentModuleCode.TAX_INVOICE, contactType: ContactType.CUSTOMER, documentNumber: readString(payload.documentNumber ?? `INV-${Date.now()}`, "documentNumber"), actorId: typeof payload.createdByUserId === "string" ? payload.createdByUserId : undefined, totalAmount: readNumber(payload.totalAmount ?? 0, "totalAmount"), dueDate: typeof payload.dueDate === "string" ? payload.dueDate : undefined }));
    case "gl":
      return mapJournalEntry(await prisma.journalEntry.create({
        data: {
          journalNumber: readString(payload.journalNumber ?? `GL-${Date.now()}`, "journalNumber"),
          accountId: readString(payload.accountId, "accountId"),
          description: readString(payload.description ?? "Manual journal", "description"),
          debit: readNumber(payload.debit ?? 0, "debit"),
          credit: readNumber(payload.credit ?? 0, "credit"),
          createdById: typeof payload.createdByUserId === "string" ? payload.createdByUserId : undefined,
        },
      }));
  }
}

async function updateDocumentResource(client: PrismaClient, resource: StoreDocumentResource, payload: Record<string, unknown>) {
  const id = readString(payload.id, "id");
  const nextStatus = typeof payload.status === "string" ? payload.status : undefined;
  const actorId = typeof payload.actorId === "string" ? payload.actorId : undefined;

  if (!nextStatus) {
    return null;
  }

  return client.$transaction(async (tx) => {
    const document = await tx.businessDocument.findUnique({
      where: { id },
      include: {
        lines: { select: { id: true, productId: true, quantity: true, product: { select: { stockOnHand: true, kind: true } } } },
      },
    });

    if (!document) return null;
    assertCreatorCannotSelfApprove(document.ownerId, actorId, nextStatus as "APPROVED");

    const currentStatus = document.status as PersistedDocumentStatus;
    if (resource === "sales-orders" && nextStatus === "POSTED") {
      const warehouse = document.warehouseId ? await tx.warehouse.findUnique({ where: { id: document.warehouseId } }) : await getDefaultWarehouse(tx);
      if (!warehouse) throw new Error("MAIN warehouse is required for shipment confirmation.");

      const balances = await tx.inventoryBalance.findMany({
        where: { warehouseId: warehouse.id, productId: { in: document.lines.map((line) => line.productId).filter((value): value is string => Boolean(value)) } },
      });
      const balanceByProduct = new Map(balances.map((balance) => [balance.productId, balance]));
      const alreadyShipped = await tx.inventoryMovement.count({
        where: { referenceType: "SALES_ORDER_SHIPMENT", referenceId: document.id },
      });

      const shipmentPlan = buildShipmentPlan({
        currentDbStatus: currentStatus,
        actorId,
        ownerId: document.ownerId,
        alreadyShipped: alreadyShipped > 0,
        lines: document.lines
          .filter((line) => line.productId && line.product?.kind === ProductKind.INVENTORY)
          .map((line) => {
            const balance = balanceByProduct.get(line.productId!);
            return {
              productId: line.productId!,
              quantity: toNumber(line.quantity),
              stockOnHand: line.product?.stockOnHand ?? 0,
              balanceQuantity: balance?.quantity ?? 0,
            };
          }),
      });

      for (const update of shipmentPlan.balanceUpdates) {
        await tx.inventoryBalance.update({
          where: { warehouseId_productId: { warehouseId: warehouse.id, productId: update.productId } },
          data: { quantity: update.nextQuantity },
        });
        await tx.product.update({ where: { id: update.productId }, data: { stockOnHand: update.nextStockOnHand } });
        await tx.inventoryMovement.create({
          data: {
            warehouseId: warehouse.id,
            productId: update.productId,
            movementType: shipmentPlan.movementType,
            quantity: update.quantityDelta,
            referenceType: shipmentPlan.movementType,
            referenceId: document.id,
            occurredAt: new Date(),
          },
        });
      }

      const updated = await tx.businessDocument.update({ where: { id }, data: { status: shipmentPlan.nextDbStatus } });
      await tx.documentStatusHistory.create({ data: { documentId: id, fromStatus: document.status, toStatus: shipmentPlan.nextDbStatus, changedById: actorId, note: "Shipment confirmed from ORRY ERP store." } });
      await tx.documentActivity.create({ data: { documentId: id, actorId, action: "shipment-confirmed", detail: "Confirmed shipment and deducted inventory exactly once." } });
      return updated;
    }

    const mappedStatus = assertTransitionAllowed(resource, currentStatus, nextStatus as DocumentStatus);
    const updated = await tx.businessDocument.update({ where: { id }, data: { status: mappedStatus } });
    await tx.documentStatusHistory.create({ data: { documentId: id, fromStatus: document.status, toStatus: mappedStatus, changedById: actorId, note: "Status changed from ORRY ERP store." } });
    await tx.documentActivity.create({ data: { documentId: id, actorId, action: "status-updated", detail: `Updated status to ${mappedStatus}.` } });
    return updated;
  });
}

export async function updateResource(resource: ApiResourceKey, payload: Record<string, unknown>) {
  const prisma = resolveDbClient();
  const id = readString(payload.id, "id");

  switch (resource) {
    case "products": {
      const updated = await prisma.product.update({
        where: { id },
        data: {
          name: typeof payload.name === "string" ? payload.name : undefined,
          unitPrice: payload.price === undefined ? undefined : readNumber(payload.price, "price"),
          reorderPoint: payload.reorderPoint === undefined ? undefined : readNumber(payload.reorderPoint, "reorderPoint"),
        },
        include: { category: { select: { name: true } } },
      });
      return mapProduct(updated);
    }
    case "customers": {
      const updated = await prisma.contact.update({
        where: { id },
        data: { displayName: typeof payload.name === "string" ? payload.name : undefined },
        include: { documents: { select: { totalAmount: true } } },
      });
      return mapCustomer(updated);
    }
    case "vendors": {
      const updated = await prisma.contact.update({
        where: { id },
        data: { displayName: typeof payload.name === "string" ? payload.name : undefined },
      });
      return mapVendor(updated);
    }
    case "stock": {
      const operation = (payload.operation as "issue" | "adjustment" | "return" | undefined) ?? (payload.returnQuantity !== undefined ? "return" : "issue");
      const balance = await prisma.inventoryBalance.findUnique({
        where: { id },
        include: { product: true, warehouse: true },
      });
      if (!balance) return null;

      const quantity = readNumber(payload.quantity ?? payload.issueQuantity ?? payload.returnQuantity ?? payload.stockOnHandDelta ?? 0, "quantity");
      const plan = buildInventoryOperationPlan({
        operation,
        approved: payload.approved === true,
        quantity: Math.abs(quantity),
        balanceQuantity: balance.quantity,
        stockOnHand: balance.product.stockOnHand,
        condition: payload.condition as Stock["condition"] | undefined,
      });

      const updatedBalance = await prisma.$transaction(async (tx) => {
        const nextBalance = await tx.inventoryBalance.update({
          where: { id: balance.id },
          data: { quantity: plan.nextBalanceQuantity },
          include: { warehouse: { select: { code: true } } },
        });
        await tx.product.update({ where: { id: balance.productId }, data: { stockOnHand: plan.nextProductStockOnHand } });
        await tx.inventoryMovement.create({
          data: {
            warehouseId: balance.warehouseId,
            productId: balance.productId,
            movementType: plan.movementType,
            quantity: plan.quantityDelta,
            referenceType: plan.movementType,
            referenceId: balance.id,
            occurredAt: new Date(),
          },
        });
        return nextBalance;
      });

      const reservations = await listOutstandingReservations(prisma);
      return mapStock(updatedBalance, reservations.get(updatedBalance.productId) ?? 0);
    }
    case "sales-orders": {
      const updated = await updateDocumentResource(prisma, "sales-orders", payload);
      if (!updated) return null;
      const reloaded = await prisma.businessDocument.findUnique({ where: { id: updated.id }, include: { contact: { select: { displayName: true } }, lines: { select: { id: true } } } });
      return reloaded ? mapSalesOrder(reloaded) : null;
    }
    case "purchase-orders": {
      const updated = await updateDocumentResource(prisma, "purchase-orders", payload);
      if (!updated) return null;
      const reloaded = await prisma.businessDocument.findUnique({ where: { id: updated.id }, include: { contact: { select: { displayName: true } }, lines: { select: { id: true } } } });
      return reloaded ? mapPurchaseOrder(reloaded) : null;
    }
    case "invoices": {
      const updated = await updateDocumentResource(prisma, "invoices", payload);
      if (!updated) return null;
      const reloaded = await prisma.businessDocument.findUnique({ where: { id: updated.id }, include: { contact: { select: { displayName: true } }, payments: { select: { amount: true } } } });
      return reloaded ? mapInvoice(reloaded) : null;
    }
    case "gl": {
      const nextStatus = typeof payload.status === "string" ? payload.status : undefined;
      const actorId = typeof payload.actorId === "string" ? payload.actorId : undefined;
      const current = await prisma.journalEntry.findUnique({ where: { id } });
      if (!current) return null;
      if (nextStatus) {
        assertCreatorCannotSelfApprove(current.createdById, actorId, nextStatus as DocumentStatus);
        const mappedStatus = assertTransitionAllowed("gl", current.status as PersistedDocumentStatus, nextStatus as DocumentStatus);
        const updated = await prisma.journalEntry.update({
          where: { id },
          data: {
            status: mappedStatus,
            postedAt: mappedStatus === "ISSUED" ? new Date() : current.postedAt,
          },
        });
        return mapJournalEntry(updated);
      }

      const updated = await prisma.journalEntry.update({
        where: { id },
        data: {
          description: typeof payload.description === "string" ? payload.description : undefined,
          debit: payload.debit === undefined ? undefined : readNumber(payload.debit, "debit"),
          credit: payload.credit === undefined ? undefined : readNumber(payload.credit, "credit"),
        },
      });
      return mapJournalEntry(updated);
    }
  }
}

export function isKnownDomainError(error: unknown) {
  return error instanceof InventoryValidationError || error instanceof WorkflowTransitionError || error instanceof StorePersistenceError;
}
