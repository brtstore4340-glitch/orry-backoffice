export const dynamic = "force-dynamic";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { SimpleForm } from "@/components/forms/simple-form";
import { requireRole, requireUser } from "@/lib/authorization";
import { recordSecurityEvent } from "@/lib/audit";
import { getProductById, updateProduct } from "@/lib/repository";

async function updateProductAction(formData: FormData) {
  "use server";

  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN", "FINANCE", "OPERATIONS", "EXECUTIVE"]);
  } catch {
    redirect("/dashboard");
  }

  const id = String(formData.get("id") ?? "");
  const product = await updateProduct({
    id,
    sku: String(formData.get("sku") ?? "").trim().toUpperCase(),
    name: String(formData.get("name") ?? "").trim(),
    kind: String(formData.get("kind") ?? "INVENTORY"),
    unitLabel: String(formData.get("unitLabel") ?? "").trim() || undefined,
    unitPrice: Number(String(formData.get("unitPrice") ?? "0").trim()),
    cost: Number(String(formData.get("cost") ?? "0").trim()) || undefined,
    reorderPoint: Number(String(formData.get("reorderPoint") ?? "0").trim()) || undefined,
    stockOnHand: Number(String(formData.get("stockOnHand") ?? "0").trim()) || undefined,
    barcode: String(formData.get("barcode") ?? "").trim() || undefined,
    description: String(formData.get("description") ?? "").trim() || undefined,
    active: String(formData.get("active") ?? "true") === "true"
  });

  await recordSecurityEvent({
    actorId: user.id,
    action: "product.updated",
    success: true,
    targetType: "Product",
    targetId: product?.id,
    detail: "Product updated."
  });

  revalidatePath(`/products/${id}`);
  revalidatePath("/products");
  redirect(`/products/${id}`);
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <>
      <PageHeader title="แก้ไขสินค้าและบริการ" description="ปรับปรุงข้อมูลสินค้าให้ตรงกับการใช้งานจริง" eyebrow="Products & Services" />
      <SimpleForm title={product.name} description="อัปเดตข้อมูลสินค้า ราคา และสถานะคลัง">
        <form action={updateProductAction} className="stack-form compact-form">
          <input type="hidden" name="id" value={product.id} />
          <label><span>รหัสสินค้า</span><input className="input" name="sku" defaultValue={product.sku} required /></label>
          <label><span>ชื่อสินค้า/บริการ</span><input className="input" name="name" defaultValue={product.name} required /></label>
          <label>
            <span>ประเภท</span>
            <select className="input" name="kind" defaultValue={product.kind}>
              <option value="INVENTORY">สินค้า</option>
              <option value="SERVICE">บริการ</option>
              <option value="NON_INVENTORY">ไม่ตัดสต็อก</option>
            </select>
          </label>
          <label><span>หน่วยนับ</span><input className="input" name="unitLabel" defaultValue="ชิ้น" /></label>
          <label><span>ราคาขาย</span><input className="input" name="unitPrice" inputMode="decimal" defaultValue={String(product.unitPrice)} required /></label>
          <label><span>ต้นทุน</span><input className="input" name="cost" inputMode="decimal" defaultValue={String(product.cost)} /></label>
          <label><span>คงเหลือ</span><input className="input" name="stockOnHand" inputMode="numeric" defaultValue={String(product.stockOnHand)} /></label>
          <label><span>จุดสั่งซื้อ</span><input className="input" name="reorderPoint" inputMode="numeric" defaultValue={String(product.reorderPoint)} /></label>
          <label><span>บาร์โค้ด</span><input className="input" name="barcode" defaultValue={product.barcode ?? ""} /></label>
          <label><span>รายละเอียด</span><textarea className="input" name="description" rows={3} defaultValue={product.description ?? ""} /></label>
          <label>
            <span>สถานะใช้งาน</span>
            <select className="input" name="active" defaultValue={String(product.active)}>
              <option value="true">ใช้งาน</option>
              <option value="false">ปิดใช้งาน</option>
            </select>
          </label>
          <button className="button" type="submit">บันทึกสินค้า</button>
        </form>
      </SimpleForm>
    </>
  );
}
