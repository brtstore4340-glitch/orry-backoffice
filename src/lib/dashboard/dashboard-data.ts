export type DashboardNavItem = {
  label: string;
  active?: boolean;
};

export type DashboardNavSection = {
  label: string;
  items: DashboardNavItem[];
};

export type DashboardBrand = {
  name: string;
  caption: string;
};

export type DashboardHeaderProfile = {
  name: string;
  role: string;
  initials: string;
};

export type DashboardHeaderModel = {
  searchPlaceholder: string;
  languageLabel: string;
  notificationLabel: string;
  profile: DashboardHeaderProfile;
};

export type DashboardHeroModel = {
  eyebrow: string;
  title: string;
  description: string;
  focusLabel: string;
  focusTitle: string;
  focusDescription: string;
  focusChips: string[];
};

export type DashboardStatTone = "positive" | "negative";
export type DashboardStatAccent = "sky" | "violet" | "peach" | "mint";

export type DashboardStatCardModel = {
  label: string;
  value: string;
  trend: string;
  tone: DashboardStatTone;
  accent: DashboardStatAccent;
};

export type DashboardSalesPoint = {
  label: string;
  value: number;
};

export type DashboardSalesModel = {
  eyebrow: string;
  title: string;
  description: string;
  summaryLabel: string;
  data: DashboardSalesPoint[];
};

export type DashboardViewModel = {
  brand: DashboardBrand;
  navigation: DashboardNavSection[];
  header: DashboardHeaderModel;
  hero: DashboardHeroModel;
  statCards: DashboardStatCardModel[];
  sales: DashboardSalesModel;
};

const dashboardViewModel: DashboardViewModel = {
  brand: {
    name: "DashStack",
    caption: "แดชบอร์ดธุรกิจ",
  },
  navigation: [
    {
      label: "เมนูหลัก",
      items: [
        { label: "แดชบอร์ด", active: true },
        { label: "สินค้า" },
        { label: "รายการโปรด" },
        { label: "กล่องข้อความ" },
        { label: "รายการคำสั่งซื้อ" },
        { label: "สต็อกสินค้า" },
      ],
    },
    {
      label: "พื้นที่งาน",
      items: [
        { label: "ราคา" },
        { label: "ปฏิทิน" },
        { label: "งานที่ต้องทำ" },
        { label: "รายชื่อติดต่อ" },
        { label: "ใบแจ้งหนี้" },
        { label: "องค์ประกอบ UI" },
        { label: "ทีมงาน" },
        { label: "ตารางข้อมูล" },
      ],
    },
  ],
  header: {
    searchPlaceholder: "ค้นหาในแดชบอร์ด...",
    languageLabel: "ไทย",
    notificationLabel: "การแจ้งเตือน",
    profile: {
      name: "Moni Roy",
      role: "ผู้ดูแลระบบ",
      initials: "MR",
    },
  },
  hero: {
    eyebrow: "ภาพรวม DashStack",
    title: "ภาพรวมธุรกิจที่อ่านง่าย ตัดสินใจเร็ว และทำงานต่อได้ทันที",
    description:
      "มุมมองการทำงานที่จัดลำดับชัดเจนสำหรับสินค้า คำสั่งซื้อ สต็อก และยอดขาย พร้อมโทนสีพาสเทลที่ยังคงความพรีเมียมและอ่านสถานะได้รวดเร็ว.",
    focusLabel: "โฟกัสวันนี้",
    focusTitle: "สรุปยอดขาย",
    focusDescription:
      "ติดตามผลการดำเนินงานแบบต่อเนื่อง เห็นงานค้างทันที และสลับไปยังงานสำคัญได้อย่างลื่นไหล.",
    focusChips: ["ภาพรวมเรียลไทม์", "เปลือกพาสเทล"],
  },
  statCards: [
    { label: "ผู้ใช้งานทั้งหมด", value: "40,689", trend: "+8.5%", tone: "positive", accent: "sky" },
    { label: "คำสั่งซื้อทั้งหมด", value: "10,293", trend: "+1.3%", tone: "positive", accent: "violet" },
    { label: "ยอดขายรวม", value: "$89,000", trend: "-4.3%", tone: "negative", accent: "peach" },
    { label: "งานรอดำเนินการ", value: "2,040", trend: "+1.8%", tone: "positive", accent: "mint" },
  ],
  sales: {
    eyebrow: "ประสิทธิภาพ",
    title: "รายละเอียดการขาย",
    description: "แนวโน้มล่าสุดยังเติบโตต่อเนื่อง พร้อมจังหวะอ่อนตัวที่มองเห็นและวางแผนต่อได้ง่าย.",
    summaryLabel: "ยอดขายเดือนล่าสุด",
    data: [
      { label: "ม.ค.", value: 22000 },
      { label: "ก.พ.", value: 25500 },
      { label: "มี.ค.", value: 23800 },
      { label: "เม.ย.", value: 28900 },
      { label: "พ.ค.", value: 33200 },
      { label: "มิ.ย.", value: 30100 },
      { label: "ก.ค.", value: 35800 },
    ],
  },
};

export function getDashboardViewModel(): DashboardViewModel {
  return dashboardViewModel;
}

export type RuntimeDisplayState = "idle" | "active" | "paused" | "degraded" | "offline";
export type RuntimeExecutionPosture = "serial" | "bounded_parallel" | "unrestricted_parallel" | "unknown";
export type RuntimeSchedulerState = "running" | "stopped";
export type RuntimeStopReason = "disabled" | "crashed" | "never_started" | "paused" | "unknown";
export type RuntimeFreshnessState = "fresh" | "stale";
export type RuntimeQueuePressure = "low" | "moderate" | "high";

export type RuntimeTruthSnapshot = {
  schedulerState: RuntimeSchedulerState;
  queueDepth: number;
  activeRunCount: number;
  activeWorkerCount: number;
  runtimeMode: string;
  lastHeartbeatAgeMinutes: number | null;
  lastHeartbeatLabel: string;
  lastSuccessfulTickLabel: string;
  schedulerStopReason: RuntimeStopReason | null;
  executionPosture: RuntimeExecutionPosture;
  maxParallelRuns: number | null;
  queuePressure: RuntimeQueuePressure;
  parallelExecutionEnabled: boolean;
  manualDispatchEnabled: boolean;
};

export type RuntimeStatusModel = RuntimeTruthSnapshot & {
  freshnessState: RuntimeFreshnessState;
  freshnessLabel: string;
  isIdle: boolean;
  isLive: boolean;
  isSchedulerRunning: boolean;
  postureConfigured: boolean;
  postureAllowed: boolean;
  postureExercised: boolean;
  staleHeartbeat: boolean;
  runtimeDisplayState: RuntimeDisplayState;
};

export type RuntimeSummaryCardModel = {
  label: string;
  value: string;
  detail: string;
};

export type RuntimeFieldModel = {
  label: string;
  value: string;
};

export type RuntimeGraphNodeModel = {
  label: string;
  value: string;
  detail: string;
  state: RuntimeDisplayState;
};

export type RuntimeEvidenceRowModel = {
  surface: string;
  displayState: RuntimeDisplayState;
  evidence: string;
  note: string;
};

export type RuntimeDetailItemModel = {
  label: string;
  value: string;
  note: string;
};

export type RuntimeCalloutTone = "blue" | "coral" | "mint";

export type RuntimeCalloutModel = {
  title: string;
  description: string;
  tone: RuntimeCalloutTone;
};

export type DashboardRuntimeHeroModel = {
  eyebrow: string;
  title: string;
  description: string;
  chips: string[];
};

export type DashboardRuntimeViewModel = {
  hero: DashboardRuntimeHeroModel;
  summaryCards: RuntimeSummaryCardModel[];
  noteList: string[];
  controlFields: RuntimeFieldModel[];
  graphNodes: RuntimeGraphNodeModel[];
  evidenceRows: RuntimeEvidenceRowModel[];
  postureItems: RuntimeDetailItemModel[];
  guardrailItems: RuntimeDetailItemModel[];
  callouts: RuntimeCalloutModel[];
  toolRailItems: string[];
  primaryActionLabel: string;
  runtime: RuntimeStatusModel;
};

const runtimeSnapshot: RuntimeTruthSnapshot = {
  schedulerState: "stopped",
  queueDepth: 0,
  activeRunCount: 0,
  activeWorkerCount: 0,
  runtimeMode: "manual-first",
  lastHeartbeatAgeMinutes: 18,
  lastHeartbeatLabel: "18 min ago",
  lastSuccessfulTickLabel: "08 Apr 2026, 09:12 ICT",
  schedulerStopReason: "never_started",
  executionPosture: "bounded_parallel",
  maxParallelRuns: 4,
  queuePressure: "low",
  parallelExecutionEnabled: true,
  manualDispatchEnabled: true,
};

function deriveRuntimeStatus(snapshot: RuntimeTruthSnapshot): RuntimeStatusModel {
  const staleHeartbeat = snapshot.lastHeartbeatAgeMinutes === null || snapshot.lastHeartbeatAgeMinutes > 10;
  const isSchedulerRunning = snapshot.schedulerState === "running";
  const postureConfigured = snapshot.executionPosture !== "unknown";
  const postureAllowed = snapshot.parallelExecutionEnabled && snapshot.executionPosture !== "serial";
  const postureExercised = snapshot.activeRunCount > 1;
  const isIdle =
    !isSchedulerRunning &&
    snapshot.queueDepth === 0 &&
    snapshot.activeRunCount === 0 &&
    (!snapshot.activeWorkerCount || staleHeartbeat);

  let runtimeDisplayState: RuntimeDisplayState;

  if (snapshot.schedulerStopReason === "paused") {
    runtimeDisplayState = "paused";
  } else if (isIdle) {
    runtimeDisplayState = "idle";
  } else if (isSchedulerRunning && (snapshot.activeRunCount > 0 || snapshot.activeWorkerCount > 0)) {
    runtimeDisplayState = "active";
  } else if (staleHeartbeat || snapshot.queueDepth > 0) {
    runtimeDisplayState = "degraded";
  } else {
    runtimeDisplayState = "offline";
  }

  return {
    ...snapshot,
    freshnessState: staleHeartbeat ? "stale" : "fresh",
    freshnessLabel: staleHeartbeat ? "Stale heartbeat gated to idle" : "Fresh worker heartbeat",
    isIdle,
    isLive: runtimeDisplayState === "active",
    isSchedulerRunning,
    postureConfigured,
    postureAllowed,
    postureExercised,
    staleHeartbeat,
    runtimeDisplayState,
  };
}

function formatDisplayState(value: RuntimeDisplayState): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatExecutionPosture(value: RuntimeExecutionPosture): string {
  switch (value) {
    case "bounded_parallel":
      return "Bounded parallel";
    case "unrestricted_parallel":
      return "Unrestricted parallel";
    case "serial":
      return "Serial";
    default:
      return "Unknown";
  }
}

function formatStopReason(value: RuntimeStopReason | null): string {
  switch (value) {
    case "disabled":
      return "Disabled";
    case "crashed":
      return "Crashed";
    case "never_started":
      return "Never started";
    case "paused":
      return "Paused";
    case "unknown":
      return "Unknown";
    default:
      return "Not provided";
  }
}

function formatQueuePressure(value: RuntimeQueuePressure): string {
  switch (value) {
    case "low":
      return "Low";
    case "moderate":
      return "Moderate";
    case "high":
      return "High";
  }
}

const runtimeStatus = deriveRuntimeStatus(runtimeSnapshot);

const dashboardRuntimeViewModel: DashboardRuntimeViewModel = {
  hero: {
    eyebrow: "Runtime Control Center",
    title: "One shared runtime truth now drives the dashboard view, graph labels, and idle-state rendering.",
    description:
      "The dashboard now reads queue depth, scheduler state, active runs, execution posture, and freshness from one typed snapshot so the surface stops implying live activity when the runtime is idle.",
    chips: [
      `Display state: ${formatDisplayState(runtimeStatus.runtimeDisplayState)}`,
      `Execution posture: ${formatExecutionPosture(runtimeStatus.executionPosture)}`,
      runtimeStatus.freshnessLabel,
    ],
  },
  summaryCards: [
    {
      label: "Runtime display state",
      value: formatDisplayState(runtimeStatus.runtimeDisplayState),
      detail: "Idle is derived only when scheduler is stopped, queue depth is zero, and active runs are zero.",
    },
    {
      label: "Execution posture",
      value: formatExecutionPosture(runtimeStatus.executionPosture),
      detail: runtimeStatus.postureExercised
        ? "Parallel capacity is currently in use."
        : "Parallel capacity is configured but not currently exercised.",
    },
    {
      label: "Heartbeat freshness",
      value: runtimeStatus.freshnessState === "fresh" ? "Fresh" : "Stale",
      detail: "Stale heartbeat data is prevented from rendering the control room as live.",
    },
  ],
  noteList: [
    "Runtime graph labels now call out scheduler state, queue depth, active runs, and execution posture directly.",
    "The task board, graph, and status cards consume the same derived idle logic instead of decorative live hints.",
    "Queue pressure, last successful scheduler tick, and stop reason are visible from the dashboard without reading logs.",
    "Manual dispatch remains visible as a separate path so the runtime does not appear autonomous while idle.",
  ],
  controlFields: [
    { label: "Scheduler", value: runtimeStatus.isSchedulerRunning ? "Running" : "Stopped" },
    { label: "Queue depth", value: `${runtimeStatus.queueDepth}` },
    { label: "Active runs", value: `${runtimeStatus.activeRunCount}` },
    { label: "Workers", value: `${runtimeStatus.activeWorkerCount}` },
    { label: "Freshness", value: runtimeStatus.freshnessState === "fresh" ? "Fresh" : "Stale" },
  ],
  graphNodes: [
    {
      label: "Scheduler",
      value: runtimeStatus.isSchedulerRunning ? "Running" : "Stopped",
      detail: `Reason: ${formatStopReason(runtimeStatus.schedulerStopReason)}`,
      state: runtimeStatus.isSchedulerRunning ? "active" : runtimeStatus.runtimeDisplayState,
    },
    {
      label: "Queue",
      value: `${runtimeStatus.queueDepth} waiting`,
      detail: `${formatQueuePressure(runtimeStatus.queuePressure)} pressure`,
      state: runtimeStatus.queueDepth > 0 ? "degraded" : runtimeStatus.runtimeDisplayState,
    },
    {
      label: "Runs",
      value: `${runtimeStatus.activeRunCount} active`,
      detail: `${runtimeStatus.activeWorkerCount} workers reporting`,
      state: runtimeStatus.activeRunCount > 0 ? "active" : runtimeStatus.runtimeDisplayState,
    },
    {
      label: "Execution posture",
      value: formatExecutionPosture(runtimeStatus.executionPosture),
      detail: runtimeStatus.postureExercised ? "Currently exercised" : "Configured, not exercised",
      state: runtimeStatus.postureExercised ? "active" : runtimeStatus.runtimeDisplayState,
    },
  ],
  evidenceRows: [
    {
      surface: "Runtime graph",
      displayState: runtimeStatus.runtimeDisplayState,
      evidence: `Scheduler ${runtimeStatus.schedulerState}, queue ${runtimeStatus.queueDepth}, runs ${runtimeStatus.activeRunCount}`,
      note: "Graph labels come from the same shared snapshot as the rest of the view.",
    },
    {
      surface: "Task board",
      displayState: runtimeStatus.runtimeDisplayState,
      evidence: runtimeStatus.isIdle ? "No pending work is shown as live while idle." : "Pending work is tied to active runtime evidence.",
      note: "False-live chips are removed when idle criteria are met.",
    },
    {
      surface: "Status cards",
      displayState: runtimeStatus.runtimeDisplayState,
      evidence: `${runtimeStatus.queueDepth} queued / ${runtimeStatus.activeRunCount} active / ${runtimeStatus.lastSuccessfulTickLabel}`,
      note: "The same idle logic is used before any badge is promoted to live.",
    },
    {
      surface: "Manual dispatch",
      displayState: "paused",
      evidence: runtimeStatus.manualDispatchEnabled ? "Manual dispatch remains available." : "Manual dispatch unavailable.",
      note: "The surface stays explicitly manual-first so autonomy is not implied.",
    },
  ],
  postureItems: [
    {
      label: "Configured",
      value: runtimeStatus.postureConfigured ? "Yes" : "No",
      note: "Execution posture is now visible as its own field.",
    },
    {
      label: "Allowed",
      value: runtimeStatus.postureAllowed ? `Up to ${runtimeStatus.maxParallelRuns ?? 0} runs` : "No parallel capacity",
      note: "Allowed capacity is separated from whether that capacity is currently used.",
    },
    {
      label: "Exercised",
      value: runtimeStatus.postureExercised ? "Yes" : "No",
      note: "Idle runtime no longer implies parallel work is happening.",
    },
    {
      label: "Queue pressure",
      value: formatQueuePressure(runtimeStatus.queuePressure),
      note: "Pressure is readable directly from the control surface.",
    },
  ],
  guardrailItems: [
    {
      label: "Last successful scheduler tick",
      value: runtimeStatus.lastSuccessfulTickLabel,
      note: "Visible without drilling into logs.",
    },
    {
      label: "Scheduler stop reason",
      value: formatStopReason(runtimeStatus.schedulerStopReason),
      note: "Shown whenever the scheduler is not running.",
    },
    {
      label: "Heartbeat freshness",
      value: runtimeStatus.lastHeartbeatLabel,
      note: runtimeStatus.freshnessLabel,
    },
    {
      label: "Manual dispatch path",
      value: runtimeStatus.manualDispatchEnabled ? "Preserved" : "Unavailable",
      note: "Current dispatch behavior stays explicit during the transition.",
    },
  ],
  callouts: [
    {
      title: "Idle truth",
      description: "Idle state is now the loudest signal in the view when scheduler, queue, and run activity are all at zero.",
      tone: "blue",
    },
    {
      title: "Parallel posture",
      description: "Configured capacity is separated from currently exercised capacity so the graph never implies live parallelism without evidence.",
      tone: "coral",
    },
    {
      title: "Stale heartbeat rule",
      description: "Old heartbeat data is treated as stale and cannot light the dashboard up by itself.",
      tone: "mint",
    },
  ],
  toolRailItems: ["RT", "QD", "AR", "EX", "HB", "MD"],
  primaryActionLabel: "Review shared truth contract",
  runtime: runtimeStatus,
};

export function getDashboardRuntimeViewModel(): DashboardRuntimeViewModel {
  return dashboardRuntimeViewModel;
}
