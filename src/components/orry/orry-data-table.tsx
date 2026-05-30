"use client";

import { memo, useMemo, useState } from "react";
import styles from "@/components/orry/erp.module.css";
import { OrryStatusBadge } from "@/components/orry/orry-status-badge";
import type { TableCell, TableRow } from "@/lib/orry/schema";

const ROW_HEIGHT = 56;
const VIEWPORT_HEIGHT = 448;

function renderCell(cell: TableCell) {
  if (cell.tone) {
    return <OrryStatusBadge label={cell.value} tone={cell.tone} />;
  }

  return (
    <span className={`${cell.emphasis === "primary" ? styles.cellPrimary : ""} ${cell.emphasis === "secondary" ? styles.cellSecondary : ""}`.trim()}>
      {cell.value}
    </span>
  );
}

export const OrryDataTable = memo(function OrryDataTable({ columns, rows }: { columns: string[]; rows: TableRow[] }) {
  const [scrollTop, setScrollTop] = useState(0);
  const virtualized = rows.length > 50;

  const virtualRows = useMemo(() => {
    if (!virtualized) {
      return rows.map((row, index) => ({
        row,
        offset: index * ROW_HEIGHT,
      }));
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 5);
    const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + 10;
    return rows.slice(startIndex, startIndex + visibleCount).map((row, index) => ({
      row,
      offset: (startIndex + index) * ROW_HEIGHT,
    }));
  }, [rows, scrollTop, virtualized]);

  if (!virtualized) {
    return (
      <div className={styles.tableScroller}>
        <table className={styles.table}>
          <thead>
            <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {row.cells.map((tableCell, index) => (
                  <td className={tableCell.align === "right" ? styles.tableRight : undefined} key={`${row.id}-${index}`}>
                    {renderCell(tableCell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={styles.tableScroller} onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)} style={{ maxHeight: VIEWPORT_HEIGHT }}>
      <table className={styles.table}>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          <tr aria-hidden="true" style={{ height: virtualRows[0]?.offset ?? 0 }}>
            <td colSpan={columns.length} />
          </tr>
          {virtualRows.map(({ row }) => (
            <tr key={row.id} style={{ height: ROW_HEIGHT }}>
              {row.cells.map((tableCell, index) => (
                <td className={tableCell.align === "right" ? styles.tableRight : undefined} key={`${row.id}-${index}`}>
                  {renderCell(tableCell)}
                </td>
              ))}
            </tr>
          ))}
          <tr
            aria-hidden="true"
            style={{
              height: Math.max(0, rows.length * ROW_HEIGHT - ((virtualRows[0]?.offset ?? 0) + virtualRows.length * ROW_HEIGHT)),
            }}
          >
            <td colSpan={columns.length} />
          </tr>
        </tbody>
      </table>
    </div>
  );
});
