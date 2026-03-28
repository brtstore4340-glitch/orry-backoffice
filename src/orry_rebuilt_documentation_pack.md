# ORRY Serenity Kiss B2B Back Office
## Rebuilt Documentation Pack

เวอร์ชันเอกสาร: 1.0  
วันที่อัปเดต: 29 มีนาคม 2026  
สถานะ: Rebuilt after product redesign  

---

# 1) Executive Summary

ORRY Serenity Kiss B2B Back Office เป็นระบบจัดการงานขาย B2B และคลังสินค้า สำหรับรองรับการทำงานของทีมขาย ทีมปฏิบัติการ และผู้อนุมัติ ภายใต้แนวคิด **เรียบง่าย ใช้งานจริงก่อน ขยายได้ภายหลัง** โดย Phase 1 มุ่งเน้นการทำงานที่จำเป็นต่อการขาย การอนุมัติ การตัดสต็อก การจัดส่ง และการติดตามสถานะงานแบบครบวงจร

ระบบนี้ถูกออกแบบใหม่โดยยึดหลักดังนี้:
- เริ่มจากข้อมูลใหม่ ไม่แบกข้อจำกัดจากระบบเดิม
- ใช้งานบนเว็บและรองรับมือถือ
- เชื่อมฐานข้อมูลผ่าน Supabase
- รองรับการขยายในอนาคตโดยไม่ต้องรื้อโครงสร้างหลัก
- ทำให้ผู้ใช้งานเห็นสถานะงานจริงแบบชัดเจน ลดงานตกหล่น ลดความสับสน และตรวจสอบย้อนหลังได้

---

# 2) Product Vision

สร้างระบบ Back Office ที่ทำให้ ORRY สามารถควบคุมวงจร B2B ได้ครบตั้งแต่รับคำสั่งซื้อ กำหนดราคา อนุมัติ จัดสินค้า จัดส่ง ตัดสต็อก รับคืน และติดตามงานค้าง โดยใช้โครงสร้างข้อมูลและสิทธิ์ที่พร้อมต่อยอดเป็นระบบขนาดใหญ่ในอนาคต

---

# 3) Scope Overview

## In Scope (Phase 1)
- Authentication และ role-based access
- Dashboard ภาพรวมงานขาย คลัง อนุมัติ และจัดส่ง
- Master data พื้นฐาน
- สินค้าและคลังหลัก
- ลูกค้าแบบบุคคลทั่วไปและบริษัท
- Sales Order
- กำหนดราคาต่อออเดอร์
- การชำระเงินก่อนจัดส่ง
- Workflow อนุมัติ 1 ขั้น
- การหยิบ/จัดเตรียม/จัดส่งสินค้า
- ตัดสต็อกเมื่อยืนยันการจัดส่ง
- คืนสินค้า
- ปรับสต็อก
- Low-stock alert
- Audit trail และประวัติรายการ
- รองรับ mobile usage

## Out of Scope (Phase 1)
- Multi-warehouse
- Lot / Expiry / Serial tracking
- Auto price tier
- Partial shipment ต่อ 1 Sales Order
- Advanced accounting integration แบบเต็มรูปแบบ
- Procurement / purchase order
- CRM เชิงลึก
- Commission system

---

# 4) Business Rules (Source of Truth)

## 4.1 Product / SKU
Phase 1 ใช้สินค้า 3 SKU เป็นหลัก:
- Bleez 1666
- Whisper 1666
- Velvet 1668

## 4.2 Warehouse
- ใช้คลังเดียวชื่อ **คลังหลัก**
- โครงสร้างต้องเผื่อรองรับหลายคลังในอนาคต

## 4.3 Barcode
รูปแบบบาร์โค้ดภายใน:
- ORRY-BLE-000001
- ORRY-WHI-000001
- ORRY-VEL-000001

โดย prefix อ้างอิงจากสินค้า:
- BLE = Bleez
- WHI = Whisper
- VEL = Velvet

## 4.4 Customer Groups
มี 2 กลุ่มหลัก:
- General
- Company

## 4.5 Tax Information
- กรอกข้อมูลภาษีเฉพาะกรณีต้องออกเอกสาร/ใบกำกับภาษี
- ลูกค้าทั่วไปไม่จำเป็นต้องกรอกเสมอไป

## 4.6 Payment Rule
- ต้องชำระเงินก่อนจัดส่งสินค้า
- ระบบต้องไม่อนุญาตให้ยืนยันจัดส่งถ้ายังไม่ผ่านสถานะชำระเงิน

## 4.7 Pricing
- ราคากำหนดได้ต่อออเดอร์
- ไม่มีระบบ price tier อัตโนมัติใน Phase 1

## 4.8 Stock Deduction
- ตัดสต็อกตอน **ยืนยันการจัดส่ง** เท่านั้น
- ห้ามตัดสต็อกตอนสร้าง Sales Order

## 4.9 Issue Purposes
การเบิกสินค้าใช้ได้ 2 วัตถุประสงค์:
- Sales
- Marketing

ถ้าเป็น Marketing ต้องระบุ campaign หรือ event เสมอ

## 4.10 Return Conditions
รองรับเหตุผล/สภาพการคืน:
- Normal
- Damaged
- Opened
- Unsellable

## 4.11 Roles
- ADMIN
- OPERATOR
- APPROVER

กติกา:
- ใช้การอนุมัติ 1 ขั้น
- ผู้อนุมัติแทนกันได้
- ผู้สร้างรายการห้ามอนุมัติรายการของตัวเอง

## 4.12 Approval Requirement
ต้องผ่านอนุมัติก่อนในรายการที่มีผลต่อสต็อก:
- Issue
- Return
- Stock Adjustment

## 4.13 Shipping Status
สถานะจัดส่งมาตรฐาน:
- รอจัดส่ง
- จัดเตรียมสินค้า
- ส่งแล้ว
- อยู่ระหว่างขนส่ง
- ส่งถึงแล้ว
- จัดส่งไม่สำเร็จ
- ยกเลิก

## 4.14 Shipment Policy
- 1 Sales Order จัดส่งได้ 1 ครั้งใน Phase 1

## 4.15 Low Stock Alert
ระดับแจ้งเตือน:
- <= 50%
- <= 30%
- <= 20%

---

# 5) User Roles and Permissions

## ADMIN
หน้าที่หลัก:
- จัดการผู้ใช้และสิทธิ์
- ตั้งค่าระบบ
- จัดการสินค้า ลูกค้า และข้อมูลหลัก
- ดูรายงานทั้งหมด
- สร้างและแก้ไข stock adjustment / return / issue
- เข้าถึง audit trail

## OPERATOR
หน้าที่หลัก:
- สร้างลูกค้า
- สร้าง Sales Order
- บันทึกการชำระเงิน
- เตรียมสินค้า
- อัปเดตสถานะจัดส่ง
- สร้างรายการ issue / return / stock adjustment เพื่อส่งอนุมัติ

ข้อจำกัด:
- ไม่อนุมัติรายการที่ต้อง approve
- ไม่เข้าถึง setting ระดับระบบสำคัญ

## APPROVER
หน้าที่หลัก:
- ตรวจสอบและอนุมัติรายการ stock-affecting
- ปฏิเสธรายการพร้อมเหตุผล
- ตรวจสอบประวัติและความเสี่ยง

ข้อจำกัด:
- ผู้สร้างรายการห้ามอนุมัติรายการของตัวเอง

---

# 6) Functional Modules

## 6.1 Authentication & Access Control
- Login / Logout
- Session management
- Role-based menu visibility
- Route protection
- Action-level permission control

## 6.2 Dashboard
แสดงข้อมูลสำคัญ:
- ยอดขาย
- Inventory summary
- Pending approvals
- Pending shipments
- Low-stock alerts

## 6.3 User Management
- สร้าง/แก้ไข/ปิดการใช้งานผู้ใช้
- กำหนด role
- Reset สถานะการเข้าถึง

## 6.4 Product Management
- จัดการ SKU
- ชื่อสินค้า รหัสสินค้า หมวดหมู่ หน่วยนับ สถานะใช้งาน
- จุดเตือนสต็อกขั้นต่ำ
- รองรับ internal barcode

## 6.5 Customer Management
- ลูกค้าทั่วไป / บริษัท
- ข้อมูลติดต่อ
- เลขผู้เสียภาษี (กรณีจำเป็น)
- ที่อยู่จัดส่ง / ที่อยู่ออกเอกสาร

## 6.6 Sales Order Management
- สร้างออเดอร์
- เพิ่มรายการสินค้า
- กำหนดราคาต่อรายการ
- คำนวณยอดรวม
- ติดตามสถานะการชำระเงิน
- เชื่อมโยงการจัดส่ง

## 6.7 Payment Tracking
- ระบุสถานะชำระเงิน
- เก็บหลักฐาน/หมายเหตุ
- บล็อกการจัดส่งหากยังไม่ชำระ

## 6.8 Fulfillment / Shipment
- เปลี่ยนสถานะจัดส่ง
- จัดเตรียมสินค้า
- ยืนยันจัดส่ง
- ตัดสต็อกตอนยืนยันจัดส่ง
- รองรับบันทึกเลขพัสดุ/หมายเหตุ

## 6.9 Inventory Movement
- Stock issue
- Return
- Stock adjustment
- Approval workflow
- Inventory ledger

## 6.10 Audit Trail
- บันทึกทุก action สำคัญ
- ใครทำ เมื่อไร ทำอะไร กับรายการใด
- รองรับการตรวจย้อนหลัง

---

# 7) Key Workflows

## 7.1 Sales Order Flow
1. OPERATOR สร้างลูกค้าหรือเลือกจากฐานข้อมูล
2. สร้าง Sales Order
3. เพิ่มสินค้าและกำหนดราคาต่อออเดอร์
4. ตรวจสอบยอดรวม
5. บันทึกสถานะการชำระเงิน
6. เมื่อชำระแล้ว จึงเข้าสู่ขั้นตอนจัดส่ง
7. เปลี่ยนสถานะเป็น รอจัดส่ง / จัดเตรียมสินค้า
8. ยืนยันจัดส่ง
9. ระบบตัดสต็อก
10. ติดตามสถานะจนส่งถึงแล้วหรือปิดงาน

## 7.2 Stock Issue Flow
1. OPERATOR สร้างรายการเบิก
2. ระบุวัตถุประสงค์ Sales หรือ Marketing
3. ถ้า Marketing ต้องระบุ campaign/event
4. ส่งให้ APPROVER อนุมัติ
5. เมื่ออนุมัติแล้วจึงให้รายการมีผลต่อสต็อก
6. บันทึก inventory movement และ audit trail

## 7.3 Return Flow
1. สร้างรายการรับคืน
2. ระบุออเดอร์อ้างอิงและเงื่อนไขสินค้า
3. ส่งอนุมัติ
4. เมื่ออนุมัติแล้วจึงปรับสต็อก
5. เก็บเหตุผลและหมายเหตุครบถ้วน

## 7.4 Stock Adjustment Flow
1. OPERATOR สร้างคำขอปรับสต็อก
2. ระบุเหตุผลและจำนวน
3. ส่ง APPROVER
4. APPROVER อนุมัติหรือปฏิเสธ
5. เมื่ออนุมัติจึงอัปเดต stock ledger

---

# 8) Data Model Overview

## Core Entities
- users
- roles
- products
- warehouses
- inventory_balances
- inventory_movements
- customers
- customer_addresses
- sales_orders
- sales_order_items
- payments
- shipments
- shipment_events
- approval_requests
- returns
- return_items
- stock_adjustments
- audit_logs
- marketing_campaigns

## Key Entity Notes

### users
เก็บข้อมูลผู้ใช้งานและสถานะ active/inactive

### products
เก็บ SKU, ชื่อ, หมวดหมู่, barcode ภายใน, reorder threshold

### warehouses
Phase 1 มี 1 รายการคือ คลังหลัก แต่ schema ต้องรองรับหลายคลัง

### inventory_balances
คงเหลือต่อสินค้า ต่อคลัง

### inventory_movements
เก็บการเคลื่อนไหวทุกประเภท เช่น shipment, issue, return, adjustment

### customers
เก็บประเภทลูกค้า general/company และข้อมูลภาษีตามจำเป็น

### sales_orders
หัวเอกสารคำสั่งซื้อ

### sales_order_items
รายการสินค้าในแต่ละออเดอร์

### payments
เก็บสถานะการชำระและหลักฐานอ้างอิง

### shipments
ข้อมูลการจัดส่งของออเดอร์

### approval_requests
คำขออนุมัติสำหรับรายการที่กระทบสต็อก

### returns
ข้อมูลการรับคืนสินค้า

### stock_adjustments
คำขอปรับสต็อก

### audit_logs
บันทึกการใช้งานย้อนหลัง

---

# 9) Suggested Database Rules

## Referential Integrity
- sales_order_items ต้องอ้างอิง sales_orders และ products
- shipments ต้องอ้างอิง sales_orders
- inventory_movements ต้องอ้างอิง products และ warehouses
- approval_requests ต้องมี target_type และ target_id ชัดเจน

## Important Constraints
- creator_id ต้องไม่เท่ากับ approver_id สำหรับ approval records
- shipment confirmation ทำได้เฉพาะออเดอร์ที่ payment_status = paid
- 1 sales_order มีได้ไม่เกิน 1 shipment ใน Phase 1
- marketing issue ต้องมี campaign/event reference

## Soft Delete Preference
- สำหรับ master data ใช้ soft delete หรือ inactive status
- สำหรับ transactional data หลีกเลี่ยง hard delete

---

# 10) API / Service Design Principles

- ใช้ Supabase เป็น data backend
- แยก service ตาม domain เช่น auth, products, customers, orders, inventory, approvals, shipments
- ทุก write action สำคัญต้องมี validation ฝั่ง server
- ห้ามเชื่อถือ role/permission จาก client เพียงอย่างเดียว
- ใช้ RLS และ service-layer guard ร่วมกัน
- ทุก action สำคัญควรสร้าง audit log

ตัวอย่าง endpoint/domain actions ที่ควรมี:
- auth.login
- users.list / create / update / deactivate
- products.list / create / update
- customers.list / create / update
- orders.create / get / update / markPaid
- shipments.prepare / dispatch / updateStatus / deliver / cancel
- inventory.issue / return / adjust
- approvals.submit / approve / reject
- dashboard.summary

---

# 11) UI / UX Guidelines

## Design Direction
- Luxury clean interface
- Modern feminine premium tone
- Focus on readability and operational clarity
- ใช้งานง่ายทั้ง desktop และ mobile

## UX Principles
- งานค้างต้องเห็นชัด
- สถานะต้องอ่านแล้วเข้าใจทันที
- ปุ่ม action ต้องสัมพันธ์กับสิทธิ์และสถานะ
- ฟอร์มยาวต้องแบ่ง section ชัดเจน
- มี validation และ helper text ที่จำเป็น
- หน้า dashboard ต้องพาไปยังงานค้างได้เร็ว

## Core Screens
- Login
- Dashboard
- User Management
- Product Management
- Customer Management
- Sales Orders List / Detail / Create
- Shipment Board / Detail
- Approval Queue
- Inventory Movement History
- Return Management
- Stock Adjustment
- Audit Log Viewer
- Settings

---

# 12) Security and Governance

- ใช้ authentication มาตรฐานผ่าน Supabase
- บังคับ row-level security ตาม role และ domain
- แยกสิทธิ์การดูและแก้ไขข้อมูล
- บันทึก audit log สำหรับ action สำคัญ
- ซ่อนข้อมูลอ่อนไหวที่ไม่จำเป็น
- ป้องกันการอนุมัติรายการของตนเอง
- ต้องมี validation ซ้ำที่ server-side

---

# 13) Reporting Requirements

Dashboard และ report ชุดแรกควรมี:
- ยอดขายรวมตามช่วงเวลา
- จำนวนออเดอร์รอชำระ / รอจัดส่ง
- สินค้าใกล้หมด
- รายการรออนุมัติ
- ประวัติการเคลื่อนไหวสต็อก
- รายการส่งไม่สำเร็จ
- สรุปการคืนสินค้า

---

# 14) Non-Functional Requirements

## Performance
- หน้า dashboard ควรโหลดเร็วและสรุปข้อมูลได้ภายในไม่กี่วินาที
- รายการหลักควรรองรับ pagination และ filtering

## Reliability
- transaction สำคัญต้องไม่ทำให้สต็อกเพี้ยน
- action ที่มีผลต่อ stock ต้องตรวจสอบซ้ำทุกครั้ง

## Scalability
- รองรับการเพิ่ม warehouse, SKU, approval complexity, accounting integration ในอนาคต

## Maintainability
- แยกโค้ดตาม domain
- ตั้งชื่อชัดเจน
- หลีกเลี่ยง hard-coded business logic ที่แก้ยาก

## Mobile Support
- รองรับ responsive layout
- ใช้งานงานหลักจากมือถือได้ เช่น ดู dashboard, เปลี่ยนสถานะ, อนุมัติ

---

# 15) Phase Plan

## Phase 1
เป้าหมาย:
- ระบบใช้งานขาย B2B และจัดการ stock พื้นฐานได้จริง
- ทำงานครบ flow หลัก
- มี dashboard, approvals, shipment, audit

## Phase 2 (Suggested)
- Multi-warehouse
- Partial shipment
- Lot/expiry support
- Price tier / contract pricing
- Invoice/tax document integration
- CRM notes / sales activities
- Analytics เชิงลึก

---

# 16) UAT Acceptance Criteria

ระบบจะถือว่าพร้อมเดโม/พร้อมใช้งานเมื่อ:
- Login และ role access ทำงานถูกต้อง
- สร้างสินค้า ลูกค้า และ Sales Order ได้
- กำหนดราคาต่อออเดอร์ได้
- ไม่สามารถจัดส่งถ้ายังไม่ชำระเงิน
- ยืนยันจัดส่งแล้วตัดสต็อกได้ถูกต้อง
- Issue / Return / Adjustment ต้องผ่าน approval
- ผู้สร้างรายการอนุมัติเองไม่ได้
- Dashboard แสดง pending approvals / shipments / low stock ได้
- Mobile layout ใช้งาน action สำคัญได้
- มี audit trail ย้อนหลัง

---

# 17) Open Implementation Notes

สิ่งที่ควรเตรียมตั้งแต่แรกแม้ยังไม่เปิดใช้ทั้งหมด:
- รองรับการเพิ่มหลายคลังใน schema
- รองรับ lot/expiry/serial ในอนาคตโดยไม่ชน schema หลัก
- รองรับ integration กับเอกสารภาษี/บัญชีในอนาคต
- ทำ enum และ status mapping ให้ชัดตั้งแต่ต้น
- แยก approval engine ออกจาก business action เพื่อขยายง่าย

---

# 18) Recommended Document Split

ถ้าต้องแตกเอกสารออกเป็นหลายไฟล์ แนะนำชุดนี้:
1. PRD.md
2. BRD.md
3. SYSTEM_OVERVIEW.md
4. USER_ROLES_AND_PERMISSIONS.md
5. INVENTORY_RULES.md
6. SALES_ORDER_WORKFLOW.md
7. APPROVAL_WORKFLOW.md
8. DATABASE_SCHEMA_SPEC.md
9. API_SERVICE_SPEC.md
10. UAT_CHECKLIST.md
11. DEPLOYMENT_AND_ENV.md
12. RELEASE_NOTES_REBUILD_2026-03-29.md

---

# 19) Release Notes - Rebuild Baseline

## Summary
เอกสารทั้งหมดของ ORRY ถูกจัดทำใหม่เพื่อให้สอดคล้องกับ product direction ล่าสุด โดยเลิกอิงระบบเดิมที่ไม่ตรงกับเป้าหมายปัจจุบัน

## Major Changes
- ปรับระบบให้ยึด B2B workflow จริง
- ยืนยัน warehouse เดียวใน Phase 1
- เปลี่ยนกติกาสต็อกให้ตัดตอน shipment confirmation
- เพิ่ม approval logic สำหรับ stock-affecting actions
- วาง role model ใหม่ชัดเจน
- กำหนด shipping statuses มาตรฐาน
- วาง dashboard scope ใหม่
- ออกแบบ schema ให้ขยายได้ในอนาคต

---

# 20) Final Summary

ORRY เวอร์ชันใหม่นี้ไม่ได้เป็นแค่หน้าบ้านที่เปลี่ยน theme แต่เป็นการรีเซ็ตโครงสร้างธุรกิจ กติกาการทำงาน และเอกสารอ้างอิงทั้งหมดให้ตรงกับระบบที่ต้องการสร้างจริง

เอกสารชุดนี้จึงทำหน้าที่เป็น baseline กลางสำหรับ:
- Product decision
- Design and UX
- Backend and database design
- Permission and approval flow
- QA / UAT
- Future scaling

หากยึดเอกสารชุดนี้เป็น source of truth เดียว จะช่วยลดความคลาดเคลื่อนระหว่างคนออกแบบ คนพัฒนา และคนทดสอบได้อย่างมาก

---

# 21) Claude Review Canvas

ใช้ส่วนนี้เป็นกรอบตรวจของ Claude โดยให้ตรวจแบบ end-to-end ไม่ใช่ตรวจแค่ syntax หรือ UI ผิวหน้า แต่ต้องยืนยันความสอดคล้องของ product truth, database truth, permission truth, workflow truth และ production readiness พร้อมระบุหลักฐานเป็นข้อ ๆ

## Claude Review Mission
ให้ Claude ตรวจว่า ORRY เวอร์ชันใหม่สอดคล้องกับเอกสารชุดนี้ครบหรือไม่ โดยห้ามอิงระบบเดิม ห้ามปล่อย assumption ที่ไม่มีหลักฐาน และห้ามสรุปว่าผ่านถ้ายังไม่มี evidence รองรับ

## Review Objectives
- ตรวจความครบของ business rules
- ตรวจความถูกต้องของ schema และ data relationships
- ตรวจว่า workflow หลักทำงานได้จริงตามกติกา
- ตรวจ permissions และ approval restrictions
- ตรวจว่า shipment / payment / stock deduction สอดคล้องกัน
- ตรวจความพร้อมสำหรับ demo และ production hardening ระดับต้น
- ตรวจความเสี่ยง ช่องโหว่ งานค้าง และความไม่สอดคล้องระหว่าง code กับ docs

## Required Review Output Format
Claude ต้องส่งผลลัพธ์เป็นหัวข้อดังนี้:
1. Executive Verdict
2. Scope Coverage Matrix
3. Architecture Findings
4. Data Model Findings
5. Workflow Findings
6. Permissions & Security Findings
7. UI/UX Operational Findings
8. Defects / Gaps / Risks
9. Priority Fix Plan
10. Final Acceptance Decision

## Evidence Rule
ทุก finding ต้องมี:
- สิ่งที่ตรวจ
- หลักฐานที่พบ
- ผลกระทบ
- ระดับความรุนแรง
- วิธีแก้ที่แนะนำ

ห้ามใช้คำว่า “น่าจะ”, “น่าจะโอเค”, “ดูเหมือนใช้ได้” ถ้ายังไม่มีหลักฐาน

---

# 22) Claude Review Checklist

## A. Product Truth Checklist
- [ ] ระบบยังยึด ORRY ใหม่เป็น source of truth ไม่ย้อนกลับไปอิง Flowaccount หรือระบบเดิม
- [ ] Phase 1 จำกัด SKU หลักเป็น Bleez 1666 / Whisper 1666 / Velvet 1668
- [ ] มี warehouse เดียวชื่อ คลังหลัก
- [ ] customer group มี General และ Company
- [ ] tax info บังคับเฉพาะกรณีต้องออกเอกสารภาษี
- [ ] pricing เป็น custom per order และยังไม่มี auto tier
- [ ] payment ต้องมาก่อน shipment
- [ ] stock deduction เกิดตอน shipment confirmation เท่านั้น
- [ ] 1 Sales Order จัดส่งได้ 1 ครั้งใน Phase 1
- [ ] low-stock alerts รองรับ <=50%, <=30%, <=20%

## B. Role & Permission Checklist
- [ ] มี role ADMIN / OPERATOR / APPROVER ครบ
- [ ] เมนูและ action ถูกจำกัดตาม role
- [ ] creator อนุมัติรายการตัวเองไม่ได้
- [ ] approver สามารถอนุมัติแทนกันได้
- [ ] รายการที่กระทบสต็อกต้องผ่าน approval ก่อนเสมอ
- [ ] route protection และ action-level guard มีจริงทั้ง client และ server

## C. Sales Order Checklist
- [ ] สร้าง Sales Order ได้
- [ ] เพิ่มสินค้าในออเดอร์ได้
- [ ] กำหนดราคาต่อรายการหรือทั้งออเดอร์ได้ตามแบบที่ออกแบบไว้
- [ ] คำนวณยอดรวมถูกต้อง
- [ ] อ้างอิงลูกค้าได้ถูกต้อง
- [ ] รองรับลูกค้า general/company
- [ ] สถานะ payment และ shipment เชื่อมกันถูกต้อง

## D. Payment & Shipment Checklist
- [ ] ยังไม่จ่ายเงิน ต้องไม่สามารถยืนยันจัดส่งได้
- [ ] เมื่อ mark paid แล้ว จึงเริ่ม flow จัดส่งได้
- [ ] shipment statuses ครบตามที่กำหนด
- [ ] การอัปเดต shipment status ไม่ทำให้ state เพี้ยน
- [ ] ยืนยันจัดส่งแล้วค่อยตัด stock
- [ ] shipment failure / cancel มีผลลัพธ์ที่ชัดเจนและไม่ทำ stock ผิด

## E. Inventory & Approval Checklist
- [ ] inventory balance มีแหล่ง truth ชัดเจน
- [ ] movement log เก็บครบทุก transaction สำคัญ
- [ ] issue รองรับ purpose = Sales / Marketing
- [ ] ถ้า Marketing ต้องมี campaign/event reference
- [ ] return รองรับ Normal / Damaged / Opened / Unsellable
- [ ] stock adjustment มีเหตุผลและ approval flow
- [ ] approval → apply stock movement ลำดับไม่กลับด้าน
- [ ] ไม่มีจุดที่ตัด stock ซ้ำซ้อนหรือข้าม approval

## F. Database & Backend Checklist
- [ ] schema สอดคล้องกับ business rules ล่าสุด
- [ ] relation หลักครบ เช่น orders/items/payments/shipments/products/inventory/approvals
- [ ] enum/status fields ไม่ขัดกันระหว่าง database กับ UI
- [ ] มี unique / foreign key / integrity constraints ที่จำเป็น
- [ ] รองรับ future expansion เช่น multi-warehouse, lot/expiry ได้โดยไม่รื้อหลัก
- [ ] server validations ครบจุดสำคัญ
- [ ] audit log ถูกสร้างจาก write action สำคัญ
- [ ] RLS หรือ permission guard ไม่เปิดช่องให้ bypass ง่าย

## G. UI / UX Operational Checklist
- [ ] dashboard แสดง sales / inventory / pending approvals / pending shipments / low stock
- [ ] operator มองเห็นงานค้างที่ต้องทำได้ชัด
- [ ] approver มี approval queue ที่ใช้งานจริง
- [ ] shipment board หรือ shipment detail ใช้ทำงานได้จริง
- [ ] forms ที่ยาวถูกแยก section ชัดเจน
- [ ] สถานะต่าง ๆ อ่านแล้วเข้าใจได้ทันที
- [ ] mobile responsive ยังใช้งาน action สำคัญได้

## H. Quality & Production Readiness Checklist
- [ ] ไม่มี mock logic สำคัญหลงเหลือใน flow production
- [ ] ไม่มี hard-coded business rule ที่ควรอยู่ใน config/model
- [ ] ไม่มี legacy branding / legacy wording / legacy symbol ตกค้าง
- [ ] error handling ครอบคลุมเส้นทางหลัก
- [ ] loading / empty / error states มีในหน้าสำคัญ
- [ ] logging / audit / trace เพียงพอสำหรับ debug
- [ ] demo-critical path รันได้จริงตั้งแต่ login → order → paid → shipment → stock update

## I. Acceptance Verdict Checklist
- [ ] พร้อม demo
- [ ] พร้อม UAT
- [ ] พร้อม production แบบมีเงื่อนไข
- [ ] ยังไม่ควร production
- [ ] ต้องแก้ blocker ก่อน

Claude ต้องระบุให้ชัดว่าติดข้อไหน และ blocker จริงคืออะไร

---

# 23) Claude Review Prompt

คัดลอกส่วนนี้ส่งให้ Claude ได้ทันที

```text
You are acting as a principal-level product auditor + solution architect + backend reviewer for the rebuilt ORRY Serenity Kiss B2B Back Office.

Your mission is to audit the current implementation against the documentation canvas and checklist below. Do not review superficially. Do a full end-to-end audit based on product truth, business rules, workflow truth, permission truth, data truth, and production readiness.

Strict rules:
- Do not assume the old system is valid.
- Treat the rebuilt ORRY documentation as the only source of truth.
- Do not mark anything as pass without evidence.
- If code, schema, UI, and docs disagree, call it out explicitly.
- Do not hide uncertainty. State what you could not verify.
- Do not focus only on UI. Audit backend, schema, workflow, permissions, and operational correctness.
- Identify blockers, hidden risks, and incomplete implementation.

You must produce output in this structure:
1. Executive Verdict
2. Scope Coverage Matrix
3. Architecture Findings
4. Data Model Findings
5. Workflow Findings
6. Permissions & Security Findings
7. UI/UX Operational Findings
8. Defects / Gaps / Risks
9. Priority Fix Plan
10. Final Acceptance Decision

For every finding include:
- What was checked
- Evidence
- Impact
- Severity
- Recommended fix

You must verify at minimum:
- Product truth
- Role and permission truth
- Sales order flow
- Payment and shipment flow
- Inventory and approval flow
- Database and backend integrity
- UI operational usability
- Production readiness

Audit checklist:
[PASTE THE CLAUDE REVIEW CHECKLIST FROM THE DOCUMENT HERE]

At the end, classify the system into one of these only:
- PASS FOR DEMO
- PASS WITH FIXES REQUIRED
- FAIL - BLOCKERS PRESENT
```

---

# 24) Hand-off Note

เมื่อส่งให้ Claude ตรวจ แนะนำให้แนบอย่างน้อย:
- เอกสารชุดนี้
- โครงสร้าง repo ปัจจุบัน
- schema/database files
- routes / API / service files
- auth / permission logic
- dashboard / order / shipment / approval / inventory screens
- รายการ known issues ถ้ามี

Claude จะตรวจได้แม่นที่สุดเมื่อเห็นทั้ง docs + code + schema + current UI พร้อมกัน

