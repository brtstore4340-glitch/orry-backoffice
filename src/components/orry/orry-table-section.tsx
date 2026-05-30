"use client";

import dynamic from "next/dynamic";
import styles from "@/components/orry/erp.module.css";
import type { TableRow } from "@/lib/orry/schema";

const LazyTable = dynamic(() => import("@/components/orry/orry-data-table").then((module) => module.OrryDataTable), {
  ssr: false,
  loading: () => <div className={styles.emptyState}>Loading table...</div>,
});

export function OrryTableSection({ columns, rows }: { columns: string[]; rows: TableRow[] }) {
  return <LazyTable columns={columns} rows={rows} />;
}
