import type { OrryModuleKey, OrryStoreSnapshot } from "@/lib/orry/schema";
import { getWorkspaceLandingData } from "@/lib/orry/workspace-common";
import { getFinancePageData } from "@/lib/orry/workspace-finance";
import { getOpsPageData } from "@/lib/orry/workspace-ops";
import { getSalesPageData } from "@/lib/orry/workspace-sales";
import { getSystemPageData } from "@/lib/orry/workspace-system";

export { getWorkspaceLandingData };

export function getOrryModulePageData(module: OrryModuleKey, snapshot: OrryStoreSnapshot) {
  if (module === "quotation" || module === "sales-order" || module === "invoice") {
    return getSalesPageData(module, snapshot);
  }

  if (
    module === "purchase-requisition" ||
    module === "purchase-order" ||
    module === "stock-balance" ||
    module === "goods-receive" ||
    module === "goods-issue" ||
    module === "stock-transfer" ||
    module === "stock-checking" ||
    module === "return-order"
  ) {
    return getOpsPageData(module, snapshot);
  }

  if (module === "account-receivable" || module === "account-payable" || module === "general-ledger") {
    return getFinancePageData(module, snapshot);
  }

  return getSystemPageData(module, snapshot);
}
