---
name: orry-phase1-backoffice
description: ORRY Serenity Kiss Phase 1 back-office business rules and implementation guardrails. Use when working on ORRY sales, inventory, issue-return, approvals, shipping, dashboard, barcode generation, audit logs, or demo data seeding so stock timing, approval rules, Thai shipment labels, and Phase 1 scope limits stay consistent.
---

# ORRY Phase 1 Back Office

- Deduct stock only when shipment is confirmed as shipped.
- Allow only one shipment per sales order.
- Require approval before issue, return, and stock adjustment affect stock.
- Block creators from approving their own transactions.
- Keep warehouse scope to `MAIN / คลังหลัก` only.
