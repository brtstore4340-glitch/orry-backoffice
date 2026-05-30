import { PrismaClient, ContactType, DocumentKind, DocumentReferenceType, DocumentStatus, LedgerAccountType, PaymentDirection, PaymentMethod, ProductKind, RoleCode } from "@prisma/client";
import { hashPassword } from "../src/lib/security";

const prisma = new PrismaClient();

async function main() {
  await prisma.documentActivity.deleteMany();
  await prisma.documentReference.deleteMany();
  await prisma.documentAttachment.deleteMany();
  await prisma.paymentEntry.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.generalLedgerAccount.deleteMany();
  await prisma.documentLine.deleteMany();
  await prisma.businessDocument.deleteMany();
  await prisma.inventoryBalance.deleteMany();
  await prisma.documentCounter.deleteMany();
  await prisma.product.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  const roles = [
    { code: RoleCode.ADMIN, name: "Administrator" },
    { code: RoleCode.SALES, name: "Sales Lead" },
    { code: RoleCode.FINANCE, name: "Finance Controller" },
    { code: RoleCode.OPERATIONS, name: "Operations Manager" },
    { code: RoleCode.EXECUTIVE, name: "Executive Approver" }
  ];

  for (const role of roles) {
    await prisma.role.create({ data: role });
  }

  const roleMap = Object.fromEntries((await prisma.role.findMany()).map((role) => [role.code, role.id]));

  const admin = await prisma.user.create({
    data: {
      email: "admin@orry.local",
      name: "Ariya Chanin",
      firstName: "Ariya",
      lastName: "Chanin",
      employeeId: "ADM-001",
      dateOfBirth: new Date("1990-04-18"),
      passwordHash: hashPassword("demo-admin"),
      approvalStatus: "APPROVED",
      approvedAt: new Date("2026-03-01"),
      roleId: roleMap.ADMIN
    }
  });

  await prisma.user.create({
    data: {
      email: "finance@orry.local",
      name: "Pim Narin",
      firstName: "Pim",
      lastName: "Narin",
      employeeId: "FIN-001",
      dateOfBirth: new Date("1992-09-09"),
      passwordHash: hashPassword("demo-finance"),
      approvalStatus: "APPROVED",
      approvedAt: new Date("2026-03-01"),
      roleId: roleMap.FINANCE
    }
  });

  const company = await prisma.companyProfile.create({
    data: {
      displayName: "ORRY",
      legalName: "ORRY Commerce Co., Ltd.",
      legalNameEn: "ORRY Commerce Co., Ltd.",
      taxId: "0105558096348",
      phone: "02-114-7788",
      mobile: "099-274-7799",
      email: "ops@orry.co",
      website: "https://orry.co",
      address: "88 Sukhumvit 55, Khlong Tan Nuea, Watthana, Bangkok",
      zipCode: "10110"
    }
  });

  await prisma.companyBranch.create({
    data: {
      companyProfileId: company.id,
      code: "MAIN",
      name: "สำนักงานใหญ่",
      taxBranchCode: "00000",
      isHeadOffice: true,
      phone: company.phone,
      email: company.email,
      address: company.address,
      zipCode: company.zipCode,
      active: true,
    }
  });

  await prisma.companyTaxProfile.create({
    data: {
      companyProfileId: company.id,
      taxId: company.taxId,
      vatRegistered: true,
      defaultVatPercent: 7,
      withholdingPercent: 3,
      branchCode: "00000",
      active: true,
    }
  });

  await prisma.bankAccount.create({
    data: {
      companyProfileId: company.id,
      bankName: "Bangkok Bank",
      accountName: "ORRY Commerce Co., Ltd.",
      accountNumber: "123-4-56789-0",
      branch: "Thong Lo",
      isPrimary: true
    }
  });

  const warehouse = await prisma.warehouse.create({
    data: { code: "MAIN", name: "Main Fulfilment Hub" }
  });

  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        code: "ACCT-001",
        type: ContactType.CUSTOMER,
        displayName: "Luna Atelier",
        legalName: "Luna Atelier Co., Ltd.",
        contactPerson: "Kanya Rung",
        email: "buyer@lunaatelier.co",
        phone: "02-555-2188",
        mobile: "081-222-3011",
        address: "398 Ekkamai Road, Bangkok",
        zipCode: "10110",
        taxId: "1035548891123"
      }
    }),
    prisma.contact.create({
      data: {
        code: "ACCT-002",
        type: ContactType.CUSTOMER,
        displayName: "Maison Ploen",
        legalName: "Maison Ploen Retail Group",
        contactPerson: "Napat Siri",
        email: "merch@maisonploen.com",
        mobile: "089-444-1188",
        address: "22 Rama 4 Road, Bangkok",
        zipCode: "10500"
      }
    }),
    prisma.contact.create({
      data: {
        code: "VEND-001",
        type: ContactType.VENDOR,
        displayName: "Blue Carton Supply",
        legalName: "Blue Carton Supply Co., Ltd.",
        contactPerson: "Preecha Son",
        email: "sales@bluecarton.co",
        address: "55 Bang Na, Bangkok",
        zipCode: "10260"
      }
    })
  ]);

  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: "ORRY-KISS-001",
        name: "Aurora Veil Mist",
        kind: ProductKind.INVENTORY,
        description: "Premium fragrance body mist.",
        barcode: "8851000000011",
        unitLabel: "bottle",
        unitPrice: 1290,
        cost: 520,
        stockOnHand: 148,
        reorderPoint: 40
      }
    }),
    prisma.product.create({
      data: {
        sku: "ORRY-KISS-002",
        name: "Midnight Veil Oil",
        kind: ProductKind.INVENTORY,
        description: "Night repair body oil.",
        barcode: "8851000000028",
        unitLabel: "bottle",
        unitPrice: 1590,
        cost: 640,
        stockOnHand: 62,
        reorderPoint: 30
      }
    }),
    prisma.product.create({
      data: {
        sku: "ORRY-SVC-001",
        name: "Premium Campaign Styling",
        kind: ProductKind.SERVICE,
        description: "Creative direction and launch styling support.",
        unitLabel: "project",
        unitPrice: 18500,
        cost: 8000,
        stockOnHand: 0,
        reorderPoint: 0
      }
    })
  ]);

  for (const product of products.filter((item) => item.kind === ProductKind.INVENTORY)) {
    await prisma.inventoryBalance.create({
      data: {
        warehouseId: warehouse.id,
        productId: product.id,
        quantity: product.stockOnHand
      }
    });
  }

  const counters = [
    { kind: DocumentKind.PROPOSAL, prefix: "PRP" },
    { kind: DocumentKind.SALES_ORDER, prefix: "SO" },
    { kind: DocumentKind.BILLING_RECORD, prefix: "BIL" },
    { kind: DocumentKind.RECEIPT, prefix: "RCT" },
    { kind: DocumentKind.PURCHASE_ORDER, prefix: "PO" },
    { kind: DocumentKind.EXPENSE, prefix: "EXP" }
  ];

  for (const counter of counters) {
    await prisma.documentCounter.create({ data: { ...counter, lastNumber: 12 } });
  }

  const glAccounts = await Promise.all([
    prisma.generalLedgerAccount.create({ data: { code: "1000", name: "Cash and Bank", type: LedgerAccountType.ASSET, balance: 1845000 } }),
    prisma.generalLedgerAccount.create({ data: { code: "1100", name: "Accounts Receivable", type: LedgerAccountType.ASSET, balance: 403820 } }),
    prisma.generalLedgerAccount.create({ data: { code: "2000", name: "Accounts Payable", type: LedgerAccountType.LIABILITY, balance: 208940 } }),
    prisma.generalLedgerAccount.create({ data: { code: "4000", name: "Sales Revenue", type: LedgerAccountType.REVENUE, balance: 1235080 } }),
    prisma.generalLedgerAccount.create({ data: { code: "5100", name: "Freight Expense", type: LedgerAccountType.EXPENSE, balance: 47280 } }),
  ]);

  const proposal = await prisma.businessDocument.create({
    data: {
      documentNumber: "PRP-2026-0013",
      kind: DocumentKind.PROPOSAL,
      status: DocumentStatus.AWAITING_APPROVAL,
      contactId: contacts[0].id,
      ownerId: admin.id,
      issuedAt: new Date("2026-03-24"),
      dueAt: new Date("2026-04-07"),
      creditDays: 14,
      paymentTermLabel: "14 day review window",
      salesOwnerName: admin.name,
      projectName: "Songkran Capsule Launch",
      referenceCode: "CMP-2026-Q2-01",
      notes: "Proposal prepared for retail launch bundle.",
      internalNotes: "Awaiting executive approval before confirmation.",
      subtotalAmount: 44370,
      totalAfterDiscountAmount: 42151.5,
      discountPercent: 5,
      discountAmount: 2218.5,
      vatEnabled: true,
      vatAmount: 2950.61,
      totalAmount: 45102.11,
      lines: {
        create: [
          {
            productId: products[0].id,
            title: products[0].name,
            description: "Launch allocation for flagship shelf placement",
            unitLabel: products[0].unitLabel,
            quantity: 15,
            unitPrice: products[0].unitPrice,
            lineTotal: 19350,
            sortOrder: 0
          },
          {
            productId: products[2].id,
            title: products[2].name,
            description: "Creative direction and pop-up styling",
            unitLabel: products[2].unitLabel,
            quantity: 1,
            unitPrice: products[2].unitPrice,
            lineTotal: 18500,
            sortOrder: 1
          },
          {
            productId: products[1].id,
            title: products[1].name,
            description: "Mid-tier replenishment set",
            unitLabel: products[1].unitLabel,
            quantity: 4,
            unitPrice: products[1].unitPrice,
            lineTotal: 6360,
            sortOrder: 2
          }
        ]
      },
      activities: {
        create: [
          { actorId: admin.id, action: "created", detail: "Proposal draft assembled from campaign brief." },
          { actorId: admin.id, action: "submitted", detail: "Submitted to executive approval queue." }
        ]
      }
    }
  });

  const salesOrder = await prisma.businessDocument.create({
    data: {
      documentNumber: "SO-2026-0013",
      kind: DocumentKind.SALES_ORDER,
      status: DocumentStatus.APPROVED,
      contactId: contacts[0].id,
      ownerId: admin.id,
      issuedAt: new Date("2026-03-25"),
      dueAt: new Date("2026-04-05"),
      creditDays: 10,
      paymentTermLabel: "Dispatch against approved campaign window",
      salesOwnerName: admin.name,
      projectName: "Songkran Capsule Launch",
      referenceCode: proposal.documentNumber,
      notes: "Approved commercial order awaiting warehouse release.",
      subtotalAmount: 42151.5,
      totalAfterDiscountAmount: 42151.5,
      vatEnabled: true,
      vatAmount: 2950.61,
      totalAmount: 45102.11,
      lines: {
        create: [
          {
            productId: products[0].id,
            title: products[0].name,
            unitLabel: products[0].unitLabel,
            quantity: 15,
            unitPrice: products[0].unitPrice,
            lineTotal: 19350,
            sortOrder: 0
          },
          {
            productId: products[2].id,
            title: products[2].name,
            unitLabel: products[2].unitLabel,
            quantity: 1,
            unitPrice: products[2].unitPrice,
            lineTotal: 18500,
            sortOrder: 1
          },
          {
            productId: products[1].id,
            title: products[1].name,
            unitLabel: products[1].unitLabel,
            quantity: 4,
            unitPrice: products[1].unitPrice,
            lineTotal: 6360,
            sortOrder: 2
          }
        ]
      },
      activities: {
        create: [
          { actorId: admin.id, action: "created", detail: "Converted from approved proposal." },
          { actorId: admin.id, action: "approved", detail: "Ready for fulfilment release." }
        ]
      }
    }
  });

  const billing = await prisma.businessDocument.create({
    data: {
      documentNumber: "BIL-2026-0013",
      kind: DocumentKind.BILLING_RECORD,
      status: DocumentStatus.ISSUED,
      contactId: contacts[0].id,
      ownerId: admin.id,
      issuedAt: new Date("2026-03-27"),
      dueAt: new Date("2026-04-10"),
      creditDays: 14,
      paymentTermLabel: "Net 14",
      salesOwnerName: admin.name,
      projectName: "Songkran Capsule Launch",
      referenceCode: salesOrder.documentNumber,
      notes: "Issued after packing confirmation.",
      subtotalAmount: 42151.5,
      totalAfterDiscountAmount: 42151.5,
      vatEnabled: true,
      vatAmount: 2950.61,
      totalAmount: 45102.11,
      lines: {
        create: [
          {
            productId: products[0].id,
            title: products[0].name,
            unitLabel: products[0].unitLabel,
            quantity: 15,
            unitPrice: products[0].unitPrice,
            lineTotal: 19350,
            sortOrder: 0
          },
          {
            productId: products[2].id,
            title: products[2].name,
            unitLabel: products[2].unitLabel,
            quantity: 1,
            unitPrice: products[2].unitPrice,
            lineTotal: 18500,
            sortOrder: 1
          },
          {
            productId: products[1].id,
            title: products[1].name,
            unitLabel: products[1].unitLabel,
            quantity: 4,
            unitPrice: products[1].unitPrice,
            lineTotal: 6360,
            sortOrder: 2
          }
        ]
      },
      activities: {
        create: [
          { actorId: admin.id, action: "created", detail: "Billing package generated from order release." },
          { actorId: admin.id, action: "issued", detail: "Collection team notified." }
        ]
      }
    }
  });

  const receipt = await prisma.businessDocument.create({
    data: {
      documentNumber: "RCT-2026-0009",
      kind: DocumentKind.RECEIPT,
      status: DocumentStatus.PAID,
      contactId: contacts[1].id,
      ownerId: admin.id,
      issuedAt: new Date("2026-03-20"),
      dueAt: new Date("2026-03-20"),
      paymentTermLabel: "Collected on issue",
      salesOwnerName: admin.name,
      projectName: "Retail Restock March",
      referenceCode: "BIL-2026-0007",
      notes: "Collected in full via transfer.",
      subtotalAmount: 23610,
      totalAfterDiscountAmount: 23610,
      vatEnabled: true,
      vatAmount: 1652.7,
      totalAmount: 25262.7,
      lines: {
        create: [
          {
            productId: products[1].id,
            title: products[1].name,
            unitLabel: products[1].unitLabel,
            quantity: 9,
            unitPrice: products[1].unitPrice,
            lineTotal: 14310,
            sortOrder: 0
          },
          {
            productId: products[0].id,
            title: products[0].name,
            unitLabel: products[0].unitLabel,
            quantity: 7,
            unitPrice: products[0].unitPrice,
            lineTotal: 9300,
            sortOrder: 1
          }
        ]
      },
      payments: {
        create: {
          actorId: admin.id,
          direction: PaymentDirection.INBOUND,
          method: PaymentMethod.TRANSFER,
          amount: 25262.7,
          paidAt: new Date("2026-03-20T14:20:00+07:00"),
          referenceNumber: "TRX-884220",
          note: "Collected from Maison Ploen." 
        }
      },
      activities: {
        create: [
          { actorId: admin.id, action: "created", detail: "Receipt created with immediate collection." },
          { actorId: admin.id, action: "paid", detail: "Transfer confirmed by finance." }
        ]
      }
    }
  });

  await prisma.documentReference.createMany({
    data: [
      { sourceDocumentId: salesOrder.id, targetDocumentId: proposal.id, type: DocumentReferenceType.CONVERTED_FROM },
      { sourceDocumentId: billing.id, targetDocumentId: salesOrder.id, type: DocumentReferenceType.CONVERTED_FROM },
      { sourceDocumentId: receipt.id, targetDocumentId: billing.id, type: DocumentReferenceType.RELATED_TO }
    ]
  });

  await prisma.journalEntry.createMany({
    data: [
      {
        id: "jr-001",
        journalNumber: "GL-260401",
        accountId: glAccounts[1].id,
        description: "Invoice posting batch",
        debit: 84500,
        credit: 0,
        status: DocumentStatus.ISSUED,
        createdById: admin.id,
        postedAt: new Date("2026-03-27"),
      },
      {
        id: "jr-002",
        journalNumber: "GL-260402",
        accountId: glAccounts[3].id,
        description: "Sales revenue recognition",
        debit: 0,
        credit: 84500,
        status: DocumentStatus.ISSUED,
        createdById: admin.id,
        postedAt: new Date("2026-03-27"),
      },
      {
        id: "jr-003",
        journalNumber: "GL-260403",
        accountId: glAccounts[2].id,
        description: "Packaging accrual",
        debit: 0,
        credit: 48200,
        status: DocumentStatus.APPROVED,
        createdById: admin.id,
      },
    ],
  });
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
