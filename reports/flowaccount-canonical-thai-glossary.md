# FlowAccount Canonical Thai Glossary For ORRY

> Source basis: FlowAccount OpenAPI SDK domain categories plus FlowAccount help-center/menu terminology for Thai accounting usage
> Date: 2026-03-31

## Canonical English -> Thai Terms

| English / source concept | Canonical Thai for ORRY | Notes |
|---|---|---|
| Authentication | การเข้าสู่ระบบ / สิทธิ์การใช้งาน | Keep admin UI wording task-based, not API-jargon-heavy. |
| Users | ผู้ใช้งาน | Kept as-is. |
| Approval Requests | คำขออนุมัติ | Kept as-is. |
| Contacts | ผู้ติดต่อ | Kept as-is. |
| Partner | คู่ค้า | Prefer Thai business term over transliterated `พาร์ทเนอร์`. |
| Bank Account | บัญชีธนาคาร | Kept as-is. |
| Bank account mapping | การจับคู่ช่องทางรับ-จ่ายเงิน | Replaces raw English `mapping`. |
| Billing Notes | ใบวางบิล/ใบแจ้งหนี้ | FlowAccount groups this concept together; ORRY now mirrors that terminology. |
| Cash Invoice | เอกสารขายเงินสด | Replaces over-literal `ใบแจ้งหนี้เงินสด`. |
| Tax Invoice | ใบกำกับภาษี | Kept as-is. |
| Receipt | ใบเสร็จรับเงิน | Kept as-is. |
| Expense | ค่าใช้จ่าย | Prefer standard accounting term over `รายจ่าย` for this product context. |
| Purchase Order | ใบสั่งซื้อ | Kept as-is. |
| Withholding Tax | ภาษีหัก ณ ที่จ่าย | Kept as-is. |
| Business Information | ข้อมูลบริษัท | Retained in UI because ORRY pages are specifically company-profile centric, even though FlowAccount also uses broader business-settings language. |
| Record receipt / receive payment | บันทึกการรับชำระเงิน | Replaces shortened `บันทึกรับชำระ`. |
| Contact overview | ภาพรวมผู้ติดต่อ | Replaces awkward literal phrasing. |
| Contact directory | รายชื่อผู้ติดต่อ | Replaces awkward `ไดเรกทอรีผู้ติดต่อ`. |

## Governance

- Shared terminology constants live in `src/lib/thai-terminology.ts`.
- Future edits should update shared constants first, then page-local wording only where context truly differs.
- Use FlowAccount as domain terminology reference only. Do not surface FlowAccount branding in ORRY UI.
