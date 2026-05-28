# Repo Functional Audit

## Scope

- Minimal inventory only from protected navigation and direct document workflow dependencies.
- Deep trace limited to document creation and adjacent document actions.

## Module Summary

| Module | Status | Notes |
| --- | --- | --- |
| Dashboard | Unknown | Not audited beyond navigation entry. |
| Contacts | Unknown | Not required for draft creation because document draft creation auto-selects the first contact when available. |
| Products and Services | Unknown | Not required for initial draft creation path. |
| Document modules | Partial | Draft creation wrote to the database but canonical redirect and list revalidation were resolving against the wrong module registry keys. |
| Inventory receivings | Partial | Shared the same module-registry mismatch for post-create and post-update routing. |
| Settings and Admin | Unknown | Not audited because they did not block document draft creation. |

## Broken or Partial Modules Only

- Document modules:
  - Affected routes: quotations, billing notes, cash invoices, tax invoices, receipts, expenses, purchase orders, inventory receivings.
  - Impact: post-create, post-update, duplicate, payment, email, share, and attachment actions could fall back to generic routes or `/dashboard` instead of canonical module routes.
- Inventory receivings:
  - Same registry mismatch pattern as the document modules.

## Remaining Risk

- The create form currently only creates an initial draft with branch and internal note. Contact selection, product selection, and full line editing were not audited in this pass.
