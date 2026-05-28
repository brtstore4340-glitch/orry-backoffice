import styles from "@/components/dashboard/dashstack-dashboard.module.css";
import type { DashboardSalesModel, DashboardSalesPoint } from "@/lib/dashboard/dashboard-data";

function buildChartPath(points: DashboardSalesPoint[], width: number, height: number, padding: number) {
  const max = Math.max(...points.map((point) => point.value));
  const min = Math.min(...points.map((point) => point.value));
  const range = Math.max(max - min, 1);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  return points
    .map((point, index) => {
      const x = padding + (usableWidth * index) / Math.max(points.length - 1, 1);
      const y = padding + usableHeight - ((point.value - min) / range) * usableHeight;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function buildAreaPath(points: DashboardSalesPoint[], width: number, height: number, padding: number) {
  const line = buildChartPath(points, width, height, padding);
  const usableWidth = width - padding * 2;
  const firstX = padding;
  const lastX = padding + usableWidth;
  const bottomY = height - padding;

  return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
}

export function DashboardSalesChart({ model }: { model: DashboardSalesModel }) {
  const data = model.data;
  const width = 760;
  const height = 360;
  const padding = 34;
  const linePath = buildChartPath(data, width, height, padding);
  const areaPath = buildAreaPath(data, width, height, padding);
  const total = data[data.length - 1]?.value ?? 0;

  return (
    <section className={styles.chartPanel} aria-labelledby="sales-details-heading">
      <div className={styles.chartHeader}>
        <div>
          <span className={styles.eyebrow}>{model.eyebrow}</span>
          <h2 id="sales-details-heading">{model.title}</h2>
          <p>{model.description}</p>
        </div>
        <div className={styles.chartSummary}>
          <strong>${total.toLocaleString("en-US")}</strong>
          <span>{model.summaryLabel}</span>
        </div>
      </div>

      <div className={styles.chartCanvas}>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sales details chart">
          <defs>
            <linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6aa8ff" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#6aa8ff" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((line) => {
            const y = padding + ((height - padding * 2) * line) / 3;
            return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} className={styles.chartGridLine} />;
          })}

          <path d={areaPath} fill="url(#sales-fill)" />
          <path d={linePath} className={styles.chartLine} />

          {data.map((point, index) => {
            const x = padding + ((width - padding * 2) * index) / Math.max(data.length - 1, 1);
            const values = data.map((item) => item.value);
            const max = Math.max(...values);
            const min = Math.min(...values);
            const y = padding + (height - padding * 2) - ((point.value - min) / Math.max(max - min, 1)) * (height - padding * 2);

            return (
              <g key={point.label}>
                <circle cx={x} cy={y} r="5.5" className={styles.chartPointOuter} />
                <circle cx={x} cy={y} r="3.5" className={styles.chartPointInner} />
                <text x={x} y={height - 8} textAnchor="middle" className={styles.chartAxisLabel}>
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
