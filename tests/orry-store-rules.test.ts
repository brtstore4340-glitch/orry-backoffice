import assert from "node:assert/strict";
import test from "node:test";
import { InventoryValidationError } from "@/lib/orry/inventory";
import { WorkflowTransitionError } from "@/lib/orry/workflow";
import {
  assertCreatorCannotSelfApprove,
  assertTransitionAllowed,
  buildInventoryOperationPlan,
  buildShipmentPlan,
  shouldApplySalesOrderShipment,
} from "@/server/orry/store-rules";
import { createResource, setStoreDbClientForTesting, updateResource } from "@/server/orry/store";

interface FakeProduct {
  id: string;
  sku: string;
  name: string;
  unitLabel: string;
  unitPrice: number;
  reorderPoint: number;
  stockOnHand: number;
  kind?: string;
  category?: { name: string } | null;
}

interface FakeUser {
  id: string;
  createdAt: Date;
}

interface FakeContact {
  id: string;
  code: string;
  type: string;
  displayName: string;
  createdAt: Date;
}

interface FakeWarehouse {
  id: string;
  code: string;
  name: string;
  active: boolean;
  createdAt: Date;
}

interface FakeDocumentLine {
  id: string;
  productId: string | null;
  quantity: number;
  product?: FakeProduct | null;
}

interface FakeBusinessDocument {
  id: string;
  documentNumber: string;
  kind: string;
  moduleCode: string;
  status: string;
  contactId: string | null;
  ownerId: string | null;
  companyProfileId: string | null;
  warehouseId: string | null;
  issuedAt: Date;
  dueAt: Date | null;
  totalAmount: number;
  subtotalAmount: number;
  totalAfterDiscountAmount: number;
  notes: string;
  updatedAt: Date;
  lines: FakeDocumentLine[];
  payments: Array<{ amount: number }>;
}

interface FakeInventoryBalance {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  updatedAt: Date;
}

interface FakeInventoryMovement {
  warehouseId: string;
  productId: string;
  movementType: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  occurredAt: Date;
}

interface FakeState {
  products: FakeProduct[];
  users: FakeUser[];
  contacts: FakeContact[];
  warehouses: FakeWarehouse[];
  companyProfiles: Array<{ id: string; createdAt: Date }>;
  businessDocuments: FakeBusinessDocument[];
  inventoryBalances: FakeInventoryBalance[];
  inventoryMovements: FakeInventoryMovement[];
  documentStatusHistory: Array<Record<string, unknown>>;
  documentActivities: Array<Record<string, unknown>>;
}

function seedState(overrides?: Partial<FakeState>): FakeState {
  const now = new Date("2026-04-09T10:00:00.000Z");
  return {
    products: [
      {
        id: "prd-1",
        sku: "SKU-001",
        name: "Serenity Kiss Set",
        unitLabel: "box",
        unitPrice: 120,
        reorderPoint: 4,
        stockOnHand: 12,
        kind: "INVENTORY",
        category: { name: "Finished Goods" },
      },
    ],
    users: [
      { id: "creator-1", createdAt: now },
      { id: "approver-1", createdAt: new Date("2026-04-09T10:01:00.000Z") },
    ],
    contacts: [
      { id: "cus-1", code: "CUS-001", type: "CUSTOMER", displayName: "ORRY Retail", createdAt: now },
      { id: "ven-1", code: "VEN-001", type: "VENDOR", displayName: "ORRY Supply", createdAt: now },
    ],
    warehouses: [{ id: "wh-main", code: "MAIN", name: "คลังหลัก", active: true, createdAt: now }],
    companyProfiles: [{ id: "company-1", createdAt: now }],
    businessDocuments: [],
    inventoryBalances: [{ id: "bal-1", warehouseId: "wh-main", productId: "prd-1", quantity: 12, updatedAt: now }],
    inventoryMovements: [],
    documentStatusHistory: [],
    documentActivities: [],
    ...overrides,
  };
}

function cloneDocument(document: FakeBusinessDocument, state: FakeState, include?: Record<string, unknown>) {
  const contact = document.contactId ? state.contacts.find((item) => item.id === document.contactId) ?? null : null;
  const lines = document.lines.map((line) => ({
    ...line,
    product: line.productId ? state.products.find((item) => item.id === line.productId) ?? null : null,
  }));

  return {
    ...document,
    contact: include?.contact ? { displayName: contact?.displayName ?? "Unknown" } : undefined,
    lines,
    payments: include?.payments ? document.payments : undefined,
  };
}

function createFakePrisma(state: FakeState) {
  const warehouseWithBalances = (warehouse: FakeWarehouse) => ({
    ...warehouse,
    balances: state.inventoryBalances.filter((balance) => balance.warehouseId === warehouse.id).map((balance) => ({ quantity: balance.quantity })),
  });

  const balanceWithRelations = (balance: FakeInventoryBalance) => ({
    ...balance,
    warehouse: { code: state.warehouses.find((item) => item.id === balance.warehouseId)?.code ?? "MAIN" },
    product: state.products.find((item) => item.id === balance.productId)!,
  });

  const client: any = {
    product: {
      update: async ({ where, data }: any) => {
        const product = state.products.find((item) => item.id === where.id);
        if (!product) throw new Error("Product not found.");
        Object.assign(product, data);
        return { ...product };
      },
    },
    contact: {
      findFirst: async ({ where }: any) => state.contacts.find((item) => item.type === where.type) ?? null,
    },
    user: {
      findUnique: async ({ where }: any) => state.users.find((item) => item.id === where.id) ?? null,
      findFirst: async () => state.users[0] ?? null,
    },
    companyProfile: {
      findFirst: async () => state.companyProfiles[0] ?? null,
    },
    warehouse: {
      findFirst: async ({ where }: any = {}) => {
        const list = state.warehouses.filter((item) => (where?.code ? item.code === where.code : true) && (where?.active === undefined ? true : item.active === where.active));
        return list[0] ? warehouseWithBalances(list[0]) : null;
      },
      findUnique: async ({ where }: any) => {
        const warehouse = state.warehouses.find((item) => item.id === where.id);
        return warehouse ? warehouseWithBalances(warehouse) : null;
      },
    },
    businessDocument: {
      findMany: async ({ where }: any) =>
        state.businessDocuments
          .filter((item) => (where?.kind ? item.kind === where.kind : true) && (where?.status ? item.status === where.status : true))
          .map((item) => ({
            ...item,
            lines: item.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
          })),
      findUnique: async ({ where, include }: any) => {
        const document = state.businessDocuments.find((item) => item.id === where.id);
        return document ? cloneDocument(document, state, include) : null;
      },
      create: async ({ data, include }: any) => {
        const document: FakeBusinessDocument = {
          id: `doc-${state.businessDocuments.length + 1}`,
          documentNumber: data.documentNumber,
          kind: data.kind,
          moduleCode: data.moduleCode,
          status: data.status,
          contactId: data.contactId ?? null,
          ownerId: data.ownerId ?? null,
          companyProfileId: data.companyProfileId ?? null,
          warehouseId: data.warehouseId ?? null,
          issuedAt: data.issuedAt,
          dueAt: data.dueAt,
          totalAmount: data.totalAmount,
          subtotalAmount: data.subtotalAmount,
          totalAfterDiscountAmount: data.totalAfterDiscountAmount,
          notes: data.notes,
          updatedAt: new Date(),
          lines: [
            {
              id: `line-${state.businessDocuments.length + 1}`,
              productId: data.lines?.create?.productId ?? null,
              quantity: data.lines?.create?.quantity ?? 1,
            },
          ],
          payments: [],
        };
        state.businessDocuments.push(document);
        return cloneDocument(document, state, include);
      },
      update: async ({ where, data }: any) => {
        const document = state.businessDocuments.find((item) => item.id === where.id);
        if (!document) throw new Error("Document not found.");
        Object.assign(document, data, { updatedAt: new Date() });
        return { ...document };
      },
    },
    inventoryBalance: {
      findMany: async ({ where }: any) =>
        state.inventoryBalances
          .filter((item) => item.warehouseId === where.warehouseId && where.productId.in.includes(item.productId))
          .map((item) => ({ ...item })),
      findUnique: async ({ where }: any) => {
        const balance = state.inventoryBalances.find((item) => item.id === where.id);
        return balance ? balanceWithRelations(balance) : null;
      },
      update: async ({ where, data, include }: any) => {
        const balance =
          "id" in where
            ? state.inventoryBalances.find((item) => item.id === where.id)
            : state.inventoryBalances.find((item) => item.warehouseId === where.warehouseId_productId.warehouseId && item.productId === where.warehouseId_productId.productId);
        if (!balance) throw new Error("Inventory balance not found.");
        Object.assign(balance, data, { updatedAt: new Date() });
        const updated = include ? balanceWithRelations(balance) : { ...balance };
        return updated;
      },
    },
    inventoryMovement: {
      count: async ({ where }: any) =>
        state.inventoryMovements.filter((item) => item.referenceType === where.referenceType && item.referenceId === where.referenceId).length,
      create: async ({ data }: any) => {
        state.inventoryMovements.push({ ...data });
        return data;
      },
    },
    documentStatusHistory: {
      create: async ({ data }: any) => {
        state.documentStatusHistory.push(data);
        return data;
      },
    },
    documentActivity: {
      create: async ({ data }: any) => {
        state.documentActivities.push(data);
        return data;
      },
    },
    $transaction: async (callback: any) => callback(client),
  };

  return client;
}

async function withStore<T>(state: FakeState, action: () => Promise<T>) {
  setStoreDbClientForTesting(() => createFakePrisma(state));
  try {
    return await action();
  } finally {
    setStoreDbClientForTesting(null);
  }
}

test("creating a sales order does not deduct stock", async () => {
  const state = seedState();

  await withStore(state, async () => {
    await createResource("sales-orders", {
      documentNumber: "SO-1001",
      createdByUserId: "creator-1",
      totalAmount: 120,
      shipmentWindow: "2026-04-10",
    });
  });

  assert.equal(state.products[0].stockOnHand, 12);
  assert.equal(state.inventoryBalances[0].quantity, 12);
  assert.equal(state.businessDocuments.length, 1);
  assert.equal(state.businessDocuments[0]?.status, "DRAFT");
  assert.equal(shouldApplySalesOrderShipment("DRAFT", "DRAFT"), false);
  assert.equal(shouldApplySalesOrderShipment("DRAFT", "PENDING"), false);
});

test("confirming shipment deducts stock exactly once", async () => {
  const state = seedState({
    businessDocuments: [
      {
        id: "so-1",
        documentNumber: "SO-2001",
        kind: "SALES_ORDER",
        moduleCode: "SALES_ORDER",
        status: "APPROVED",
        contactId: "cus-1",
        ownerId: "creator-1",
        companyProfileId: "company-1",
        warehouseId: "wh-main",
        issuedAt: new Date("2026-04-09T10:00:00.000Z"),
        dueAt: new Date("2026-04-10T10:00:00.000Z"),
        totalAmount: 600,
        subtotalAmount: 600,
        totalAfterDiscountAmount: 600,
        notes: "Approved order",
        updatedAt: new Date("2026-04-09T10:00:00.000Z"),
        lines: [{ id: "line-1", productId: "prd-1", quantity: 5 }],
        payments: [],
      },
    ],
  });

  await withStore(state, async () => {
    await updateResource("sales-orders", { id: "so-1", status: "POSTED", actorId: "approver-1" });
  });

  assert.equal(state.businessDocuments[0].status, "FULFILLED");
  assert.equal(state.products[0].stockOnHand, 7);
  assert.equal(state.inventoryBalances[0].quantity, 7);
  assert.equal(state.inventoryMovements.length, 1);
  assert.equal(state.inventoryMovements[0]?.referenceType, "SALES_ORDER_SHIPMENT");

  const plan = buildShipmentPlan({
    currentDbStatus: "APPROVED",
    actorId: "approver-1",
    ownerId: "creator-1",
    alreadyShipped: false,
    lines: [{ productId: "prd-1", quantity: 5, stockOnHand: 12, balanceQuantity: 12 }],
  });
  assert.equal(plan.balanceUpdates[0].nextQuantity, 7);
});

test("second shipment attempt for same order is rejected", async () => {
  const state = seedState({
    businessDocuments: [
      {
        id: "so-1",
        documentNumber: "SO-2001",
        kind: "SALES_ORDER",
        moduleCode: "SALES_ORDER",
        status: "APPROVED",
        contactId: "cus-1",
        ownerId: "creator-1",
        companyProfileId: "company-1",
        warehouseId: "wh-main",
        issuedAt: new Date(),
        dueAt: new Date(),
        totalAmount: 240,
        subtotalAmount: 240,
        totalAfterDiscountAmount: 240,
        notes: "Approved order",
        updatedAt: new Date(),
        lines: [{ id: "line-1", productId: "prd-1", quantity: 2 }],
        payments: [],
      },
    ],
    inventoryMovements: [
      {
        warehouseId: "wh-main",
        productId: "prd-1",
        movementType: "SALES_ORDER_SHIPMENT",
        quantity: -2,
        referenceType: "SALES_ORDER_SHIPMENT",
        referenceId: "so-1",
        occurredAt: new Date(),
      },
    ],
  });

  await assert.rejects(
    () =>
      withStore(state, async () => {
        await updateResource("sales-orders", { id: "so-1", status: "POSTED", actorId: "approver-1" });
      }),
    InventoryValidationError,
  );

  assert.equal(state.products[0].stockOnHand, 12);
  assert.equal(state.inventoryBalances[0].quantity, 12);
  assert.equal(state.inventoryMovements.length, 1);
});

test("unapproved stock-affecting transaction does not mutate inventory", async () => {
  const state = seedState();

  await assert.rejects(
    () =>
      withStore(state, async () => {
        await updateResource("stock", { id: "bal-1", operation: "issue", quantity: 3, approved: false });
      }),
    InventoryValidationError,
  );

  assert.equal(state.products[0].stockOnHand, 12);
  assert.equal(state.inventoryBalances[0].quantity, 12);
  assert.equal(state.inventoryMovements.length, 0);

  assert.throws(
    () =>
      buildInventoryOperationPlan({
        operation: "issue",
        approved: false,
        quantity: 3,
        balanceQuantity: 10,
        stockOnHand: 10,
      }),
    InventoryValidationError,
  );
});

test("creator cannot self-approve", async () => {
  const state = seedState({
    businessDocuments: [
      {
        id: "so-approve",
        documentNumber: "SO-3001",
        kind: "SALES_ORDER",
        moduleCode: "SALES_ORDER",
        status: "AWAITING_APPROVAL",
        contactId: "cus-1",
        ownerId: "creator-1",
        companyProfileId: "company-1",
        warehouseId: "wh-main",
        issuedAt: new Date(),
        dueAt: new Date(),
        totalAmount: 400,
        subtotalAmount: 400,
        totalAfterDiscountAmount: 400,
        notes: "Pending approval",
        updatedAt: new Date(),
        lines: [{ id: "line-1", productId: "prd-1", quantity: 2 }],
        payments: [],
      },
    ],
  });

  await assert.rejects(
    () =>
      withStore(state, async () => {
        await updateResource("sales-orders", { id: "so-approve", status: "APPROVED", actorId: "creator-1" });
      }),
    WorkflowTransitionError,
  );

  assert.equal(state.businessDocuments[0].status, "AWAITING_APPROVAL");
  assert.equal(state.documentStatusHistory.length, 0);
  assert.throws(() => assertCreatorCannotSelfApprove("user-1", "user-1", "APPROVED"), WorkflowTransitionError);
});

test("valid approver can approve and then inventory mutation succeeds", async () => {
  const state = seedState({
    businessDocuments: [
      {
        id: "so-approve",
        documentNumber: "SO-3002",
        kind: "SALES_ORDER",
        moduleCode: "SALES_ORDER",
        status: "AWAITING_APPROVAL",
        contactId: "cus-1",
        ownerId: "creator-1",
        companyProfileId: "company-1",
        warehouseId: "wh-main",
        issuedAt: new Date(),
        dueAt: new Date(),
        totalAmount: 480,
        subtotalAmount: 480,
        totalAfterDiscountAmount: 480,
        notes: "Pending approval",
        updatedAt: new Date(),
        lines: [{ id: "line-1", productId: "prd-1", quantity: 4 }],
        payments: [],
      },
    ],
  });

  await withStore(state, async () => {
    await updateResource("sales-orders", { id: "so-approve", status: "APPROVED", actorId: "approver-1" });
    await updateResource("sales-orders", { id: "so-approve", status: "POSTED", actorId: "approver-1" });
  });

  assert.equal(state.businessDocuments[0].status, "FULFILLED");
  assert.equal(state.products[0].stockOnHand, 8);
  assert.equal(state.inventoryBalances[0].quantity, 8);
  assert.equal(state.documentStatusHistory.length, 2);

  const nextStatus = assertTransitionAllowed("sales-orders", "AWAITING_APPROVAL", "APPROVED");
  assert.equal(nextStatus, "APPROVED");
});

test("invalid workflow transition is rejected", async () => {
  const state = seedState({
    businessDocuments: [
      {
        id: "so-invalid",
        documentNumber: "SO-3003",
        kind: "SALES_ORDER",
        moduleCode: "SALES_ORDER",
        status: "DRAFT",
        contactId: "cus-1",
        ownerId: "creator-1",
        companyProfileId: "company-1",
        warehouseId: "wh-main",
        issuedAt: new Date(),
        dueAt: new Date(),
        totalAmount: 120,
        subtotalAmount: 120,
        totalAfterDiscountAmount: 120,
        notes: "Draft order",
        updatedAt: new Date(),
        lines: [{ id: "line-1", productId: "prd-1", quantity: 1 }],
        payments: [],
      },
    ],
  });

  await assert.rejects(
    () =>
      withStore(state, async () => {
        await updateResource("sales-orders", { id: "so-invalid", status: "POSTED", actorId: "approver-1" });
      }),
    WorkflowTransitionError,
  );

  assert.equal(state.businessDocuments[0].status, "DRAFT");
  assert.throws(() => assertTransitionAllowed("sales-orders", "DRAFT", "POSTED"), WorkflowTransitionError);
});

test("return path applies only when rule conditions are satisfied", async () => {
  const sellableState = seedState();

  await withStore(sellableState, async () => {
    await updateResource("stock", {
      id: "bal-1",
      operation: "return",
      quantity: 2,
      approved: true,
      condition: "SELLABLE",
    });
  });

  assert.equal(sellableState.products[0].stockOnHand, 14);
  assert.equal(sellableState.inventoryBalances[0].quantity, 14);

  const damagedState = seedState();
  await withStore(damagedState, async () => {
    await updateResource("stock", {
      id: "bal-1",
      operation: "return",
      quantity: 2,
      approved: true,
      condition: "DAMAGED",
    });
  });

  assert.equal(damagedState.products[0].stockOnHand, 12);
  assert.equal(damagedState.inventoryBalances[0].quantity, 12);

  await assert.rejects(
    () =>
      withStore(seedState(), async () => {
        await updateResource("stock", {
          id: "bal-1",
          operation: "return",
          quantity: 2,
          approved: true,
          condition: "OPENED",
        });
      }),
    InventoryValidationError,
  );
});
