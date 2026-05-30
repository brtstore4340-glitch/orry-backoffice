import { notFound } from "next/navigation";
import { OrryModulePage } from "@/components/orry/orry-module-page";
import { isOrryModuleKey, ORRY_MODULES } from "@/lib/orry/navigation";
import { getOrryModulePageData } from "@/lib/orry/workspace";
import { getOrryStoreSnapshot } from "@/server/orry/store";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return ORRY_MODULES.map((module) => ({ module: module.key }));
}

export default async function OrryModuleRoute({ params }: { params: Promise<{ module: string }> }) {
  const resolvedParams = await params;

  if (!isOrryModuleKey(resolvedParams.module)) {
    notFound();
  }

  const snapshot = await getOrryStoreSnapshot();
  return <OrryModulePage data={getOrryModulePageData(resolvedParams.module, snapshot)} />;
}
