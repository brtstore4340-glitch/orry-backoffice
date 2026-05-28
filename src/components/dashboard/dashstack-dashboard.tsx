import styles from "@/components/dashboard/dashstack-dashboard.module.css";
import {
  getDashboardRuntimeViewModel,
  type RuntimeCalloutTone,
  type RuntimeDisplayState,
} from "@/lib/dashboard/dashboard-data";

function RefreshIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.toolbarIcon}>
      <path
        d="M15.2 7.2A5.9 5.9 0 0 0 10.5 4C7.5 4 5 6.4 5 9.5S7.5 15 10.5 15c2.1 0 3.9-1.1 4.8-2.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="m12.9 4.5 2.9.1-.1 2.9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.inlineIcon}>
      <path
        d="m10 2 1.2 3.3L14.5 6.5l-3.3 1.2L10 11l-1.2-3.3L5.5 6.5l3.3-1.2L10 2Zm5 10 1 2.7 2.7 1-2.7 1-1 2.8-1-2.8-2.7-1 2.7-1 1-2.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WandIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.inlineIcon}>
      <path d="m11.8 4.2.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Zm-4.6 5.7 1.2 1.2-3.6 3.6H3.6v-1.2l3.6-3.6Z" fill="currentColor" />
    </svg>
  );
}

function stateClassName(state: RuntimeDisplayState) {
  switch (state) {
    case "active":
      return styles.stateActive;
    case "paused":
      return styles.statePaused;
    case "degraded":
      return styles.stateDegraded;
    case "offline":
      return styles.stateOffline;
    default:
      return styles.stateIdle;
  }
}

function graphNodeClassName(state: RuntimeDisplayState) {
  switch (state) {
    case "active":
      return styles.graphNodeActive;
    case "paused":
      return styles.graphNodePaused;
    case "degraded":
      return styles.graphNodeDegraded;
    case "offline":
      return styles.graphNodeOffline;
    default:
      return styles.graphNodeIdle;
  }
}

function calloutClassName(tone: RuntimeCalloutTone) {
  switch (tone) {
    case "coral":
      return styles.calloutCoral;
    case "mint":
      return styles.calloutMint;
    default:
      return styles.calloutBlue;
  }
}

function formatStateLabel(value: RuntimeDisplayState) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function DashStackDashboard() {
  const model = getDashboardRuntimeViewModel();

  return (
    <section className={styles.stage} aria-labelledby="runtime-control-title">
      <div className={styles.overview}>
        <div className={styles.overviewCopy}>
          <span className={styles.eyebrow}>{model.hero.eyebrow}</span>
          <h1 id="runtime-control-title">{model.hero.title}</h1>
          <p>{model.hero.description}</p>

          <div className={styles.heroChipRow} aria-label="Runtime summary chips">
            {model.hero.chips.map((chip) => (
              <span key={chip} className={styles.heroChip}>
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.metricsRail} aria-label="Runtime summary">
          {model.summaryCards.map((card) => (
            <article key={card.label} className={styles.metricCard}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.detail}</small>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.showcase}>
        <aside className={styles.leftPanel} aria-labelledby="runtime-control-notes">
          <span className={styles.noteLabel}>UI changes</span>
          <h2 id="runtime-control-notes">The runtime surface now says exactly why it is idle instead of hinting that something is live.</h2>
          <ul className={styles.noteList}>
            {model.noteList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>

        <div className={styles.canvasWrap}>
          <div className={styles.canvasWindow}>
            <div className={styles.toolRail} aria-hidden="true">
              {model.toolRailItems.map((item, index) => (
                <span key={item} className={`${styles.toolGlyph} ${index === 0 ? styles.toolGlyphActive : ""}`.trim()}>
                  {item}
                </span>
              ))}
            </div>

            <div className={styles.canvasBody}>
              <section className={`${styles.moduleCard} ${styles.moduleViolet}`} aria-labelledby="runtime-graph-title">
                <header className={styles.moduleHeader}>
                  <div>
                    <span className={styles.moduleEyebrow}>Shared truth</span>
                    <h3 id="runtime-graph-title">Runtime graph</h3>
                  </div>
                  <button type="button" className={styles.refreshButton} aria-label="Refresh runtime status">
                    <RefreshIcon />
                  </button>
                </header>

                <div className={styles.commandBar}>
                  {model.controlFields.map((field) => (
                    <div key={field.label} className={styles.commandField}>
                      <span>{field.label}</span>
                      <strong>{field.value}</strong>
                    </div>
                  ))}
                  <button type="button" className={styles.fetchButton}>
                    <SparkIcon />
                    Read shared truth
                  </button>
                </div>

                <div className={styles.graphFlow} aria-label="Runtime flow">
                  {model.graphNodes.map((node, index) => (
                    <div key={node.label} className={styles.graphFlowItem}>
                      <article className={`${styles.graphNode} ${graphNodeClassName(node.state)}`.trim()}>
                        <div className={styles.graphNodeHeader}>
                          <span className={styles.moduleEyebrow}>{node.label}</span>
                          <span className={`${styles.stateBadge} ${stateClassName(node.state)}`.trim()}>
                            {formatStateLabel(node.state)}
                          </span>
                        </div>
                        <strong className={styles.graphNodeValue}>{node.value}</strong>
                        <p className={styles.graphNodeDetail}>{node.detail}</p>
                      </article>
                      {index < model.graphNodes.length - 1 ? <span className={styles.graphConnector} aria-hidden="true" /> : null}
                    </div>
                  ))}
                </div>

                <div className={styles.tableCard}>
                  <div className={styles.tableHead}>
                    <span className={`${styles.stateBadge} ${stateClassName(model.runtime.runtimeDisplayState)}`.trim()}>
                      {formatStateLabel(model.runtime.runtimeDisplayState)}
                    </span>
                    <span>{model.runtime.executionPosture.replace("_", " ")}</span>
                    <span>{model.runtime.lastSuccessfulTickLabel}</span>
                  </div>

                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th scope="col">Surface</th>
                        <th scope="col">Display state</th>
                        <th scope="col">Evidence</th>
                        <th scope="col">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.evidenceRows.map((row) => (
                        <tr key={row.surface}>
                          <th scope="row">{row.surface}</th>
                          <td>
                            <span className={`${styles.stateBadge} ${stateClassName(row.displayState)}`.trim()}>
                              {formatStateLabel(row.displayState)}
                            </span>
                          </td>
                          <td>{row.evidence}</td>
                          <td>{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className={`${styles.moduleCard} ${styles.moduleBlue}`} aria-labelledby="execution-posture-title">
                <header className={styles.slimHeader}>
                  <div>
                    <span className={styles.moduleEyebrow}>Posture</span>
                    <h3 id="execution-posture-title">Execution posture</h3>
                  </div>
                  <span className={styles.slimAction}>Configured vs exercised</span>
                </header>

                <div className={styles.detailGrid}>
                  {model.postureItems.map((item) => (
                    <article key={item.label} className={styles.detailCard}>
                      <span className={styles.noteLabel}>{item.label}</span>
                      <strong>{item.value}</strong>
                      <p>{item.note}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className={`${styles.moduleCard} ${styles.moduleCoral}`} aria-labelledby="idle-logic-title">
                <header className={styles.slimHeader}>
                  <div>
                    <span className={styles.moduleEyebrow}>Shared idle logic</span>
                    <h3 id="idle-logic-title">Status cards and task board</h3>
                  </div>
                  <span className={styles.slimAction}>No false-live glow</span>
                </header>

                <div className={styles.surfaceList}>
                  {model.evidenceRows.slice(0, 3).map((row) => (
                    <article key={row.surface} className={styles.surfaceCard}>
                      <div className={styles.surfaceCardHeader}>
                        <strong>{row.surface}</strong>
                        <span className={`${styles.stateBadge} ${stateClassName(row.displayState)}`.trim()}>
                          {formatStateLabel(row.displayState)}
                        </span>
                      </div>
                      <p>{row.note}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className={`${styles.moduleCard} ${styles.moduleMint}`} aria-labelledby="observability-title">
                <header className={styles.slimHeader}>
                  <div>
                    <span className={styles.moduleEyebrow}>Observability</span>
                    <h3 id="observability-title">Scheduler and freshness guardrails</h3>
                  </div>
                  <button type="button" className={styles.detailButton}>
                    <WandIcon />
                    Review idle rules
                  </button>
                </header>

                <div className={styles.detailGrid}>
                  {model.guardrailItems.map((item) => (
                    <article key={item.label} className={styles.detailCard}>
                      <span className={styles.noteLabel}>{item.label}</span>
                      <strong>{item.value}</strong>
                      <p>{item.note}</p>
                    </article>
                  ))}
                </div>
              </section>

              <button type="button" className={styles.primaryAction}>
                {model.primaryActionLabel}
              </button>
            </div>
          </div>
        </div>

        <aside className={styles.rightPanel} aria-label="Runtime callouts">
          {model.callouts.map((callout) => (
            <article key={callout.title} className={`${styles.calloutCard} ${calloutClassName(callout.tone)}`.trim()}>
              <span className={styles.calloutLabel}>{callout.title}</span>
              <p>{callout.description}</p>
            </article>
          ))}
        </aside>
      </div>
    </section>
  );
}
