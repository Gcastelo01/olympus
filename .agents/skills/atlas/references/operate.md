# OPERATE mode — reliability and operability assessment

A bounded snapshot of operational posture, not continuous monitoring. No new monitoring stack unless an evidence-backed gap justifies one.

## Evidence checklist

1. Inventory: services, entry points, dependencies, owners, environments, topology and stateful components.
2. Signals: available SLIs (e.g. availability, request success, latency, error rate, throughput), saturation (CPU/memory/IO/network/GPU when relevant), memory peaks, queues, retries and backpressure; identify device/driver compatibility, headroom and resource contention if measured; avoid invented threshold values.
3. SLOs: distinguish user-defined objectives from proposed ones; report missing baselines explicitly. Error budgets only when inputs are measured and agreed.
4. Lifecycle: health/readiness checks, startup and shutdown behavior, graceful draining, idempotency and restart behavior.
5. Data: persistence and backup/restore evidence, durability/retention, capacity planning, disk pressure and growth, recovery coverage.
6. Reliability: single points of failure, dependency fallbacks, timeouts, circuit-breaking/queues where justified, blast radius, incident history.
7. Access and cost: operational ownership, least-privilege access review **at a high level**, resource cost and avoidable complexity; refer security issues to Aegis.
8. Observability gaps: which failure would remain invisible and the cheapest reliable signal that would detect it.
9. Current indicators: prioritize recent live evidence; label static-only config review clearly.

## Verdicts

- `HEALTHY_OBSERVED`: current authoritative telemetry supports claimed healthy scope over a stated window; critical signal coverage sufficient for that claim.
- `DEGRADED_OBSERVED`: measured user-facing or systemic impairment exists.
- `UNHEALTHY_OBSERVED`: observed outage/failure of target function.
- `UNKNOWN`: evidence insufficient, unavailable, stale, or nonrepresentative.

Separate **current health** from **future reliability risks**; a healthy snapshot does not prove robust architecture.

## Outputs

- `knowledge/operations/assessments/YYYY-MM-DD-<slug>/report.md`
- Optionally update `services.md`, `reliability.md`, `README.md`, `backlog.md` based on verified durable evidence.
- Recommendations ordered by impact/risk and effort, each with measurable exit criteria, owner suggestion, dependencies, proposed check and `OPS-###` reference.
- Propose a minimal monitoring improvement only when a specific unknown failure mode would otherwise be invisible.
