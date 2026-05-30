import { OrryWorkspaceHome } from "@/components/orry/orry-workspace-home";
import { getWorkspaceLandingData } from "@/lib/orry/workspace";
import { getOrryStoreSnapshot } from "@/server/orry/store";

export const dynamic = "force-dynamic";

export default async function OrryWorkspaceHomePage() {
  const snapshot = await getOrryStoreSnapshot();
  return <OrryWorkspaceHome data={getWorkspaceLandingData(snapshot)} />;
}
