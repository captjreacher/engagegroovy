# EngageGroovy Agent Governance

This repository now includes the minimum governance layer for an event-driven agent workflow system.

## Core References

- [AGENT_CONSTITUTION.md](AGENT_CONSTITUTION.md)
- [EVENT_ROUTING.md](EVENT_ROUTING.md)
- [AGENT_ROUTINES.md](AGENT_ROUTINES.md)

## Operating Model

- All agent work is event-driven and must use explicit schemas plus deterministic routing.
- Support is an external intake model. Customer support tickets will enter via `engagegroovy.com`, then be classified and routed into owned pipelines.
- `agent.role_integrity.audit` runs weekly to detect role bleed, schema acceptance failures, routing deviations, and escalation misuse.

## Current Role Files

- [CTO.md](agents/CTO.md)
- [SUPPORT_AGENT.md](agents/SUPPORT_AGENT.md)
- [generator.prompt.md](design-agent/generator.prompt.md)
