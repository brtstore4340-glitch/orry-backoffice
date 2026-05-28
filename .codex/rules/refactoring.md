# Refactoring Rules

- Prefer gradual changes over rewrites.
- Preserve behavior unless the task explicitly changes behavior.
- In a dirty worktree, avoid widening scope into unrelated files.
- When refactoring protected routes, auth flows, or accounting/inventory logic, keep validation and deployability in mind before chasing structural cleanup.
- If a cleaner architecture would require a large migration, document it in `reports/` rather than half-implementing it.
