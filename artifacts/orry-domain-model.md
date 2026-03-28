# ORRY Domain Model

## Core Entities

### Role

- admin
- sales
- finance
- operations
- executive

Purpose:
- permission boundaries and app navigation context

### User

Fields:
- email
- display name
- password hash
- role
- active flag

Purpose:
- protected access and audit attribution

### CompanyProfile

Fields:
- legal name
- display name
- tax id
- branch code
- VAT enabled
- default currency
- address
- phone / email / website
- logo path

Purpose:
- issuer identity on every ORRY document

### BankAccount

Fields:
- bank name
- account name
- account number
- branch
- primary flag

Purpose:
- payout / collection instructions on billing and receipt views

### Contact

Fields:
- code
- type
- legal / display names
- contact person
- email / phone
- address
- tax id
- branch

Purpose:
- customers, vendors, and partners

### Product

Fields:
- SKU
- name
- type
- description
- barcode
- unit label
- unit price
- cost
- stock on hand
- reorder point
- active flag

Purpose:
- catalog, line-item defaults, and inventory signals

### BusinessDocument

Kinds:
- proposal
- sales order
- billing record
- receipt
- purchase order
- expense

Statuses:
- draft
- awaiting approval
- approved
- issued
- fulfilled
- paid
- cancelled

Fields:
- document number
- kind
- status
- contact
- issue date
- due date
- payment due policy
- sales owner
- project
- reference
- notes and internal notes
- tax and discount flags
- subtotal / discount / tax / withholding / deduction / total
- share token metadata

Purpose:
- one reusable document backbone for the full ORRY back-office flow

### DocumentLine

Fields:
- product reference
- item snapshot
- quantity
- unit price
- discount percent
- tax percent
- line total

Purpose:
- portable commercial document lines

### PaymentEntry

Fields:
- document reference
- method
- amount
- paid at
- reference
- note

Purpose:
- receipts, billing settlement, and payout trail

### DocumentAttachment

Fields:
- document reference
- filename
- storage path
- mime type
- file size

Purpose:
- contract files, tax backup, proof of transfer, packaging assets

### DocumentActivity

Fields:
- document reference
- actor
- action
- detail
- timestamp

Purpose:
- audit trail and workflow visibility

### DocumentReference

Fields:
- source document
- target document
- relation type

Purpose:
- quote to order conversion
- order to billing linkage
- billing to receipt linkage

## Derived Views

- dashboard KPIs
- overdue billing
- unpaid billing queue
- pending approvals
- recent activity
- low stock list
- top accounts by value
