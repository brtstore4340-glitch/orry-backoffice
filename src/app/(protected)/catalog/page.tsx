export const dynamic = 'force-dynamic'
import { PageHeader } from "@/components/app-shell/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { Workspace } from "@/components/app-shell/workspace";
import { StatusBadge } from "@/components/status/status-badge";
import { getProducts } from "@/lib/repository";

export default async function CatalogPage() {
  const products = await getProducts();
  const atRisk = products.filter((product) => product.stockOnHand <= product.reorderPoint).length;

  return (
    <>
      <PageHeader title="Catalog" description="Inventory and service catalog used by the ORRY document engine." />
      <div className="content-grid two-up compact-two-up">
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Inventory posture</span>
              <h2>Catalog control</h2>
              <p>Unified product and service list with pricing and stock posture.</p>
            </div>
            <div className="section-meta-chip">{atRisk} items at reorder threshold</div>
          </div>
          <DataTable
            columns={["SKU", "Product", "Type", "Stock", "Reorder", "Unit price"]}
            rows={products.map((product) => [
              product.sku,
              product.name,
              product.kind.replaceAll("_", " "),
              product.stockOnHand.toString(),
              product.reorderPoint.toString(),
              new Intl.NumberFormat("en-US", { style: "currency", currency: "THB" }).format(product.unitPrice)
            ])}
          />
        </Workspace>
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Watchlist</span>
              <h2>Low-stock focus</h2>
              <p>Keep campaign-sensitive items visible before they become fulfilment risks.</p>
            </div>
          </div>
          <div className="stack-list">
            {products.slice(0, 4).map((product) => {
              const tone = product.stockOnHand <= product.reorderPoint ? "warning" : "success";
              return (
                <article key={product.id} className="subtle-panel list-row emphasis-row">
                  <div>
                    <strong>{product.name}</strong>
                    <p>{product.sku} ยท {product.kind.replaceAll("_", " ")}</p>
                  </div>
                  <div className="value-block">
                    <strong>{product.stockOnHand}</strong>
                    <small>stock on hand</small>
                    <div className="value-badge-wrap"><StatusBadge label={tone === "warning" ? "REORDER SOON" : "HEALTHY"} tone={tone} /></div>
                  </div>
                </article>
              );
            })}
          </div>
        </Workspace>
      </div>
    </>
  );
}
