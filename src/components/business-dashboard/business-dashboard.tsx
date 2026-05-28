import styles from "./business-dashboard.module.css";

type TrendTone = "positive" | "negative";

type StatCardData = {
  label: string;
  value: string;
  trend: string;
  tone: TrendTone;
  detail: string;
};

const mainMenu = [
  "Dashboard",
  "Products",
  "Favorites",
  "Inbox",
  "Order Lists",
  "Product Stock"
] as const;

const pageMenu = [
  "Pricing",
  "Calendar",
  "To-Do",
  "Contact",
  "Invoice",
  "UI Elements",
  "Team",
  "Table"
] as const;

const statCards: StatCardData[] = [
  { label: "Total User", value: "40,689", trend: "+8.5%", tone: "positive", detail: "vs last month" },
  { label: "Total Order", value: "10,293", trend: "+1.3%", tone: "positive", detail: "steady order growth" },
  { label: "Total Sales", value: "$89,000", trend: "-4.3%", tone: "negative", detail: "seasonal slowdown" },
  { label: "Total Pending", value: "2,040", trend: "+1.8%", tone: "positive", detail: "requires quick follow-up" }
];

const salesSeries = [18, 28, 26, 42, 39, 58, 52, 68, 74, 70, 84, 92];
const salesMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.icon}>
      <path d="M10.5 4a6.5 6.5 0 1 0 4.1 11.55l4.42 4.43 1.42-1.42-4.43-4.42A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.icon}>
      <path d="M12 3a5 5 0 0 0-5 5v2.14c0 .84-.3 1.66-.86 2.29L4.7 14.1A1 1 0 0 0 5.45 16h13.1a1 1 0 0 0 .75-1.68l-1.44-1.67A3.5 3.5 0 0 1 17 10.14V8a5 5 0 0 0-5-5Zm0 18a3 3 0 0 0 2.82-2H9.18A3 3 0 0 0 12 21Z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.chevron}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function DashboardSidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandBlock}>
        <div className={styles.brandMark}>D</div>
        <div>
          <p className={styles.brandEyebrow}>Business Suite</p>
          <strong className={styles.brandText}>DashStack</strong>
        </div>
      </div>

      <nav className={styles.navGroup} aria-label="Main menu">
        <p className={styles.navHeading}>Main Menu</p>
        {mainMenu.map((item) => (
          <button
            key={item}
            type="button"
            className={`${styles.navItem} ${item === "Dashboard" ? styles.navItemActive : ""}`.trim()}
            aria-current={item === "Dashboard" ? "page" : undefined}
          >
            <span>{item}</span>
            <ChevronIcon />
          </button>
        ))}
      </nav>

      <nav className={styles.navGroup} aria-label="Pages">
        <p className={styles.navHeading}>Pages</p>
        {pageMenu.map((item) => (
          <button key={item} type="button" className={styles.navItem}>
            <span>{item}</span>
            <ChevronIcon />
          </button>
        ))}
      </nav>
    </aside>
  );
}

function DashboardHeaderBar() {
  return (
    <header className={styles.headerBar}>
      <label className={styles.searchBar} aria-label="Search">
        <SearchIcon />
        <input type="search" placeholder="Search products, orders, or customers" />
      </label>

      <div className={styles.headerActions}>
        <button type="button" className={styles.iconButton} aria-label="Notifications">
          <BellIcon />
          <span className={styles.unreadDot} aria-hidden="true" />
        </button>

        <button type="button" className={styles.languageButton} aria-label="Language selector">
          English
          <ChevronIcon />
        </button>

        <div className={styles.profileCard} aria-label="Current user">
          <div className={styles.profileAvatar}>MR</div>
          <div>
            <strong>Moni Roy</strong>
            <span>Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatCard({ label, value, trend, tone, detail }: StatCardData) {
  return (
    <article className={styles.statCard}>
      <div className={styles.statHeader}>
        <span>{label}</span>
        <small className={`${styles.trendPill} ${tone === "positive" ? styles.trendPositive : styles.trendNegative}`.trim()}>
          {trend}
        </small>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function SalesChartPanel() {
  const width = 720;
  const height = 260;
  const paddingX = 28;
  const paddingY = 24;
  const maxValue = Math.max(...salesSeries) + 10;
  const stepX = (width - paddingX * 2) / (salesSeries.length - 1);

  const points = salesSeries
    .map((value, index) => {
      const x = paddingX + index * stepX;
      const y = height - paddingY - (value / maxValue) * (height - paddingY * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `${paddingX},${height - paddingY} ${points} ${width - paddingX},${height - paddingY}`;

  return (
    <section className={styles.salesPanel}>
      <div className={styles.salesHeader}>
        <div>
          <span className={styles.sectionEyebrow}>Sales Overview</span>
          <h2>Sales Details</h2>
          <p>Monthly performance trend for users, orders, and revenue touchpoints.</p>
        </div>
        <div className={styles.salesMeta}>
          <div>
            <strong>$128.4k</strong>
            <span>Projected pipeline</span>
          </div>
          <div>
            <strong>82%</strong>
            <span>Target attainment</span>
          </div>
        </div>
      </div>

      <div className={styles.chartWrap}>
        <div className={styles.chartLegend}>
          <span className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles.legendPrimary}`} />
            Sales
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles.legendSecondary}`} />
            Forecast
          </span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className={styles.chart} role="img" aria-label="Sales trend over time">
          {[0, 1, 2, 3].map((row) => {
            const y = paddingY + ((height - paddingY * 2) / 4) * row;
            return <line key={row} x1={paddingX} y1={y} x2={width - paddingX} y2={y} className={styles.gridLine} />;
          })}
          {salesSeries.map((_, index) => {
            const x = paddingX + index * stepX;
            return <line key={salesMonths[index]} x1={x} y1={paddingY} x2={x} y2={height - paddingY} className={styles.gridLineSoft} />;
          })}

          <polygon points={areaPoints} className={styles.chartArea} />
          <polyline points={points} className={styles.chartLine} />

          {salesSeries.map((value, index) => {
            const x = paddingX + index * stepX;
            const y = height - paddingY - (value / maxValue) * (height - paddingY * 2);
            return (
              <g key={salesMonths[index]}>
                <circle cx={x} cy={y} r="5" className={styles.chartPoint} />
                <circle cx={x} cy={y} r="10" className={styles.chartPointHalo} />
              </g>
            );
          })}
        </svg>

        <div className={styles.chartAxis}>
          {salesMonths.map((month) => (
            <span key={month}>{month}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BusinessDashboard() {
  return (
    <section className={styles.pageWrap} aria-label="DashStack dashboard mock">
      <div className={styles.dashboardShell}>
        <DashboardSidebar />

        <div className={styles.mainArea}>
          <DashboardHeaderBar />

          <div className={styles.dashboardContent}>
            <section className={styles.heroCard}>
              <div>
                <span className={styles.sectionEyebrow}>Business Dashboard</span>
                <h1>Track growth, orders, and stock signals from one clean workspace.</h1>
                <p>
                  A production-ready dashboard foundation with a focused navigation model, lightweight controls,
                  and a clear sales story that can later connect to real ORRY data.
                </p>
              </div>
              <div className={styles.heroBadge}>
                <span>Updated just now</span>
                <strong>Executive summary ready</strong>
              </div>
            </section>

            <section className={styles.statsGrid} aria-label="Key metrics">
              {statCards.map((card) => (
                <StatCard key={card.label} {...card} />
              ))}
            </section>

            <div className={styles.lowerGrid}>
              <SalesChartPanel />

              <aside className={styles.sideInsights}>
                <section className={styles.insightCard}>
                  <span className={styles.sectionEyebrow}>Inbox Focus</span>
                  <h3>Notifications that need action</h3>
                  <ul>
                    <li>18 supplier updates waiting for review</li>
                    <li>7 invoices need pricing confirmation</li>
                    <li>4 stock alerts crossed reorder threshold</li>
                  </ul>
                </section>

                <section className={styles.insightCard}>
                  <span className={styles.sectionEyebrow}>Quick Snapshot</span>
                  <h3>Today’s priority mix</h3>
                  <div className={styles.snapshotRow}>
                    <span>Orders in review</span>
                    <strong>184</strong>
                  </div>
                  <div className={styles.snapshotRow}>
                    <span>Favorite products</span>
                    <strong>32</strong>
                  </div>
                  <div className={styles.snapshotRow}>
                    <span>Items low in stock</span>
                    <strong>12</strong>
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
