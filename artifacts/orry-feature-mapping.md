# ORRY Feature Mapping

| Source concept | ORRY concept | Implementation target |
|---|---|---|
| Contacts | Accounts | `Contact` model, `/contacts`, create/edit actions |
| Products / services | Catalog | `Product` model, `/catalog`, inventory snapshot cards |
| Quotations | Proposals | `BusinessDocument.kind = PROPOSAL`, `/proposals` |
| Tax invoices / cash invoices | Billing records | `BusinessDocument.kind = BILLING_RECORD`, `/billing` |
| Receipts | Collections receipts | `BusinessDocument.kind = RECEIPT`, `/receipts` |
| Purchase orders | Supply orders | `BusinessDocument.kind = PURCHASE_ORDER`, `/orders?scope=supply` |
| Expense documents | Spend records | `BusinessDocument.kind = EXPENSE`, `/payments` and detail surfaces |
| Billing notes | Adjustment notes | scaffold via document kind + activity trail |
| Withholding tax docs | Tax retention records | schema field set + future document subtype scaffold |
| Receiving inventory | Intake operations | settings/domain scaffold via warehouse + stock balance |
| Payment receiving / paid | Collection and payout entries | `PaymentEntry` model and detail panels |
| Company information | ORRY legal profile | `CompanyProfile` model, `/settings` |
| Bank accounts | Settlement accounts | `BankAccount` model, `/settings` |
| Attachments | Linked files | `DocumentAttachment` model + storage-ready metadata |
| Email document | Dispatch action | `DocumentActivity` action trail, future workflow/send service |
| Share document | Secure share link | `shareToken`, `sharedAt`, future public route scaffold |
| Status transitions | Stage control | server action `updateDocumentStatusAction` |
| Document references / upgrades | Related records | `DocumentReference` model |
| Sort / filter / paging | Operational lists | server-side filters and list summaries |

## Naming Principles

- Replace accounting-product wording with ORRY commerce operations wording.
- Keep legal meaning where it matters for receipts, tax, and billing.
- Use ORRY-owned route names and labels:
  - proposal
  - sales order
  - billing record
  - collection receipt
  - payment
  - account
  - catalog
  - settlement account

## Scope Chosen For This Pass

Fully implemented:
- dashboard
- accounts
- catalog
- proposals
- sales orders
- billing records
- receipts
- payments
- settings
- document detail view
- seed-backed document workflow states
- Prisma schema and seed

Scaffolded for future completion:
- attachment upload to Supabase Storage
- public share routes
- outbound email sending
- advanced Thai tax retention workflows
- purchase order / expense dedicated entry flows
