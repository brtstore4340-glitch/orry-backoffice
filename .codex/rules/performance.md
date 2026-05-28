# Performance Rules

Apply this rule when pages feel slow, bundles grow, or rendering is heavy.

## Priorities

- Prefer server-side data loading in App Router when interaction does not require a client component.
- Avoid shipping large client-only dependency chains to protected back-office screens unless clearly necessary.
- Keep list, table, and document views incremental and bounded.
- Avoid avoidable rerenders caused by unstable props or over-broad context updates.

## ORRY Notes

- Document-heavy pages in `src/app/(protected)/documents/*` and admin tables are the likely hotspots.
- Optimize with measured changes, not speculative rewrites.
- Maintain functional correctness for financial and inventory flows while optimizing.
