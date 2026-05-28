import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-font-scope" lang="th">
      {children}
    </div>
  );
}
