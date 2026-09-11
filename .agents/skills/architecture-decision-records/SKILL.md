---
name: architecture-decision-records
description: Capture architectural decisions as structured ADRs with clear context, alternatives, consequences, lifecycle status, and index maintenance.
---


# Architecture Decision Records


Capture architectural decisions as they happen in coding sessions so rationale lives with the codebase instead of chat history.


## Workflow


### Capturing a New ADR


When a decision moment is detected:


1. **Initialize (first time only)** — if `docs/adr/` does not exist, ask the user for confirmation before creating the directory, index, and template files.
2. **Identify the decision** — extract the core architectural choice being made
3. **Gather context** — what problem prompted this? What constraints exist?
4. **Document alternatives** — what other options were considered? Why were they rejected?
5. **State consequences** — what are the trade-offs? What becomes easier/harder?
6. **Assign a number** — scan existing ADRs in `docs/adr/` and increment
7. **Confirm and write** — present the draft ADR to the user for review and write only after explicit approval.
8. **Update the index** — append to `docs/adr/README.md`


Use `references/workflow-and-lifecycle.md` for full process detail and edge cases.


### Reading Existing ADRs


When a user asks "why did we choose X?":


1. Check if `docs/adr/` exists — if not, respond: "No ADRs found in this project. Would you like to start recording architectural decisions?"
2. If it exists, scan `docs/adr/README.md` index for relevant entries
3. Read matching ADR files and present the Context and Decision sections
4. If no match is found, respond: "No ADR found for that decision. Would you like to record one now?"


Use `references/adr-template-and-format.md` for the full ADR structure, coded bullets, naming rules, and index format.


## Decision Detection Signals


Watch for these patterns in conversation that indicate an architectural decision:


**Explicit signals**
- "Let's go with X"
- "We should use X instead of Y"
- "The trade-off is worth it because..."
- "Record this as an ADR"


**Implicit signals** (suggest recording an ADR — do not auto-create without user confirmation)
- Comparing two frameworks or libraries and reaching a conclusion
- Making a database schema design choice with stated rationale
- Choosing between architectural patterns (monolith vs microservices, REST vs GraphQL)
- Deciding on authentication/authorization strategy
- Selecting deployment infrastructure after evaluating alternatives


## What Makes a Good ADR


### Do
- **Be specific** — "Use Prisma ORM" not "use an ORM"
- **Record the why** — the rationale matters more than the what
- **Include rejected alternatives** — future developers need to know what was considered
- **State consequences honestly** — every decision has trade-offs
- **Keep it short** — an ADR should be readable in 2 minutes
- **Use present tense** — "We use X" not "We will use X"


### Don't
- Record trivial decisions — variable naming or formatting choices don't need ADRs
- Write essays — if the context section exceeds 10 lines, it's too long
- Omit alternatives — "we just picked it" is not a valid rationale
- Backfill without marking it — if recording a past decision, note the original date
- Let ADRs go stale — superseded decisions should reference their replacement


## ADR Lifecycle


```
proposed → accepted → [deprecated | superseded by ADR-NNNN]
```


- **proposed**: decision is under discussion, not yet committed
- **accepted**: decision is in effect and being followed
- **deprecated**: decision is no longer relevant (e.g., feature removed)
- **superseded**: a newer ADR replaces this one (always link the replacement)


## Categories of Decisions Worth Recording


| Category | Examples |
|----------|---------|
| **Technology choices** | Framework, language, database, cloud provider |
| **Architecture patterns** | Monolith vs microservices, event-driven, CQRS |
| **API design** | REST vs GraphQL, versioning strategy, auth mechanism |
| **Data modeling** | Schema design, normalization decisions, caching strategy |
| **Infrastructure** | Deployment model, CI/CD pipeline, monitoring stack |
| **Security** | Auth strategy, encryption approach, secret management |
| **Testing** | Test framework, coverage targets, E2E vs integration balance |
| **Process** | Branching strategy, review process, release cadence |


## Reference Map


| File | Use when |
| --- | --- |
| `references/adr-template-and-format.md` | You need the full markdown template, front matter schema, coded bullet conventions, naming, numbering, and index examples. |


## Final reminder


- Record significant decisions, not trivial choices.
- Capture rationale and rejected alternatives, not only outcomes.
- Keep ADRs concise, specific, and discoverable through the index.

