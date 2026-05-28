# Document Authoring Verification

## Scope

- Reused the existing shared document workflow only:
  - `src/app/(protected)/documents/*/new/page.tsx`
  - `src/components/documents/accounting-document-page.tsx`
  - `src/app/(protected)/actions.ts`
  - `src/lib/repository.ts`
  - `src/lib/accounting/modules.ts`

## Verification Result By Step

| Step | Status | Result |
| --- | --- | --- |
| 1. Open real `/documents/*/new` route | Verified by build | Route compiles and is emitted for each document module. |
| 2. Submit create draft | Verified by code path | Form posts to `createAccountingModuleDraftAction` and persists through `createDraftDocument`. |
| 3. Redirect lands on canonical route | Fixed and code-verified | Central module aliasing now resolves singular action keys to canonical plural module routes. |
| 4. Created document can be opened | Verified by code path | Detail redirects resolve to module detail routes and detail pages load through `getAccountingDocument`. |
| 5. Contact selection/load works | Fixed and code-verified | Added contact selector on detail page and server action to update `contactId`. Existing contact load already worked. |
| 6. Product selection/load works | Fixed and code-verified | Added product picker on detail page backed by `getProducts()` and product-backed line creation. |
| 7. Line-item create/update/save works | Fixed and code-verified | Added server actions and repository mutations for line create/update with total recalculation. |
| 8. List/detail refresh reflects saved changes | Fixed and code-verified | New authoring actions revalidate both module list and detail paths, then redirect back to detail. |

## Exact Break Points Found

1. Post-create routing had already been fixed in the previous pass by aliasing module keys.
2. Real authoring after draft creation was missing:
   - no contact editor on the detail path
   - no product selector
   - no line-item write path
   - no total recalculation after line changes

## Fix Applied

- Added document contact update support.
- Added product-backed document line creation.
- Added inline document line update support.
- Added shared document total recalculation after line mutations.
- Revalidated both list and detail routes after authoring changes.

## Remaining Limitation

- This pass is code-verified, not browser-confirmed. A live authenticated browser run was not available in this session.
- There is still no line deletion flow.
- Product selection is add-first, not a richer editable line-item grid.

## Commands Run

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

## Validation Notes

- `npx tsc --noEmit`: passed
- `npm run build`: passed
- `npm run lint`: failed due a repo-level ESLint/tooling issue, not due to the document authoring changes
