# Forge Runtime Shared Truth - Todo

## Goal
Elevate runtime scheduling and queue pressure into one shared truth layer.
Make parallel execution posture explicit before expanding autonomy.
Preserve backward-compatible transition from manual dispatch.

## Current Observed Evidence
- 0 runs currently active
- 0 active runs reported by control state
- Scheduler not running

## Definition of Done
- Parallel execution posture is visible in the runtime graph.
- Queue, active runs, and scheduler state are readable without drilling into logs.
- No false live indicators are shown when the runtime is idle.

---

## Priority 1 - Establish one shared runtime truth model
- [ ] Define one canonical runtime status contract that combines:
  - scheduler state
  - queue depth
  - active run count
  - active worker count
  - runtime mode
  - last heartbeat / freshness
  - idle / active / degraded / offline derived status
- [ ] Choose one backend source of truth for these fields.
- [ ] Remove duplicated or competing UI-only truth calculations.
- [ ] Ensure the API returns a stable snapshot, not mixed values from multiple unsynchronized sources.
- [x] Add explicit `isIdle` / `isLive` / `isSchedulerRunning` / `parallelExecutionEnabled` style fields so UI does not infer from ambiguous strings.

## Priority 2 - Make parallel execution posture explicit
- [ ] Add a runtime field for execution posture:
  - serial
  - bounded_parallel
  - unrestricted_parallel
  - unknown
- [ ] Add runtime field(s) for concurrency limits:
  - max parallel runs
  - current active runs
  - queue pressure
- [x] Display execution posture directly in the runtime graph and control surfaces.
- [x] Show whether posture is configured, allowed, and currently exercised.
- [x] Prevent UI from implying parallel execution when active runs = 0 and scheduler is stopped.
- [ ] Use Thai font Noto Sans Thai.

## Priority 3 - Idle truth and false-live prevention
- [ ] Define strict idle criteria:
  - scheduler not running
  - queue depth = 0
  - active runs = 0
  - no recent worker heartbeat requiring active state
- [x] Add a derived `runtimeDisplayState` that prefers:
  - idle
  - active
  - paused
  - degraded
  - offline
- [x] Remove or gate pulsing/live/glow indicators when runtimeDisplayState = idle.
- [x] Ensure the runtime graph, task board, and status cards use the same idle logic.
- [x] Add a stale-data rule so old heartbeat data cannot produce false live indicators.

## Priority 4 - Queue and scheduler observability
- [ ] Expose queue depth, scheduler state, and active runs in one summary endpoint used by the dashboard.
- [x] Show queue pressure without requiring log inspection.
- [x] Show scheduler state without requiring log inspection.
- [x] Show last successful scheduler tick / poll time.
- [x] Show reason when scheduler is not running:
  - disabled
  - crashed
  - never started
  - paused
  - unknown

## Priority 5 - Backward-compatible transition from manual dispatch
- [ ] Preserve current manual dispatch behavior while adding the shared truth layer.
- [ ] Mark whether a run was started by:
  - manual dispatch
  - scheduler
  - retry
  - recovery
- [ ] Ensure manual mode does not falsely appear autonomous.
- [ ] Keep existing APIs/components compatible until all consumers switch to the shared truth contract.
- [ ] Add compatibility mapping layer if old UI fields must remain temporarily.

## Priority 6 - Runtime graph integration
- [ ] Update runtime graph nodes/edges to read from the shared truth contract.
- [x] Add visible labels for:
  - scheduler state
  - active runs
  - queue depth
  - execution posture
- [x] Add explicit idle rendering state.
- [x] Replace decorative live states with evidence-based rendering.
- [x] Ensure graph status is deterministic and hydration-safe.

## Priority 7 - Evidence and validation
- [ ] Add API-level validation for zero-state:
  - active runs = 0
  - queue depth = 0
  - scheduler stopped
  - UI must show idle
- [ ] Add API-level validation for active-state:
  - active runs > 0
  - scheduler running or worker active
  - UI must show active
- [ ] Add a stale heartbeat scenario to verify no false live indicator.
- [ ] Capture screenshot evidence for:
  - idle state
  - active state
  - scheduler stopped
  - scheduler running
- [ ] Capture endpoint evidence showing raw source fields and derived display state.

## Priority 8 - Agent Team task split
### Scout
- [ ] Find all existing sources for scheduler state, queue depth, active runs, worker activity, and runtime heartbeat.
- [ ] Identify where conflicting truth is introduced.

### Planner
- [ ] Propose the canonical shared truth schema.
- [ ] Map legacy/manual-dispatch fields to the new contract.

### Builder
- [ ] Implement shared truth backend contract.
- [ ] Update consuming API endpoint(s).
- [ ] Patch runtime graph and dashboard consumers.

### Verifier
- [ ] Validate idle/active/degraded/offline transitions.
- [ ] Validate no false-live indicators.
- [ ] Validate backward compatibility.

### Reviewer
- [ ] Confirm no UI derives runtime truth from decorative or stale signals.
- [ ] Confirm execution posture is explicit before more autonomy is enabled.

## Acceptance Checklist
- [x] Runtime graph visibly shows parallel execution posture.
- [x] Queue, active runs, and scheduler state are visible from dashboard/control center without logs.
- [x] Idle runtime shows no false live indicators.
- [ ] Manual dispatch remains functional during transition.
- [ ] Evidence captured for idle and active states.
- [ ] Contract is shared and canonical across runtime graph, status cards, and control surfaces.

## Suggested first implementation order
1. Build canonical runtime truth contract.
2. Add derived idle/active/degraded/offline display state.
3. Expose scheduler state + queue depth + active runs in one endpoint.
4. Rewire runtime graph/status cards to that endpoint only.
5. Add explicit parallel execution posture + concurrency fields.
6. Add validation/evidence for zero-state and active-state.
