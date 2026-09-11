---
name: copilot-extension-authoring
description: Expert guidelines for creating custom agent files (.agent.md), agent skills (SKILL.md), orchestrators, and MCP servers to extend GitHub Copilot.
---


# Copilot Extension Authoring


This skill consolidates guidelines and architectural principles for creating specialized configurations that enhance GitHub Copilot. It covers both "Custom Agents" (experts with specific tool access and system prompts) and "Agent Skills" (structured task modules and routines loaded on demand). 


## When to Use


- When asked to "create a new agent" or "build a sub-agent orchestrator".
- When asked to "create an agent skill", "add a new capability to Copilot", or bundle scripts/assets for AI workflows.
- When configuring `.agent.md` files (org/enterprise MCP configurations, prompt schemas) or `SKILL.md` files (metadata, descriptions, progressive loading logic).


## Core Directives


1. **Understand the Distinction:**
   * **Custom Agents (`.agent.md`)**: Define core personas, tool access limits, and system-wide instructions. Usually located in `.github/agents/`. Contains variables, sub-agent orchestrators, and MCP server injections.
   * **Agent Skills (`SKILL.md`)**: Self-contained folders that teach AI agents a specific task (e.g., how to run tests, how to deploy). Located in `.github/skills/`. Heavy focus on progressive loading (only `name` and `description` are loaded until triggered) and bundled resources (`scripts/`, `templates/`, `references/`).
2. **Metadata is Critical**: Both extensions heavily rely on YAML frontmatter. `description` fields MUST focus on *what* the extension does and *when/keywords* that should trigger it.


## Supplementary References


Before generating any code or configuration for these extensions, you MUST consult the detailed documentation:


*   **[Custom Agents Guidelines](references/custom-agents.md)**: Rules for `.agent.md` frontmatter, variable definitions (`${varName}`), multi-step orchestration (Orchestrator → Sub-agents), and MCP Server Configuration.
*   **[Agent Skills Guidelines](references/agent-skills.md)**: Rules for writing `SKILL.md`, including Progressive Loading Architecture, separating Assets (`assets/`) from Templates (`templates/`), and providing rigid, scannable steps.

