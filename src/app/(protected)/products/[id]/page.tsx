export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { DetailPanel } from "@/components/detail-panel/detail-panel";
import { Workspace } from "@/components/app-shell/workspace";
import { StatusBadge } from "@/components/status/status-badge";
import { getProductById } from "@/lib/repository";
import { formatThaiCurrency, thaiProductKindLabels } from "@/lib/orry-labels";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  return (
    <>
      <PageHeader title={product.name} description="ข้อมูลสินค้าและบริการสำหรับใช้งานในระบบบัญชีและคลังสินค้า" eyebrow="Products & Services" actions={<Link href={`/products/${product.id}/edit`} className="button">แก้ไข</Link>} />
      <div className="content-grid two-up">
        <DetailPanel title="ข้อมูลหลัก" subtitle="พร้อมใช้งานบนเอกสารและคลังหลัก">
          <dl className="definition-list settings-grid">
            <div><dt>รหัสสินค้า</dt><dd>{product.sku}</dd></div>
            <div><dt>ประเภท</dt><dd>{thaiProductKindLabels[product.kind]}</dd></div>
            <div><dt>คงเหลือ</dt><dd>{product.stockOnHand}</dd></div>
            <div><dt>จุดสั่งซื้อ</dt><dd>{product.reorderPoint}</dd></div>
            <div><dt>ราคาขาย</dt><dd>{formatThaiCurrency(product.unitPrice)}</dd></div>
            <div><dt>บาร์โค้ด</dt><dd>{product.barcode ?? "-"}</dd></div>
          </dl>
        </DetailPanel>
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Inventory</span>
              <h2>ภาพรวมคลังสินค้า</h2>
              <p>ใช้สำหรับติดตามยอดคงเหลือและความเสี่ยงในการเติมสต็อก</p>
            </div>
          </div>
          <article className="subtle-panel list-row emphasis-row">
            <div>
              <strong>คลังหลัก</strong>
              <p>MAIN / คลังหลัก</p>
            </div>
            <StatusBadge label={product.stockOnHand <= product.reorderPoint ? "OVERDUE" : "ACTIVE"} tone={product.stockOnHand <= product.reorderPoint ? "warning" : "success"} />
          </article>
        </Workspace>
      </div>
    </>
  );
}
