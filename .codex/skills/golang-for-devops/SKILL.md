---
name: golang-for-devops
description: Learn and apply Go in DevOps, SRE, platform engineering, and cloud-native tooling. Use when Codex needs to study a Go-for-DevOps roadmap, plan hands-on learning, explain why Go fits infrastructure work, or build small Go utilities such as CLIs, config validators, schedulers, metrics endpoints, log parsers, Kubernetes plugins, controllers, or operators.
---

# Golang for DevOps

- Treat this skill as a practical guide, not a full language tutorial.
- Use Go when the task benefits from static binaries, cross-compilation, concurrency, fast startup, or easy distribution in CI/CD and cloud environments.
- Start with the smallest working tool, then add flags, structured logging, config loading, and tests.
- Prefer standard library packages first: `flag`, `os`, `os/exec`, `io`, `bufio`, `net/http`, `context`, `encoding/json`, `time`, `sync`, `log/slog`.
- Reach for third-party libraries only when the task clearly needs them.

## Workflow

1. Classify the request:
   - learning plan
   - code explanation
   - small utility or CLI
   - Kubernetes/cloud-native extension
2. Read [references/roadmap.md](references/roadmap.md) for the project menu and working curriculum.
3. Map the request to one concrete deliverable:
   - one CLI
   - one validator
   - one API
   - one parser
   - one scheduler
   - one Kubernetes-focused tool
4. Keep the first version simple:
   - single binary
   - clear inputs and outputs
   - explicit error handling
   - no premature abstractions
5. Validate with real input samples, help text, and at least one failure path.

## Build Patterns

- For CLIs, prefer a simple `main.go` with small package-level helpers before introducing subcommands.
- For file validation tools, support both `json` and `yaml` input only if the task needs both.
- For metrics or health endpoints, use `net/http` and keep handlers explicit.
- For schedulers, start with `time.Ticker` or interval loops and add cancellation with `context.Context`.
- For log parsers, define the expected input format first and emit a stable summary structure.
- For Kubernetes-focused work, begin with read-only analysis tools before building mutating controllers or webhooks.

## DevOps-Specific Guidance

- Prefer environment variables and flags over hardcoded paths.
- Design output for automation:
  - plain text for humans
  - JSON for pipelines
- Make failures obvious and actionable.
- Keep binaries portable; document `GOOS` and `GOARCH` when cross-compilation matters.
- When building tooling for CI/CD, ensure non-zero exits on validation failure.

## Boundaries

- Do not claim to reproduce the upstream repository exactly unless the needed files were inspected directly.
- Treat the bundled roadmap as a working curriculum derived from the public article and typical Go-for-DevOps progression.
- If the user wants a repo-faithful implementation, inspect the exact upstream files before mirroring details.
