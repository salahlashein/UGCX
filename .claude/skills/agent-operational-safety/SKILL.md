---
name: agent-operational-safety
description: Safety guardrails, governance protocols, and operational policies for building and commanding AI agents. Covers safe runtime execution (Freeze mode, Careful mode) and secure agentic framework design (PydanticAI, LangChain, etc.).
---


# Agent Operational Safety & Governance


This skill outlines the mandatory safety boundaries, policy enforcement rules, and runtime operation guards that must be respected when developing agentic applications or executing commands autonomously in a workspace.


## When to Use


- When developing applications that use Agent frameworks (crewAI, PydanticAI, LangGraph, OpenAI SDK) to ensure proper tool access controls and auditability.
- When a user asks you to operate in an autonomous or "full-auto mode" where you might run commands without constant supervision.
- When working in a sensitive environment (Production, modifying a specific subtree, processing PII).


## Core Directives


1. **Least Privilege & Fail Closed**: Whether designing an agent or acting as one, tools must only have the minimum access required. If a governance check is ambiguous, the action must be rejected.
2. **Prevent Destructive Operations**: Explicitly watch for and intercept destructive commands (`rm -rf`, `git push --force`, `DROP TABLE`, `chmod 777`). In a guarded/careful mode, you must request confirmation before running these.
3. **Policy as Configuration**: Governance rules (what tools an agent can use, rate limits, blocked regex patterns) must be defined in external configuration, not hardcoded into the agent logic.


## Supplementary References


Use the provided reference instructions below depending on whether you are *writing agent code* or *acting under safety constraints*:


*   **[Framework Safety & Governance](references/framework-safety.md)**: Guidelines for writing safe agentic code in Python/TS. Covers Multi-Agent safety (trust decay, least privilege composition), Append-Only Audit logging, and explicit Framework-Specific implementations (PydanticAI, LangChain, crewAI).
*   **[Safety Guard Modes](references/safety-guard-modes.md)**: Rules for runtime operation. Explains Mode 1 (Careful Mode: intercepting destructive commands), Mode 2 (Freeze Mode: locking edits to a specific directory like `src/components/`), and Mode 3 (Guard Mode: combining both).

