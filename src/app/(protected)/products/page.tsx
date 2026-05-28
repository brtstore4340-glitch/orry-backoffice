export const dynamic = "force-dynamic";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { Workspace } from "@/components/app-shell/workspace";
import { DataTable } from "@/components/data-table/data-table";
import { getProductModuleData } from "@/lib/accounting/service";
import { formatThaiCurrency, thaiProductKindLabels } from "@/lib/orry-labels";

export default async function ProductsPage() {
  const products = await getProductModuleData();

  return (
    <>
      <PageHeader title="สินค้าและบริการ" description="รายการสินค้า บริการ ราคา และสถานะการใช้งานในระบบ ORRY" eyebrow="Products & Services" />
      <Workspace>
        <div className="section-heading">
          <div>
            <span className="eyebrow">ทะเบียนสินค้า</span>
            <h2>รายการทั้งหมด</h2>
            <p>เชื่อมกับเอกสารขาย ซื้อ และรับเข้าสินค้าจากคลังหลัก</p>
          </div>
          <Link href="/products/new" className="button">เพิ่มสินค้า</Link>
        </div>
        <DataTable
          columns={["รหัส", "ชื่อสินค้า", "ประเภท", "คงเหลือ", "จุดสั่งซื้อ", "ราคา", "รายละเอียด"]}
          rows={products.map((product) => [
            product.sku,
            product.name,
            thaiProductKindLabels[product.kind],
            product.stockOnHand.toString(),
            product.reorderPoint.toString(),
            formatThaiCurrency(product.unitPrice),
            <Link key={product.id} href={`/products/${product.id}`} className="inline-link">เปิดดู</Link>,
          ])}
        />
      </Workspace>
    </>
  );
}
