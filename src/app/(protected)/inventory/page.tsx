export const dynamic = "force-dynamic";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { Workspace } from "@/components/app-shell/workspace";
import { DataTable } from "@/components/data-table/data-table";
import { getProductModuleData } from "@/lib/accounting/service";

export default async function InventoryPage() {
  const products = await getProductModuleData();
  return (
    <>
      <PageHeader title="คลังสินค้า" description="สรุปยอดคงเหลือ การรับเข้า และสถานะสินค้าคงคลังในคลังหลัก" eyebrow="Inventory" actions={<Link href="/inventory/receivings/new" className="button">รับเข้าสินค้า</Link>} />
      <Workspace>
        <DataTable
          columns={["รหัสสินค้า", "ชื่อสินค้า", "คงเหลือ", "จุดสั่งซื้อ", "สถานะ"]}
          rows={products.map((product) => [
            product.sku,
            product.name,
            product.stockOnHand.toString(),
            product.reorderPoint.toString(),
            product.stockOnHand <= product.reorderPoint ? "ต้องเติมสต็อก" : "พร้อมขาย",
          ])}
        />
      </Workspace>
    </>
  );
}
