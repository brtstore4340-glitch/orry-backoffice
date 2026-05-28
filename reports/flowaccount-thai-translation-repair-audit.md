# FlowAccount Thai Translation Repair Audit

> Repository: ORRY Serenity Kiss B2B Back Office
> Date: 2026-03-31
> Method: inventory existing Thai labels in ORRY, compare against FlowAccount domain/menu terminology, patch only incorrect or inconsistent terms

## Areas Reviewed

- Authentication
- Bank Account
- Billing Notes
- Business Information
- Cash Invoice
- Contacts
- Expenses
- Tax Invoice
- Receipt
- Purchase Order
- Withholding Tax

## Repair Table

| Source concept / domain | Current ORRY Thai label | Corrected Thai label | Why current label was wrong | Files changed |
|---|---|---|---|---|
| Billing Notes | ใบวางบิล | ใบวางบิล/ใบแจ้งหนี้ | FlowAccount groups this document concept as billing note / invoice, so the old label was too narrow and inconsistent with the domain grouping. | `src/lib/orry-labels.ts`, `src/lib/accounting/dictionaries.ts`, `src/lib/accounting/modules.ts`, `src/lib/accounting-documents.ts`, `src/app/(protected)/settings/bank-accounts/[id]/page.tsx`, `src/lib/demo-data.ts` |
| Cash Invoice | ใบแจ้งหนี้เงินสด | เอกสารขายเงินสด | The old term was a literal calque; FlowAccount’s Thai terminology uses the standard cash-sales document wording. | `src/lib/orry-labels.ts`, `src/lib/accounting/dictionaries.ts`, `src/lib/accounting/modules.ts`, `src/lib/accounting-documents.ts`, `src/lib/thai-terminology.ts` |
| Expense | รายจ่าย | ค่าใช้จ่าย | `รายจ่าย` is understandable but less aligned with FlowAccount’s expense/category terminology and caused inconsistency across document descriptions. | `src/lib/orry-labels.ts`, `src/lib/accounting/dictionaries.ts`, `src/lib/accounting/modules.ts`, `src/lib/accounting-documents.ts`, `src/app/(protected)/contacts/new/page.tsx`, `src/lib/demo-data.ts`, `src/lib/thai-terminology.ts` |
| Partner contact type | พาร์ทเนอร์ | คู่ค้า | `พาร์ทเนอร์` was a transliteration and inconsistent with surrounding business terminology. | `src/lib/orry-labels.ts`, `src/app/(protected)/contacts/page.tsx`, `src/app/(protected)/contacts/new/page.tsx`, `src/app/(protected)/contacts/[id]/edit/page.tsx`, `src/lib/thai-terminology.ts` |
| Receive payment action | บันทึกรับชำระ | บันทึกการรับชำระเงิน | The old phrase was shortened and inconsistent with the full payment wording used in FlowAccount’s accounting flows. | `src/lib/orry-labels.ts`, `src/lib/accounting/dictionaries.ts`, `src/lib/accounting/modules.ts`, `src/lib/accounting-documents.ts`, `src/components/documents/accounting-document-page.tsx`, `src/lib/repository.ts`, `src/lib/thai-terminology.ts` |
| Bank account mapping | mapping | การจับคู่ช่องทางรับ-จ่ายเงิน | Raw English leaked into Thai UI copy. | `src/lib/accounting/modules.ts`, `src/app/(protected)/settings/bank-accounts/page.tsx`, `src/lib/thai-terminology.ts` |
| Contacts overview header | สุขภาพบัญชีผู้ติดต่อ | ภาพรวมผู้ติดต่อ | The old wording was too literal and used `บัญชี` in the wrong sense. | `src/app/(protected)/contacts/page.tsx`, `src/lib/thai-terminology.ts` |
| Contacts list header | ไดเรกทอรีผู้ติดต่อ | รายชื่อผู้ติดต่อ | The old term was a direct English calque and unnatural in Thai product UI. | `src/app/(protected)/contacts/page.tsx`, `src/lib/thai-terminology.ts` |
| Expense reference label | อ้างอิงรายจ่าย | อ้างอิงค่าใช้จ่าย | Needed to match the corrected canonical expense term. | `src/lib/accounting-documents.ts` |
| Billing note demo/dashboard hint | ใบวางบิล | ใบวางบิล/ใบแจ้งหนี้ | Demo and dashboard copy needed to match the corrected canonical term. | `src/lib/demo-data.ts` |
| Company settings eyebrow | Settlement | Bank Accounts | English eyebrow did not match the bank-account context of the section. | `src/app/(protected)/settings/company/page.tsx` |

## Canonicalization Summary

- Shared repeated domain terms were centralized in `src/lib/thai-terminology.ts`.
- Existing central label sources were repaired instead of broad UI rewrites.
- Page-local strings were patched only where the wording was clearly wrong, too literal, or inconsistent with the canonical terms.

## Translation Governance

See `docs/thai-translation-governance.md`.
