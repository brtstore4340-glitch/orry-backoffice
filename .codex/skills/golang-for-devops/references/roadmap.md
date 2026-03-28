# Golang for DevOps Reference

## Source Basis

This reference is based on the public article:
[Golang For DevOps: A Complete Guide](https://devopscube.com/golang-for-devops/)

The article describes:
- why Go is valuable in DevOps and cloud-native work
- common Go-based DevOps tooling patterns
- cross-platform binary distribution via `GOOS` and `GOARCH`
- beginner learning resources
- a linked GitHub repository with an 8-week learning roadmap
- a set of practical DevOps and Kubernetes project ideas

Important:
- This file is a working reference for Codex.
- It is not a verbatim copy of the upstream repository.
- Where the repo contents were not directly inspected, treat the weekly roadmap below as an inferred curriculum.

## Why Go Fits DevOps

- Many core cloud-native tools are written in Go: Kubernetes, Docker, Terraform, Helm, Istio, Prometheus ecosystem components.
- Go compiles to a single static binary, which simplifies distribution to servers, containers, and CI runners.
- Go supports efficient concurrency for network services, controllers, agents, and automation workers.
- Compilation is fast, which helps short feedback loops for tooling.

## Useful Starter Resources

- `https://go.dev/learn`
- `https://gobyexample.com`
- `https://learn-golang.org`

## Practical Project Menu

Use these as first-class task types for the skill.

### General DevOps projects

1. Build a CLI that pings services or endpoints and reports status.
2. Build a simplified command-line tool for common cloud operations.
3. Build a utility that validates YAML or JSON configuration before deployment.
4. Build a simple scheduler that runs tasks at intervals.
5. Build an API that exposes CPU, memory, and disk metrics.
6. Build a file sync utility for directories or hosts.
7. Build a traffic generator for performance testing.
8. Build a log parser that extracts useful statistics.

### Kubernetes-focused projects

1. Build a simple operator for a custom resource.
2. Build a validating or mutating webhook.
3. Build a controller that watches resources and reacts to changes.
4. Build a CLI that analyzes RBAC permissions and flags overprivileged accounts.
5. Build a cleaner that finds unused service accounts or tokens.
6. Build a CLI that validates pod and container security contexts.
7. Build an app that handles graceful shutdown on `SIGTERM`.

## Working 8-Week Curriculum

Use this only as a planning scaffold unless the exact upstream repo is inspected.

### Week 1

- Install Go toolchain.
- Learn modules, packages, variables, structs, interfaces, errors.
- Write tiny programs with files, JSON, and HTTP.

### Week 2

- Learn CLI basics with `flag`.
- Build a health-check or endpoint pinger.
- Add exit codes and simple tests.

### Week 3

- Learn file handling and config parsing.
- Build a YAML or JSON validator for deployment config.
- Add machine-readable output.

### Week 4

- Learn goroutines, channels, context, cancellation.
- Build a scheduler or concurrent checker.
- Add timeouts and retries.

### Week 5

- Learn HTTP servers and APIs.
- Build a metrics or health service.
- Add structured logging and graceful shutdown.

### Week 6

- Learn process execution and OS interaction.
- Build a log parser, sync utility, or simple automation runner.
- Cross-compile for Linux and Windows.

### Week 7

- Learn Kubernetes client patterns conceptually.
- Build a read-only cluster analysis CLI such as RBAC or security-context checks.
- Focus on discovery before mutation.

### Week 8

- Build one capstone:
  - controller
  - webhook
  - operator
  - production-ready CLI
- Add tests, docs, and packaging.

## Output Expectations for Codex

When using this skill:
- propose one small deliverable at a time
- prefer standard library first
- keep the binary easy to run
- include example commands
- include at least one validation or test path
