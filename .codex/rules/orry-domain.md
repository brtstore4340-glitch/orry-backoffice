# ORRY Domain Rules

Apply this rule whenever a task touches business workflows, inventory, accounting, documents, approvals, shipping, or demo data.

## Phase 1 Guardrails

- Deduct stock only when shipment is actually confirmed as shipped.
- Approval-gated actions must not affect stock or final business state before approval.
- Creators do not approve their own transactions.
- Warehouse scope stays `MAIN / คลังหลัก` unless a wider change is explicitly requested.

## UI And Copy

- Use ORRY terminology already present in the codebase.
- Avoid unrelated external branding or references.
- Keep admin/back-office UX production-safe and consistent with the current app shell.
