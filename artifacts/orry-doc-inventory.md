# ORRY Source Doc Inventory

## Scope

Primary source scanned:
`source generated docs corpus/`

The folder is a generated API/model corpus rather than a hand-written product spec. Most files fall into one of two groups:
- API family docs (`*Api.md`) that define list/get/create/update/delete/status/payment/share/email/attachment workflows.
- Model docs (`*.md`) that describe common document payloads, line items, payments, contacts, company info, bank accounts, and response envelopes.

## Inventory By Feature Area

### Authentication

- `AuthenticationApi.md`
- `AuthenResponse.md`

Purpose:
- API-level authentication and access token flow.

Inputs / outputs:
- credentials in
- auth response out

Implementation takeaways:
- ORRY needs protected routes and role-aware session handling.

### Business Profile And Master Data

- `BusinessInfomationApi.md`
- `CompanyInfo.md`
- `CompanyInfoResponse*.md`
- `BusinessCategory*.md`
- `BankAccountApi.md`
- `BankAccount*.md`

Purpose:
- maintain company profile, business type, branch, tax profile, website, and bank accounts

Required fields observed:
- company type
- Thai tax id
- company names
- addresses
- branch labels and codes
- phone/mobile/fax
- website
- bank account metadata

Implementation takeaways:
- ORRY needs a company profile module, payout/collection accounts, and tax-ready legal identity fields.

### Contacts

- `ContactsApi.md`
- `Contact.md`
- `ContactResponse*.md`

Purpose:
- create, update, list, filter, and delete customer or supplier records

Required fields observed:
- contact code
- local/company name
- contact person
- email
- phone
- contact type
- address and tax info

Lifecycle:
- create
- update
- list/filter/sort
- delete

Implementation takeaways:
- ORRY needs a reusable party model for customers, vendors, and decision contacts.

### Product Catalog

- `ProductsApi.md`
- `Product.md`
- `ProductItem.md`
- `ProductService.md`
- `ProductNonInventory.md`
- `ProductInventory.md`
- `ProductInventoryBalance.md`
- `ProductType.md`
- `ProductResponse*.md`
- `SimpleProductItem.md`
- `InlineProductItem*.md`
- expense product item variants

Purpose:
- manage products and services
- track inventory balances
- attach catalog items to documents

Required fields observed:
- code / SKU / barcode
- product type
- category filter
- line item unit/quantity/price/discount

Implementation takeaways:
- ORRY needs inventory-aware products, service items, catalog search, and line-item snapshots.

### Core Sales Documents

- `QuotationsApi.md`
- `TaxInvoiceApi.md`
- `CashInvoiceApi.md`
- `ReceiptApi.md`
- `BillingNotesApi.md`
- `PurchaseOrderApi.md`
- `ExpensesApi.md`
- `WithholdingTaxApi.md`
- `ReceivingInventoryApi.md`

Purpose:
- manage the full document lifecycle for commercial and accounting records

Common workflow verbs found across APIs:
- list all documents with paging
- filter and sort
- get one document
- create simple form
- create inline-discount / inline-vat form
- edit while awaiting or pending
- delete only in specific statuses
- change document status
- add attachment
- email document
- share document
- create payment / mark paid for eligible document kinds

Implementation takeaways:
- ORRY should centralize documents under one business-document core with kind-specific behavior.

### Shared Document Models

- `Document.md`
- `SimpleDocument.md`
- `InlineDocument.md`
- expense equivalents
- update equivalents
- response envelope variants
- `StatusDocument.md`
- `DocumentResponse.md`
- `AllDocumentResponse*.md`
- `ShareDocument*.md`
- `SendEmail*.md`
- `AttachmentResponse*.md`
- `DeleteResponse*.md`
- `ReferencedByMe.md`
- `ReferencedToMe.md`
- `UpgradeDocument.md`

Purpose:
- define common document fields and shared lifecycle mechanics

Entity names repeatedly present:
- contact
- document
- line item
- payment
- company
- attachment
- share link
- email copies
- status
- reference / upgraded-from document

Common fields observed in `Document.md` / `SimpleDocument.md`:
- contact code / name / address / tax id / branch / person / email / number / zip
- published date
- credit type and credit days
- due date
- salesperson name
- project name
- reference number
- VAT inclusion flag
- subtotal
- document-level discount percent and amount
- total after discount
- VAT flag and VAT amount
- grand total
- withholding tax visibility / percent / amount
- document deduction type and amount
- remarks
- internal notes
- signature / stamp visibility
- line items
- document references

### Payments

- `PaymentReceiving*.md`
- `PaymentPaid*.md`
- simple/inline-with-payment variants

Purpose:
- record inbound and outbound payments
- support cash, transfer, credit card, and cheque modes

Implementation takeaways:
- ORRY needs payment ledger entries linked to documents, with payment method, amount, paid date, and note.

## Status And Lifecycle Findings

Representative transitions seen in source docs:
- quotation: `awaiting`, `approved`, `approvedandprocessed`, `rejected`
- receipt: `awaiting`, `paid`, `void`
- tax invoice: `awaiting`, `invoicedelivered`, `paid`, `void`
- delete allowed only in limited pending/awaiting states
- edit allowed only before the document advances
- attachments, email, and share links are side workflows on top of a document

## Calculation Rules Found

Repeated numeric rules across common document models:
- subtotal from line items
- document-level percentage or absolute discount
- total after discount
- optional VAT 7%
- grand total
- optional withholding tax
- optional document-level deduction / rounding / fee adjustments

## ORRY Implication

The source corpus is best represented as:
- one reusable party model
- one reusable product model
- one unified document core with typed document kinds
- line items, payments, attachments, activities, and references as supporting tables
- company profile and bank accounts as settings/master data
