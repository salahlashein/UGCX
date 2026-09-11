---
name: building-agents
description: Guidelines and best practices for designing and implementing AI agents that use LLMs, tools, and memory to achieve goals. Covers loop patterns, tool management, guardrails, state management, reliable design patterns, observability, and control flow for building robust agents in code.
---


<!-- ============================================================ -->
<!-- 1. CORE FORMULA                                                   -->
<!-- ============================================================ -->


# 1. Core Formula


```
Agent = LLM + Tools + Memory + Guardrails + Context Engineering + State Management + Observability + Control Flow
```


Every agent, regardless of complexity, is composed of these three pillars.
All design decisions below serve to make each pillar reliable, observable,
and controllable.


<!-- ============================================================ -->
<!-- 2. AGENT LOOP PATTERNS                                            -->
<!-- ============================================================ -->


# 2. Agent Loop Patterns


Choose a loop pattern based on task complexity and autonomy requirements.


```
+------------------+-----------------------------------------------+----------------------------+
| Pattern              | Description                                       | When to Use                    |
+------------------+-----------------------------------------------+----------------------------+
| ReAct                | Think -> Act -> Observe -> loop                    | General-purpose reasoning  |
|                      | Structured CoT that selects tools per step         | with tool use                  |
+------------------+-----------------------------------------------+----------------------------+
| Ralph                | Reason, Act, Log, Plan, Hypothesize                | Tasks needing explicit         |
|                      | Extended ReAct with planning & hypothesis          | hypothesis tracking            |
+------------------+-----------------------------------------------+----------------------------+
| Autoresearch         | Autonomous experimentation loop:                   | Iterative optimization         |
|                      | change -> test -> measure -> keep/discard          | with measurable metrics        |
+------------------+-----------------------------------------------+----------------------------+
```


### ReAct Loop (Primary Pattern) — Step-by-Step Flow


```
                        +------------------+
                        |  Receive Context |
                        +--------+---------+
                                 |
                                 v
                        +------------------+
                        |   THINK              |
                        |   (LLM produces  |
                        |        structured        |
                        |        tool call)        |
                        +--------+---------+
                                 |
                                 v
                        +------------------+
                        |   SAVE CONTEXT   |
                        +--------+---------+
                                 |
                                 v
                        +------------------+
                        |   ACT                |
                        |   (SW Executes   |
                        |        selected tool)|
                        +--------+---------+
                                 |
                                 v
                        +------------------+
                        |   OBSERVE            |
                        |   (Append tool   |
                        |        result to         |
                        |        context)          |
                        +--------+---------+
                                 |
                                 v
                        +------------------+
                  +---->|  NEXT STEP?          |
                  |         |  (LLM decides:   |
                  |         |   continue /         |
                  |         |   exit / HIL)        |
                  |         +--------+---------+
                  |                  |
                  | continue         | exit/HIL
                  +--------------+-------> Done / Pause
```


<!-- ============================================================ -->
<!-- 3. INSTRUCTION HIERARCHY                                          -->
<!-- ============================================================ -->


# 3. Instruction Hierarchy


Instructions are layered. Lower layers override or extend higher ones.
Each layer adds specificity.


```
  Priority (highest first)
  ========================
  1. System Prompt            — keep light: personality, goals, guardrails, constraints
  2. AGENTS.md                — user-level system prompt; root, then project root
  3. .agent.md                — sub-agent-specific prompt (inherits system + AGENTS.md)
  4. SKILL.md                 — on-demand loaded; choose dynamically from YAML descriptions
  5. Memory                   — user, project, and session-scoped context
```


<!-- ============================================================ -->
<!-- 4. MEMORY SYSTEM                                                  -->
<!-- ============================================================ -->


# 4. Memory System


Update memory regularly at natural checkpoints (after tool calls, after planning, on pause).


<memory_scopes>
  <scope name="user" persistence="permanent" storage="global files">
        <description>User preferences, personal conventions, general insights</description>
        <rules>
          <rule>Do NOT clear — append and deduplicate</rule>
          <rule>Limit size — compact when approaching threshold, leave a healthy context window buffer</rule>
          <rule>Periodically check for and remove inconsistencies</rule>
        </rules>
  </scope>


  <scope name="project" persistence="permanent" storage="project files or DB">
        <description>Repository conventions, coding patterns, project preferences</description>
        <rules>
          <rule>Do NOT clear — persist across sessions</rule>
          <rule>Limit size — compact when approaching threshold, leave a healthy context window buffer</rule>
          <rule>Periodically check for and remove inconsistencies</rule>
        </rules>
  </scope>


  <scope name="session" persistence="ephemeral" storage="in-memory or temp files">
        <description>Current conversation context, in-progress task state</description>
        <rules>
          <rule>Clear at end of conversation</rule>
          <rule>Use for working notes, intermediate results, task tracking</rule>
        </rules>
  </scope>
</memory_scopes>


<!-- ============================================================ -->
<!-- 5. CONTEXT ENGINEERING                                            -->
<!-- ============================================================ -->


# 5. Context Engineering


> Everything is context engineering. Own your context window. (Factor 3)


<context_rules>
  <rule id="compaction">
        Before the context window fills, compact by summarising or offloading.
        Reserve at least ~13k tokens as a compaction buffer.
  </rule>
  <rule id="prefetch">
        Prefetch all likely-needed context BEFORE asking the LLM to reason.
        Example: if the agent will need a list of user projects, fetch it
        eagerly instead of spending a turn deciding whether to fetch.
  </rule>
  <rule id="per_iteration">
        On each loop iteration, manage context via:
        - Memory read/write
        - RAG retrieval
        - Summary/compaction of tool results, errors, and history
        - Human-in-the-loop (HIL) requests (break loop, send request, resume via webhook on same session ID)
        - tool results via state management
  </rule>
</context_rules>


<!-- ============================================================ -->
<!-- 6. TOOL MANAGEMENT                                                -->
<!-- ============================================================ -->


# 6. Tool Management


## 6.1 Front-Loading Tool Calls


During the planning phase, determine ALL tools needed and classify each step as serial or parallel. Pass this plan to the execution phase to maximise parallelisation.


```
  Planning Phase                          Execution Phase
  +--------------------------+            +--------------------------+
  | 1. Identify all steps        |            | Execute parallel steps   |
  | 2. Map step -> tool          | -----> |   concurrently               |
  | 3. Mark serial/parallel  |            | Execute serial steps         |
  | 4. Determine order           |            |   sequentially               |
  +--------------------------+            +--------------------------+
```


## 6.2 Dynamic Tool Loading


Tools live in a registry (DB or memory store). A sub-agent selects the relevant subset at runtime and loads only those into the main agent's context.


```
  Tool Registry (DB or config file) (unified interface for registry itself)
           |
           v
  Sub-Agent: select tools for task
           |
           v
  Load subset --> Main Agent context
```


## 6.3 Tool Interface Design


Every tool implementation MUST include:


```json
{
  "tool_interface": {
        "name": "string — unique identifier",
        "description": "string — what the tool does (for LLM selection)",
        "parameters": "JSON Schema — input validation",
        "risk_level": "low | medium | high",
        "risk_factors": [
          "read-only vs write access",
          "reversibility",
          "required permissions",
          "financial impact"
        ],
        "error_counter": "int — tracks consecutive failures per invocation",
        "timeout_ms": "int — max execution time",
        "idempotency_key": "string | null — for safe retries"
  }
}
```


<!-- ============================================================ -->
<!-- 7. GUARDRAILS                                                     -->
<!-- ============================================================ -->


# 7. Guardrails


Guardrails are NOT just the system prompt. They are actual runtime execution
checks applied to tool calls, inputs, and outputs.


Wrap every LLM call and tool execution: `withGuardrails(process_request)`


<guardrails>
  <guardrail type="input">
        <check name="relevance">Ensure request is within agent scope</check>
        <check name="safety">Detect unsafe input, prompt injection, jailbreak attempts</check>
        <check name="pii_filter">Anonymise user data and PII before processing</check>
        <check name="moderation">Flag harmful content for user management</check>
        <check name="rule_based">Regex, SQL injection patterns, blocklists, input size limits</check>
  </guardrail>


  <guardrail type="tool_execution">
        <check name="risk_gating">
          Tools are rated low / medium / high risk at design time.
          - LOW:  read-only, no side effects → execute freely
          - MEDIUM: write access, reversible → log + proceed
          - HIGH: irreversible, financial, or permissions-sensitive → pause for
                  guardrail check or escalate to human before executing
        </check>
        <check name="allowlist">Only execute tools on the approved allowlist</check>
        <check name="timeout">Enforce per-tool execution timeout</check>
  </guardrail>


  <guardrail type="output">
        <check name="content_validation">Verify output aligns with brand values and policies</check>
        <check name="format_check">Ensure structured outputs match expected schema</check>
  </guardrail>
</guardrails>


<!-- ============================================================ -->
<!-- 8. STATE MANAGEMENT                                               -->
<!-- ============================================================ -->


# 8. State Management


Track two categories of state and apply stability controls.


## 8.1 State Types


```json
{
  "execution_state": {
        "current_step": "string",
        "next_step": "string",
        "waiting_status": "idle | waiting_for_tool | waiting_for_human",
        "retry_count": "int",
        "error_count_per_tool": { "tool_name": "int" }
  },
  "business_state": {
        "messages": ["array of conversation messages"],
        "tool_calls": ["array of {tool, args, result, timestamp}"],
        "session_id": "string",
        "created_at": "ISO timestamp"
  }
}
```


## 8.2 Loop Stability Controls


<stability_controls>
  <control name="state_hashing">
        Hash the full state after each iteration. If the same hash repeats
        N times (configurable), break the loop — the agent is stuck.
        This catches loops that a simple retry counter misses.
  </control>
  <control name="idempotency_keys">
        Add idempotency keys to state at checkpoints to ensure duplicate
        requests are safely deduplicated.
  </control>
  <control name="budget_cap">
        Set a hard budget per request chain (not just per tool call or per loop).
        Track cumulative token usage and API costs. Halt when budget is exceeded.
  </control>
</stability_controls>


<!-- ============================================================ -->
<!-- 9. HOOKS & EVENT SYSTEM                                           -->
<!-- ============================================================ -->


# 9. Hooks & Event System


Hooks are side effects that run before or after an agent invocation. Pre-hooks run before the model call; post-hooks run after. Use them to enforce invariants that should hold for every invocation of a given command or skill, without embedding that logic in every skill individually.


## Pre-hooks are appropriate for:
- Validating inputs before they reach the model (fail fast, save token cost)
- Injecting stable context that should always be present (system constraints, security policies)
- Enforcing environmental preconditions (pipeline is green, branch is clean)
## Post-hooks are appropriate for:
- Validating that the model’s output conforms to the expected schema
- Logging invocation metadata (model, token count, duration, decision)
- Triggering downstream steps conditionally based on the model’s output
- Keeping Hooks Lightweight and Side-Effect-Safe




```json
{
  "hook": {
        "id": "string",
        "event": "string — e.g. tool_called, step_completed, error_raised",
        "condition": "string — e.g. tool == 'edit' or error_count > 3",
        "action_type": "shell_command | agent_run | prompt | api_call",
        "action": "string — the command, prompt, or URL to execute",
        "timeout_ms": "int — safety timeout for hook execution",
        "enabled": "boolean"
  }
}
```


<hook_rules>
  <rule>Create distinct event types for each category of action in your system</rule>
  <rule>Hooks are composable via conditional logic (if/and/or on event properties)</rule>
  <rule> Hooks must be idempotent or have side effects that are safe to run multiple times (e.g. a shell command that checks for a file before creating it, appends to it if it exists instead of failing)</rule>
  <rule>Hooks MUST have timeouts to prevent runaway execution</rule>
  <rule>Hook input = event payload at end of triggering event</rule>
  <rule>Hook output = fed back to the agent context</rule>
  <rule>Hooks are user-configurable via JSON/YAML config files</rule>
</hook_rules>




<!-- ============================================================ -->
<!-- 10. RELIABLE AGENT PATTERNS                                       -->
<!-- ============================================================ -->


# 10. Reliable Agent Patterns


Inspired by Anthropic, 12-Factor Agents, and OpenAI best practices.


## 10.1 Topology Patterns


```
+---------------------+--------------------------------------------------+
| Pattern                 | Description                                          |
+---------------------+--------------------------------------------------+
| Single Agent            | One LLM loop handles the full task                   |
+---------------------+--------------------------------------------------+
| Multi-Agent:            |                                                      |
|   Sub-Agent             | Full delegation to child agents that can              |
|                         | interface with the client independently               |
|   Handoff               | Manager/orchestrator routes to specialised agents |
+---------------------+--------------------------------------------------+
```


## 10.2 Composition Patterns


```
  PROMPT CHAINING
  ================
  CoT + sequential workflow. Each step's result feeds the next.
  Cumulative context builds toward a final output.


          [Step 1] --> result --> [Step 2] --> result --> [Step 3] --> Final




  ROUTING
  ========
  Classify the task, then branch to the appropriate specialised handler.


                            +---> [Handler A]
          [Classify] -------+---> [Handler B]
                            +---> [Handler C]




  PARALLELISATION
  ================
  Split work into independent subtasks OR run the same task N times
  for consensus voting. An aggregator node collects and synthesises.


          [Task] --+--> [Sub A] --+
                   +--> [Sub B] --+--> [Aggregator] --> Result
                   +--> [Sub C] --+




  ORCHESTRATOR
  =============
  Central LLM dynamically breaks down tasks, delegates to worker LLMs,
  and synthesises their results.


                        +----------+
                        |Orchestrat|
                        |   or         |
                        +----+-----+
                             |
                   +---------+---------+
                   |             |             |
              [Worker A] [Worker B] [Worker C]
                   |             |             |
                   +---------+---------+
                             |
                        [Synthesise]




  EVALUATOR
  ==========
  LLM-as-judge in a loop. Worker produces output, evaluator scores it.
  Loop continues until exit condition (quality threshold) is met.


          [Worker] --> output --> [Evaluator] --fail--> [Worker] (retry)
                                       |
                                      pass
                                       |
                                       v
                                     Done
```


## 10.3 Key Design Factors (12-Factor Agents)


<design_factors>
  <factor id="1" name="Natural Language to Tool Calls">
        Input: natural language. Output: structured tool selection and invocation.
  </factor>
  <factor id="3" name="Own Your Context Window">
        Everything is context engineering. Control what enters, stays, and leaves.
  </factor>
  <factor id="6" name="Launch / Pause / Resume">
        Expose simple APIs to launch, pause, and resume agent execution.
        State must be serialisable for pause/resume.
  </factor>
  <factor id="7" name="Contact Humans with Tool Calls">
        Human-in-the-loop is just another tool call. The agent breaks the loop,
        sends a request, and resumes via webhook on the same session ID.
  </factor>
  <factor id="8" name="Own Your Control Flow">
        The agent's next step is determined by code (switch/case, DAG routing),
        not by the LLM deciding its own execution path. The LLM only decides
        WHAT to do next; the software decides HOW to route it.
  </factor>
  <factor id="10" name="Small, Focused Agents">
        Each agent loop is a single-responsibility micro-step. Compose larger
        behaviours from small agents, not monolithic ones.
  </factor>
  <factor id="11" name="Trigger from Anywhere">
        Meet users where they are. Not just chat — integrate via APIs, webhooks,
        CI/CD triggers, message queues, and existing tools.
  </factor>
</design_factors>


<!-- ============================================================ -->
<!-- 11. PLANNING                                                      -->
<!-- ============================================================ -->


# 11. Planning


Planner agents are mandatory. Never let an agent "just start working" without a plan.


<planning_rules>
  <rule>Always produce a structured step-by-step todo with status tracking:
        new → pending → in_progress → complete</rule>
  <rule>Delegate to sub-agents when possible for parallel processing or to use smaller/cheaper models</rule>
  <rule>During planning, decide which steps are serial vs parallel</rule>
  <rule>Decide execution order and expected length</rule>
  <rule>Fetch dynamic tooling needed for the task</rule>
  <rule>Keep steps to a minimum with focused scope: 3–10 steps is healthy</rule>
</planning_rules>


<!-- ============================================================ -->
<!-- 12. ERROR HANDLING                                                -->
<!-- ============================================================ -->


# 12. Error Handling


<error_handling_rules>
  <rule>Catch errors in the software layer and append them to agent context
        (never silently swallow errors)</rule>
  <rule>Maintain an error counter per tool call (part of the tool interface).
        If a tool fails N consecutive times, stop retrying that tool.</rule>
  <rule>Escalate to human on configurable conditions:
        - error_count exceeds threshold
        - high-risk tool failure
        - budget exceeded
        - agent loop stuck (repeated state hash)</rule>
</error_handling_rules>


<!-- ============================================================ -->
<!-- 13. OBSERVABILITY                                                 -->
<!-- ============================================================ -->


# 13. Observability


Instrument from day one. Every agent call, tool execution, and state transition should be observable.


<observability_checklist>
  <item>Wrap every LLM call in a logging/tracing decorator</item>
  <item>Log: prompt tokens, completion tokens, latency, model, temperature</item>
  <item>Log: tool name, arguments, result summary, execution time, error status</item>
  <item>Log: state transitions (step changes, pause/resume events)</item>
  <item>Log: guardrail triggers (which check, pass/fail, action taken)</item>
  <item>Use structured logging (JSON) for machine-parseable traces</item>
  <item>Integrate with observability platforms (Langfuse, LangSmith, etc.)</item>
  <item>Track cost per request chain (cumulative token + API spend)</item>
</observability_checklist>


## Observability Data Schema example
```JSON
{
  "timestamp": "2024-01-15T14:23:01Z",
  "workflow_id": "session-42",
  "agent": "reasoning-agent",
  "model": "gemini-1.5-pro",
  "input_tokens": 4821,
  "output_tokens": 312,
  "duration_ms": 2340,
  "tool_calls": [
        {
          "tool_name": "search",
          "arguments": {"query": "best practices for LLM agents"},
          "result_summary": "Top 3 results from Google Search",
          "execution_time_ms": 500,
          "error_status": null
        }
  ],
  "state_transitions": [
        {"from_step": null, "to_step": "plan", "timestamp": "..."},
        {"from_step": "plan", "to_step": "execute", "timestamp": "..."}
  ],
  "guardrail_triggers": [
        {"check": "relevance", "passed": true, "action_taken": null}
  ],
  "cost_usd": 0.0123,
  "cache_read_tokens": 3100,
  "cache_write_tokens": 0
}
```
{
  "timestamp": "2024-01-15T14:23:01Z",
  "workflow_id": "session-42-review",
  "agent": "semantic-review",
  "model": "gemini-1.5-pro",
  "skill": "/validate-test-spec",
  "input_tokens": 4821,
  "output_tokens": 312,
  "duration_ms": 2340,
  "decision": "block",
  "finding_count": 2,
  "cache_read_tokens": 3100,
  "cache_write_tokens": 0
}




<!-- ============================================================ -->
<!-- 14. CONTROL FLOW & ORCHESTRATION                                  -->
<!-- ============================================================ -->


# 14. Control Flow & Orchestration


<control_flow_rules>
  <rule>Each agent loop is a single-responsibility micro-step in a software DAG</rule>
  <rule>An overarching orchestrator agent can select which agent runs, when,
        once or in a loop, serial or parallel</rule>
  <rule>Trigger from where users already are — chat, CLI, API, webhook, CI/CD,
        message queue. Connectivity and integrations are key.</rule>
  <rule>Add model routing to optimise cost and latency based on task complexity.
        Use cheaper/faster models for simple steps, larger models for complex reasoning.</rule>
</control_flow_rules>


### Next-Step Determinism Pattern


The LLM decides WHAT; the software decides HOW to route.


```
  Request
         |
         v
  [LLM: determine next_step]
         |
         v
  [Software: switch/case or DAG routing]
         |
         v
  [Execute handler for step]
         |
         v
  [Update context & state]
         |
         v
  Loop back to [LLM: determine next_step] or exit
```


<!-- ============================================================ -->
<!-- 15. EXECUTION TEMPLATE                                            -->
<!-- ============================================================ -->


# 15. Execution Template


Use this as a blueprint when building an agent system end-to-end.


## Phase 1: Request Received


```
  1. Assign / resume session_id
  2. Update session state (session memory)
  3. Update long-term memory (DB) so the system can resume later
  4. Log event for observability (Langfuse, RagAs, etc.)
  5. Apply input guardrails: withGuardrails(process_request)
         - Wraps both input and output of every LLM call
```


## Phase 2: Processing


```
  1. Select loop pattern (ReAct, Ralph, goal-based, etc.)
  2. Select agent pattern (single, sequential, parallel, orchestrator,
         coordinator, act/verify, etc.)
  3. Execute outer planning loop:
         a. Decide serial vs parallel steps
         b. Decide execution order and length
         c. Fetch dynamic tooling for task
         d. Limit to 3–10 focused steps
  4. Execute inner loop (per step):
         a. Context management (memory, RAG, prefetch, compaction)
         b. Apply hooks from config
         c. Pausable execution (serialise state on pause)
         d. Observable at granular level
         e. Tools: limited set, SOLID-compliant, includes HIL + exit
         f. Error handling with per-tool counters and escalation
  5. Next-step determinism: LLM picks what, code routes how
```


## Phase 3: Control


```
  1. Orchestrate agent loops as micro-steps in a DAG
  2. Select which agent runs at which time (once or looped, serial or parallel)
  3. Route to appropriate model based on complexity
  4. Expose triggers: API, webhook, CLI, chat, message queue
```


<!-- ============================================================ -->
<!-- 16. ARCHITECTURE OVERVIEW                                         -->
<!-- ============================================================ -->


# 16. Architecture Overview


```
  +--------+
  |  User  |
  +---+----+
          |
          v
  +-----------------------------------------------------------------------+
  | PERCEPTION LAYER                                                          |
  | Input processing, guardrails, permissions, approvals,                     |
  | content filtering, rate limits, Human-in-the-Loop                         |
  +---+-------------------------------------------------------------------+
          |
          v
  +-----------------------------------------------------------------------+
  | REASONING ENGINE                                                          |
  | Loop: ReAct / Ralph / Autoresearch / Planner-Executor                     |
  | Topology: Single / Multi-agent (handoff or delegation) / Evaluator        |
  |                                                                           |
  |   Can answer directly?                                                    |
  |         YES --> produce answer                                                |
  |         NO  --> Planning Module                                               |
  |                  |                                                            |
  |                  v                                                            |
  |             Break goal into steps, assign to agents, parallelise              |
  |                  |                                                            |
  |                  v                                                            |
  |             Task Queue --> Tool Management                                    |
  |                            (MCP, API, code exec, retrieval, DB, FS)           |
  +---+-------------------------------------------------------------------+
          |                 |                  |                      |
          v                 v                  v                      v
  +----------+ +-----------+ +-----------+  +------------------+
  |  Memory  | | Guardrails| |   State   |  | Observability        |
  |  System  | |               | | Management|  |                      |
  | short/   | | relevance | | execution | | logging,             |
  | long-term| | safety        | | business  | | monitoring,          |
  | vector DB| | PII           | | loop          | | tracing,             |
  | graph DB | | moderation| | stability | | latency,             |
  |              | | tool risk | |               | | error tracking   |
  |              | | rules         | |               | | cost tracking        |
  |              | | output        | |               | |                      |
  +----------+ +-----------+ +-----------+ +------------------+
```


<!-- ============================================================ -->
<!-- 17. PROJECT STRUCTURE                                             -->
<!-- ============================================================ -->


# 17. Project Structure


Example Reference folder layout for a modular agent system with clear separation of concerns.


```
  agents/
  ├── core/
  │   ├── interfaces/
  │   │   ├── agent_interface.py          # Abstract agent contract
  │   │   ├── tool_interface.py           # Abstract tool contract (includes risk_level, error_counter)
  │   │   └── memory_interface.py         # Abstract memory contract
  │   ├── engine.py                       # Core loop and orchestration logic
  │   ├── registry.py                     # Component discovery and management
  │   └── event_bus.py                    # Hooks and observability event system
  │
  ├── services/
  │   ├── agent_service/
  │   │   ├── services.py
  │   │   └── config.yaml
  │   ├── memory_service/
  │   │   ├── services.py
  │   │   └── config.yaml
  │   └── planning_service/
  │           ├── services.py
  │           └── config.yaml
  │
  ├── plugins/
  │   ├── agents/
  │   │   ├── reasoning_agent.py
  │   │   ├── planning_agent.py
  │   │   └── execution_agent.py
  │   ├── tools/
  │   │   ├── search_tool.py
  │   │   ├── database_tool.py
  │   │   └── web_search_tool.py
  │   └── memory/
  │           ├── vector_memory.py
  │           ├── long_term_memory.py
  │           └── graph_memory.py
  │
  ├── adapters/
  │   ├── openai_adapter.py
  │   ├── anthropic_adapter.py
  │   └── custom_model_adapter.py
  │
  ├── config/
  │   └── system_config.yaml
  │
  ├── examples/
  │   ├── agent_example.py
  │   ├── tool_example.py
  │   └── memory_example.py
  │
  ├── requirements.txt
  └── README.md
```


## Design Principles


<design_principles>
  <principle>Plugin-based architecture — all agents, tools, and memory are swappable plugins</principle>
  <principle>Interface segregation — abstract contracts for every component type</principle>
  <principle>Single responsibility — each module does one thing</principle>
  <principle>Dependency injection — loose coupling between components</principle>
  <principle>Event-driven communication — via event bus for hooks and observability</principle>
  <principle>Swappable components — swap LLM providers, memory backends, tools without code changes</principle>
</design_principles>


## Plugin System Steps


```
  1. Define interfaces for all components (agents, tools, memory)
  2. Implement plugins following those interfaces
  3. Register components with the service registry
  4. Use dependency injection for loose coupling
```


## Key Capabilities


```
  - Multimodal:  handle text, images, audio, structured data
  - Hot reload:  swap plugins at runtime without restart
  - Event bus:   decouple components via publish/subscribe events
```


<!-- ============================================================ -->
<!-- 18. IMPLEMENTATION CHECKLIST                                       -->
<!-- ============================================================ -->


# 18. Implementation Checklist


Use this checklist when building a new agent system to ensure all concerns are addressed.


<checklist>
  <section name="Core">
        <item>[ ] Define agent, tool, and memory interfaces</item>
        <item>[ ] Implement core engine with chosen loop pattern (ReAct recommended as default)</item>
        <item>[ ] Implement service registry for component discovery</item>
        <item>[ ] Implement event bus for hooks</item>
  </section>


  <section name="Planning">
        <item>[ ] Implement planner agent that produces structured step-by-step todos</item>
        <item>[ ] Plan classifies steps as serial vs parallel</item>
        <item>[ ] Plan fetches dynamic tooling for the task</item>
        <item>[ ] Plan limits scope to 3–10 steps</item>
  </section>


  <section name="Tools">
        <item>[ ] Each tool has name, description, JSON Schema params, risk_level, error_counter, timeout</item>
        <item>[ ] Tools are stored in a registry / DB for dynamic loading</item>
        <item>[ ] Sub-agent selects relevant tool subset at runtime</item>
        <item>[ ] Tool allowlist enforced at execution time</item>
  </section>


  <section name="Memory">
        <item>[ ] User memory: persistent, append-only, size-limited, consistency-checked</item>
        <item>[ ] Project memory: persistent, append-only, size-limited, consistency-checked</item>
        <item>[ ] Session memory: ephemeral, cleared at conversation end</item>
        <item>[ ] Compaction buffer: summarise before context window fills (~13k token reserve)</item>
  </section>


  <section name="Guardrails">
        <item>[ ] Input: relevance, safety, PII filter, moderation, rule-based (regex, SQLi, blocklist, size)</item>
        <item>[ ] Tool execution: risk gating (low/med/high), allowlist, timeout</item>
        <item>[ ] Output: content validation, format/schema check</item>
        <item>[ ] withGuardrails() wrapper on every LLM call and tool execution</item>
  </section>


  <section name="State">
        <item>[ ] Track execution_state: current_step, next_step, waiting_status, retry_count</item>
        <item>[ ] Track business_state: messages, tool_calls, session_id</item>
        <item>[ ] State hashing for stuck-loop detection</item>
        <item>[ ] Idempotency keys at checkpoints</item>
        <item>[ ] Hard budget per request chain (tokens + API cost)</item>
  </section>


  <section name="Error Handling">
        <item>[ ] Errors appended to context (never swallowed)</item>
        <item>[ ] Per-tool error counter with retry ceiling</item>
        <item>[ ] Human escalation on configurable conditions</item>
  </section>


  <section name="Observability">
        <item>[ ] Structured JSON logging on every LLM call and tool execution</item>
        <item>[ ] Trace: tokens, latency, model, cost per request chain</item>
        <item>[ ] State transition and guardrail trigger logging</item>
        <item>[ ] Observability platform integration (Langfuse, LangSmith, etc.)</item>
  </section>


  <section name="Control Flow">
        <item>[ ] Next-step determinism: LLM picks what, software routes how</item>
        <item>[ ] Orchestrator manages agent DAG (serial/parallel, once/looped)</item>
        <item>[ ] Model routing by complexity (cheap model for simple, large for complex)</item>
        <item>[ ] Multi-trigger support: API, webhook, CLI, chat, CI/CD, queue</item>
  </section>


  <section name="Hooks">
        <item>[ ] JSON-configured hooks with event, condition, action_type, timeout</item>
        <item>[ ] Hook output fed back to agent context</item>
        <item>[ ] User-configurable via config files</item>
  </section>
</checklist>


<!-- ============================================================ -->
<!-- 19. IDEMPOTENCY                                                 -->
<!-- ============================================================ -->
# 19. Idempotency
Agentic workflows will be retried - by developers manually, by CI systems automatically, and by error recovery paths. A workflow that is not idempotent will produce inconsistent state when retried.


## Rules for idempotent agent workflows:


- Assign a stable ID to each workflow run at start time. Use this ID for deduplication in any downstream systems the workflow touches.
- Agent invocations that produce the same output for the same input are naturally idempotent. State-changing side effects (writing files, calling external APIs) require explicit deduplication.
- Write-once outputs (session summaries, review findings written to a file) should check for existing output before writing. A retry that overwrites a passing review finding with a new failing one has broken idempotency.


<!-- ============================================================ -->
<!-- 20. LIBRARIES & FRAMEWORKS                                        -->
<!-- ============================================================ -->


# 20. Libraries & Frameworks


Recommended tools and frameworks for building agent systems.


```
+----------------------------+-------------------------------------------+-----------------------------+
| Category                       | Library / Framework                           | Use Case                        |
+----------------------------+-------------------------------------------+-----------------------------+
| Agent Frameworks               | Google Agent Development Kit (ADK)            | Agent framework, reliable   |
|                                |                                               | patterns, multi-agent           |
|                                | LangGraph (LangChain)                         | Stateful multi-actor agent  |
|                                |                                               | graphs with persistence         |
|                                | CrewAI                                        | Role-based multi-agent          |
|                                |                                               | orchestration                   |
|                                | AutoGen (Microsoft)                           | Conversational multi-agent  |
|                                |                                               | patterns with human-in-loop |
|                                | PydanticAI                                    | Type-safe agent dev with        |
|                                |                                               | structured I/O and deps         |
|                                | OpenAI Agents SDK                             | Lightweight agent loops         |
|                                |                                               | with handoff and guardrails |
|                                | Smolagents (HuggingFace)                      | Minimal agent framework         |
|                                |                                               | with code-based tool use        |
+----------------------------+-------------------------------------------+-----------------------------+
| Data Validation                | Pydantic / PydanticAI                         | Structured outputs,             |
|                                |                                               | schema enforcement              |
|                                | Instructor                                    | Structured LLM extraction   |
|                                |                                               | with retry and validation   |
+----------------------------+-------------------------------------------+-----------------------------+
| Observability                  | Langfuse                                      | Tracing, scoring, prompt        |
|                                |                                               | management, cost tracking   |
|                                | LangSmith                                     | LangChain-native tracing        |
|                                |                                               | and evaluation                  |
|                                | Arize Phoenix                                 | Open-source LLM traces          |
|                                |                                               | and evaluation                  |
|                                | OpenTelemetry + Grafana                       | General-purpose distributed |
|                                |                                               | tracing and dashboards          |
+----------------------------+-------------------------------------------+-----------------------------+
| Vector Databases               | Pinecone                                      | Managed vector search           |
|                                | Weaviate                                      | Open-source vector + hybrid |
|                                | Redis (with vector module)                    | Fast in-memory vector store |
|                                | Qdrant                                        | Open-source, high-perf          |
|                                |                                               | vector similarity search        |
|                                | ChromaDB                                      | Lightweight embedded            |
|                                |                                               | vector store for prototyping|
|                                | Milvus                                        | Scalable open-source            |
|                                |                                               | vector database                 |
+----------------------------+-------------------------------------------+-----------------------------+
| Graph Databases                | Neo4j                                         | Graph-based knowledge store |
|                                | FalkorDB                                      | Ultra-fast graph DB for         |
|                                |                                               | knowledge graphs                |
+----------------------------+-------------------------------------------+-----------------------------+
| Tool Protocols                 | MCP (Model Context Protocol)                  | Standardised tool/resource  |
|                                |                                               | interface for LLM agents        |
+----------------------------+-------------------------------------------+-----------------------------+
| Guardrails                     | Guardrails AI                                 | Input/output validation         |
|                                |                                               | with validators and actions |
|                                | NeMo Guardrails (NVIDIA)                      | Programmable rails for          |
|                                |                                               | conversational AI safety        |
|                                | Langfuse (scoring + evals)                    | Runtime guardrail scoring   |
|                                |                                               | and evaluation pipelines        |
+----------------------------+-------------------------------------------+-----------------------------+
| Evaluation                     | RAGAS                                         | RAG evaluation: faithfulness|
|                                |                                               | relevancy, context recall   |
|                                | DeepEval                                      | LLM evaluation framework        |
|                                |                                               | with 14+ metrics                |
|                                | Promptfoo                                     | Prompt testing and              |
|                                |                                               | red-teaming framework           |
+----------------------------+-------------------------------------------+-----------------------------+
```




<!-- ============================================================ -->
<!-- 21. ANTI-PATTERNS                                                -->
<!-- ============================================================ -->


# 21. Anti-patterns


1. The Monolithic Orchestrator
- **What it looks like**: One agent handles orchestration, implementation, review, and summarization. It receives the full project context on every invocation and runs to completion in a single long-running session.


- **Why it fails**: Context accumulates until quality degrades or the window fills. There is no opportunity to route subtasks to cheaper models. A failure anywhere in the monolithic run requires restarting from the beginning. The agent cannot be parallelized.


- **What to do instead**: Decompose into an orchestrator with single-responsibility sub-agents. Each agent receives only the context its task requires. The orchestrator coordinates; it does not execute.


2. Natural Language Agent Interfaces
- **What it looks like**: Agents communicate by passing prose summaries to each other. “The implementation agent completed the login feature. The tests pass and the code looks good. Please proceed with the review.”


- **Why it fails**: Prose is ambiguous. A downstream agent must parse intent from the prose, which introduces a failure point that becomes more likely as model outputs vary between invocations. Prose is also token-inefficient: the same information encoded as JSON takes fewer tokens and is unambiguous.


- **What to do instead**: Define a JSON schema for every agent interface. Agents return structured data. Orchestrators parse structured data. Natural language is reserved for human-readable summaries, not inter-agent communication.


3. Context That Does Not Expire
- **What it looks like**: Session context grows continuously. Prior session conversations are appended rather than summarized. The implementation agent receives the full history of all prior sessions because “it might need it.”


- **Why it fails**: Context that does not expire grows without bound. Token costs increase linearly with context size. Model performance on tasks can degrade as context grows, particularly for tasks in the middle of a large context window. Context that is always present but rarely relevant is a tax on every invocation.


-  **What to do instead**: Summarize at session boundaries. A session summary of 100-150 words replaces a full session conversation for future contexts. The summary contains what the next session needs - not what happened, but what exists and what state the system is in.


4. Missing Output Schema Validation
**What it looks like**: The orchestrator passes an agent’s response directly to the next step without validating that the response conforms to the expected schema. If the model produces a slightly malformed JSON object, the downstream step either fails with an opaque error or silently processes incorrect data.


**Why it fails**: Models do not produce perfectly consistent structured output on every invocation. Occasional schema violations are normal and expected. Without validation, these violations propagate downstream before manifesting as failures, making the root cause hard to trace.


**What to do instead**: Validate schema at every agent boundary using a post-invoke hook. A non-conforming response is a hard failure at the boundary where it occurred, not an opaque error two steps downstream.


5. Hooks With Unconstrained Side Effects
**What it looks like**: A pre-hook makes a network call to an external service to validate an input. The external service is occasionally slow or unavailable. On slow runs, the hook blocks the agent invocation for several minutes. On unavailability, the hook fails in a way that leaves partial state in the external service.


**Why it fails**: Hooks with unconstrained side effects are unpredictable. A hook that can fail in an unclean way, block for an unbounded duration, or write partial state to an external system will be disabled by the team after the first time it causes a production incident or a corrupted workflow run.


**What to do instead**: Hooks must have explicit timeouts. All external calls in hooks must be idempotent. A hook that cannot complete idempotently within its timeout must fail fast and surface the timeout as a clear error, not silently allow the invocation to proceed.

