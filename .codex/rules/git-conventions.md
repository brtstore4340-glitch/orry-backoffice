# Git Conventions

- Keep changes narrowly scoped.
- Do not revert unrelated user work in a dirty tree.
- Do not commit generated noise such as `.next/` output or transient logs.
- Prefer branch names that describe a single bounded task.
- Prefer commit messages that describe the real change, for example:
  - `chore: integrate frontend craft into ORRY`
  - `docs: add ORRY frontend operator guide`

When reviewing recent changes, ignore vendor content in `.frontend-craft/` unless the task is about updating the integration itself.
