# ADR Template and Format


## Required metadata


Use this front matter for structured ADR files:


```md
---
title: "ADR-NNNN: [Decision Title]"
status: "Proposed"
date: "YYYY-MM-DD"
authors: "[Stakeholder Names/Roles]"
tags: ["architecture", "decision"]
supersedes: ""
superseded_by: ""
---
```


## Required body structure


```md
# ADR-NNNN: [Decision Title]


## Status


**Proposed** | Accepted | Rejected | Superseded | Deprecated


## Context


[Problem statement, constraints, and forces]


## Decision


[Chosen solution and rationale]


## Consequences


### Positive


- **POS-001**: [Benefit]


### Negative


- **NEG-001**: [Trade-off]


## Alternatives Considered


### [Alternative Name]


- **ALT-001**: **Description**: [Brief description]
- **ALT-002**: **Rejection Reason**: [Reason]


## Implementation Notes


- **IMP-001**: [Implementation guidance]


## References


- **REF-001**: [Related ADR or external source]
```


## Numbering and file naming


- Directory: `docs/adr/`
- Naming: `adr-NNNN-[title-slug].md`
- Numbering: sequential 4-digit value based on existing ADRs
- Slug rules:
  - lowercase
  - hyphen-separated words
  - remove special characters
  - keep concise


Examples:


- `adr-0001-database-selection.md`
- `adr-0015-microservices-architecture.md`


## Coded bullet conventions


- Consequences: `POS-###`, `NEG-###`
- Alternatives: `ALT-###`
- Implementation notes: `IMP-###`
- References: `REF-###`


Use fixed-width numbering in each section where possible and keep code prefixes consistent.


## Index format


`docs/adr/README.md` should maintain a discoverable table:


```md
# Architecture Decision Records


| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](0001-use-nextjs.md) | Use Next.js as frontend framework | accepted | 2026-01-15 |
```


## Quality checklist


- ADR number is correct and sequential.
- Status is explicit and valid.
- Context explains constraints and motivation.
- Decision is unambiguous.
- Alternatives include rejection rationale.
- Positive and negative consequences are both present.
- Implementation notes are actionable.
- References include related artifacts.