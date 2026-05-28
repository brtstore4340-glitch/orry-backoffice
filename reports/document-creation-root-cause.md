# Document Creation Root Cause

## Workflow Traced

1. Entry route such as `src/app/(protected)/documents/quotations/new/page.tsx`
2. Shared create UI in `src/components/documents/accounting-document-page.tsx`
3. Submit to `createAccountingModuleDraftAction` in `src/app/(protected)/actions.ts`
4. Draft write in `createDraftDocument` in `src/lib/repository.ts`
5. Post-create redirect and list revalidation through `getModuleDetailRedirect` / `getModuleListRedirect`

## Exact Failure Point

- The database write path was valid.
- The break happened immediately after the write during route resolution.
- `createAccountingModuleDraftAction` passes singular document module keys such as `quotation`, `billing_note`, `cash_invoice`, and `purchase_order`.
- `getModuleDetailRedirect` and `getModuleListRedirect` call `getModuleConfig(moduleKey)`.
- The module registry in `src/lib/accounting/modules.ts` was keyed with plural route ids such as `quotations`, `billing_notes`, `cash_invoices`, and `purchase_orders`.
- Because the lookup missed, actions fell back to generic defaults such as `/documents/${id}` or `/dashboard`.

## Files Involved

- `src/components/documents/accounting-document-page.tsx`
- `src/app/(protected)/actions.ts`
- `src/lib/repository.ts`
- `src/lib/accounting/modules.ts`

## Fix Applied

- Added a central alias map in `src/lib/accounting/modules.ts`.
- `getModuleConfig()` now resolves both the plural registry keys and the singular `DocumentModuleKey` values used by document actions.
- This repairs canonical redirect and revalidation behavior for:
  - draft creation
  - status update
  - duplicate
  - payment recording
  - email/share logging
  - attachment logging

## Remaining Limitation

- The current create form still produces a minimal draft only. It does not yet cover contact selection, product selection, or line-item editing in the create step. Those flows should be the next audit target if “complete document authoring” is required.
