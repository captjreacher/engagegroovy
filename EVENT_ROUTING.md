# Event Routing Reference

All routing paths are predefined and deterministic.

## Domains

- `mgrnz`
- `maxai`
- `funkmybrand`
- `dotcomseekr`

## Event ID Pattern

`domain.event_type.stage.v1`

## Examples

- `mgrnz.content_brief.intake.v1`
- `funkmybrand.support.ticket_created.v1`
- `maxai.design.request.intake.v1`

## Reference Paths

Content brief path:

`content_brief.intake -> business_analyst -> writer -> chief_editor -> publish`

Support path:

`support.ticket_created -> support_agent -> support.ticket_classified -> routed_event`

MGRNZ CEO escalation path:

`mgrnz.support.ticket_created -> support_agent -> CEO`

CEO escalation is allowed only when the escalation trigger is met. Otherwise the ticket remains inside the predefined support routing path.
