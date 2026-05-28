export const dynamic = "force-dynamic";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { SimpleForm } from "@/components/forms/simple-form";
import { Workspace } from "@/components/app-shell/workspace";
import { requireRole, requireUser } from "@/lib/authorization";
import { recordSecurityEvent } from "@/lib/audit";
import { createProduct } from "@/lib/repository";

async function createProductAction(formData: FormData) {
  "use server";

  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN", "FINANCE", "OPERATIONS", "EXECUTIVE"]);
  } catch {
    redirect("/dashboard");
  }

  const product = await createProduct({
    sku: String(formData.get("sku") ?? "").trim().toUpperCase(),
    name: String(formData.get("name") ?? "").trim(),
    kind: String(formData.get("kind") ?? "INVENTORY"),
    unitLabel: String(formData.get("unitLabel") ?? "").trim() || undefined,
    unitPrice: Number(String(formData.get("unitPrice") ?? "0").trim()),
    cost: Number(String(formData.get("cost") ?? "0").trim()) || undefined,
    reorderPoint: Number(String(formData.get("reorderPoint") ?? "0").trim()) || undefined,
    barcode: String(formData.get("barcode") ?? "").trim() || undefined,
    description: String(formData.get("description") ?? "").trim() || undefined
  });

  await recordSecurityEvent({
    actorId: user.id,
    action: "product.created",
    success: true,
    targetType: "Product",
    targetId: product?.id,
    detail: "Product created."
  });

  revalidatePath("/products");
  if (product?.id) {
    redirect(`/products/${product.id}`);
  }
  redirect("/products");
}

export default function NewProductPage() {
  return (
    <>
      <PageHeader title="เพิ่มสินค้าและบริการ" description="สร้างรายการสินค้าใหม่พร้อมหน่วยนับ ราคา และข้อมูลสต็อกเริ่มต้น" eyebrow="Products & Services" />
      <div className="content-grid two-up">
        <SimpleForm title="ข้อมูลสินค้า" description="ข้อมูลที่ใช้บนเอกสารขาย เอกสารซื้อ และคลังสินค้า">
          <form action={createProductAction} className="stack-form compact-form">
            <label><span>รหัสสินค้า</span><input className="input" name="sku" placeholder="SKU-0001" required /></label>
            <label><span>ชื่อสินค้า/บริการ</span><input className="input" name="name" placeholder="เซรั่มบำรุงผิว" required /></label>
            <label><span>ประเภท</span><select className="input" name="kind" defaultValue="INVENTORY"><option value="INVENTORY">สินค้า</option><option value="SERVICE">บริการ</option><option value="NON_INVENTORY">ไม่ตัดสต็อก</option></select></label>
            <label><span>หน่วยนับ</span><input className="input" name="unitLabel" placeholder="ชิ้น" /></label>
            <label><span>ราคาขาย</span><input className="input" name="unitPrice" inputMode="decimal" placeholder="0.00" required /></label>
            <label><span>ต้นทุน</span><input className="input" name="cost" inputMode="decimal" placeholder="0.00" /></label>
            <label><span>จุดสั่งซื้อ</span><input className="input" name="reorderPoint" inputMode="numeric" placeholder="0" /></label>
            <label><span>บาร์โค้ด</span><input className="input" name="barcode" placeholder="8851000000011" /></label>
            <label><span>รายละเอียด</span><textarea className="input" name="description" rows={3} placeholder="รายละเอียดสินค้า" /></label>
            <button className="button" type="submit">บันทึกสินค้า</button>
          </form>
        </SimpleForm>
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">โครงสร้างข้อมูล</span>
              <h2>รองรับราคาและสต็อก</h2>
              <p>เชื่อมต่อกับ inventory balance, price book และรายการเอกสารทุกประเภท</p>
            </div>
          </div>
          <ul className="bullet-stack settings-notes">
            <li>รองรับหมวดสินค้า หน่วยนับ และราคาหลายชุด</li>
            <li>รองรับการปิดใช้งานและยกเลิกขาย</li>
            <li>รองรับการติดตามคงเหลือและจุดสั่งซื้อ</li>
          </ul>
        </Workspace>
      </div>
    </>
  );
}
