---
name: charting
description: 
  This skill provides guidance for creating decision-grade visuals, charts and graphs, including page anatomy, PwC-aligned working theme, template routing logic, and detailed creation rules for 35 visual archetypes.
---


**Copilot-compatible upload pack: style standards + page creation rules + 35 blueprint cards**


# Purpose


This document is designed to be uploaded to an agent knowledge base. It gives the agent a repeatable blueprint for creating decision-grade visuals, including the page anatomy, PwC-aligned working theme, template routing logic and detailed creation rules for 35 visual archetypes.


## How to use this pack


- Upload this DOCX as the knowledge source for the visualisation agent.
- Paste the final instruction block from the end of this document into the agent instructions or behaviour field.
- Use this v2 pack as the replacement for the earlier upload pack if you want one consolidated source of truth.
- Keep the previous examples as reference assets only; the operational rules are captured here.


Version note: This is a working PwC-aligned theme pack using Georgia and Arial in Microsoft Office outputs and a warm PwC-style palette. It should be checked against approved internal PwC templates and BrandHub guidance before external client release.


# 1\. Universal Page Blueprint


Every output should be built as a decision-grade page, not merely a chart. The agent should first identify the  question and then produce a page blueprint before drafting a visual.


| **Page component**               | **Purpose**                                             | **Agent requirement**                                                                   |
| ---------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Message title**                | States the answer, not the topic.                       | Write as a conclusion. Avoid neutral labels such as Status Update.                      |
| **Context subtitle**             | Clarifies scope, audience, timeframe or data basis. | Include when the page could otherwise be ambiguous.                                     |
| **Main visual**                  | Provides the evidence structure.                        | Select the archetype that best supports the decision required.                          |
| **Legend or scoring method** | Makes the visual interpretable.                         | Define scales, colours, statuses and units.                                             |
| **Insight panel**                | Translates evidence into meaning.                       | Use What we see and Why it matters.                                                     |
| **Decision panel**               | Makes the leadership ask explicit.                      | State the decision, owner and date where known.                                         |
| **Recommendation panel**         | Gives a practical next step.                            | Use an action verb: accelerate, defer, stop, fund, re-sequence, escalate, validate. |
| **Assumptions/source note**  | Protects trust and auditability.                        | Label synthetic, estimated, incomplete or placeholder data.                             |


## Standard page object schema


- archetype: selected visual blueprint name
- business question the page answers
- audience: board, executive committee, PMO, workstream leads, product team, operations team
- message_title: conclusion headline
- subtitle_scope: timeframe, market, programme, function or data basis
- input_data: table or fields required to create the visual
- visual_encoding: axes, rows, columns, colours, size, labels, status logic
- what_we_see: pattern, gap, trend, cluster, variance or exception
- why_it_matters: implication for value, risk, delivery, adoption, cost, control or customer impact
- decision_required: leadership choice, approval, escalation or trade-off
- recommended_action: practical next step using a clear verb
- assumptions_and_gaps: missing inputs, synthetic data, estimates, data quality issues
- quality_checks: legibility, colour meaning, accessibility, action clarity


# 2\. PwC-aligned Working Visual Theme


Use this as a working theme unless the user supplies an official client template or a current approved PwC template. Do not create or imitate logos, sub-brands or marks.


| **Token**               | **Hex** | **Use**                            | **Accessibility note**                     |
| ------------------- | ------- | ------------------------------ | -------------------------------------- |
| **Black**               | #000000 | Text, strong structure             | Use for high-contrast labels               |
| **Dark grey**           | #2D2D2D | Primary text                       | Default body text                          |
| **Medium grey**         | #464646 | Secondary text, axes               | Use for less dominant labels               |
| **Grey**                | #7D7D7D | Neutral status, footnotes          | Do not use for small low-contrast text |
| **Light grey**          | #DEDEDE | Gridlines, borders, baselines  | Keep unobtrusive                           |
| **Very light grey** | #F7F7F7 | Background panels                  | Good for card background                   |
| **Yellow**              | #FFB600 | Opportunity, highlight             | Use dark text on yellow                    |
| **Tangerine**           | #EB8C00 | Secondary emphasis, watch item | Use sparingly                              |
| **Orange**              | #D04A02 | Primary emphasis                   | Signature warm accent                      |
| **Rose**                | #DB536A | Watch item, risk trend             | Pair with label                            |
| **Red**                 | #E0301E | Critical issue                     | Use only for true exception                |


Font rules: Use Georgia for headlines and Arial for subtitles, body copy, labels, tables and footnotes in Microsoft Office outputs. Use only two font families. Use colour only for meaning: status, maturity, risk, value, sequencing, ownership, confidence or priority.


# 3\. Template Routing Matrix


The agent should classify the user request before selecting a visual. If more than one archetype fits, choose the one that best supports the decision required. If the decision is unclear, ask: "What decision should this visual support?"


| **When the user asks about...**                                     | **Use these blueprint families**                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Ambition, target state, strategic direction**                     | North Star Visual; Strategy-on-a-Page; From-To-Because Narrative                                |
| **Case for change, opportunity framing, value levers**              | From-To-Because Narrative; Value Driver Grid                                                    |
| **Gaps, maturity, readiness, benchmarking**                         | Diagnostic Heatmap; Capability Blueprint; High-Density Trend Landscape                          |
| **Target operating model or future-state design**                   | Operating Model Blueprint; Capability Blueprint; Service Blueprint                              |
| **Organisation, governance, roles, decision rights**                | Organisation / Governance Tree; Decision Rights / RACI Map                                      |
| **Customer, colleague, service or process experience**              | Value Stream / Journey Map; Service Blueprint; Sankey Flow                                      |
| **Prioritisation under budget or capacity constraints**             | Portfolio Prioritisation Matrix; Portfolio Stoplight Dashboard                                  |
| **Executive roadmap or sequencing**                                 | Wave Roadmap; Integrated Swimlane Roadmap                                                       |
| **Detailed project planning**                                       | Milestone Gantt; Agile Iteration Gantt; Comparative Implementation Timeline                     |
| **Lifecycle approvals or gate readiness**                           | Stage-Gate Lifecycle Map; Stage-Gate Completion Tracker                                         |
| **Feasibility, mobilisation, skill demand**                         | Resource Loading / Capacity Profile                                                             |
| **PMO performance, cost and schedule variance**                     | Earned Value / Variance S-Curve; Control Tower Dashboard                                        |
| **Business case, benefits or value creation**                       | Value Bridge / Waterfall; Executive Value Case Page; Benefits Tracker Dashboard                 |
| **Risk, appetite, exposure and assurance**                          | Risk Appetite Matrix; Risk Trend Dashboard; Control Tower Dashboard                             |
| **Nested taxonomy, portfolio decomposition, service catalogue** | Sunburst / Nested Taxonomy Map                                                                  |
| **Demand, cost, work, customer or data flow**                       | Sankey Flow / Mix Decomposition                                                                 |
| **Operational reporting and BI**                                    | BI Dashboard Grid; Tabbed Analytical Dashboard Page; Operational KPI + Diagnostic Dashboard |
| **Digital product or command-centre mockup**                        | Dark-Mode Analytics Dashboard                                                                   |


# 4\. Blueprint Index


Each blueprint card contains the minimum input contract, visual structure, headline formula, insight format, decision format, recommendation format and guardrails.


| **No.** | **Category**                            | **Blueprint**                                    | **Primary decision question**                                                                       |
| ------- | ----------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1           | Strategy and ambition                   | **North Star Visual**                            | What ambition and outcomes should the business question align behind?                                  |
| 2           | Strategy and ambition                   | **Strategy-on-a-Page**                           | How do priorities, initiatives, outcomes and measures fit together on one page?                     |
| 3           | Strategy and ambition                   | **From-To-Because Narrative** | How should the change story be explained simply and persuasively?                                   |
| 4           | Strategy and value framing              | **Value Driver Grid**                            | What are the major levers of value and how are they organised?                                      |
| 5           | Diagnosis and maturity                  | **Diagnostic Heatmap**                           | Where are the biggest gaps, risks, maturity issues or readiness hotspots?                           |
| 6           | Operating model and capability          | **Capability Blueprint**                         | Which capabilities matter most and where is investment or maturity improvement needed?              |
| 7           | Operating model and capability          | **Operating Model Blueprint**                    | How should people, process, technology, data, governance and performance work together?             |
| 8           | Governance and organisation             | **Organisation / Governance Tree**               | Who reports to whom, who governs what and how does escalation work?                                 |
| 9           | Governance and organisation             | **Decision Rights / RACI Map**                   | Who decides, who owns, who contributes and where are accountabilities unclear?                      |
| 10          | Process, service and experience         | **Value Stream / Journey Map**                   | Where does the end-to-end experience or process break down and what should change?                  |
| 11          | Process, service and experience         | **Service Blueprint**                            | What frontstage and backstage activities are required to deliver the service experience?            |
| 12          | Portfolio and prioritisation            | **Portfolio Prioritisation Matrix**              | Which initiatives should be accelerated, sequenced, paused, stopped or redesigned?                  |
| 13          | Portfolio and prioritisation            | **Portfolio Stoplight Dashboard**                | Which projects or initiatives are healthy, at risk or requiring escalation?                         |
| 14          | Roadmap and delivery planning           | **Wave Roadmap**                                 | How will the business question unfold over time at executive level?                                    |
| 15          | Roadmap and delivery planning           | **Integrated Swimlane Roadmap**                  | How do multiple workstreams coordinate delivery and dependencies?                                   |
| 16          | Roadmap and delivery planning           | **Milestone Gantt**                              | What are the task-level timings, owners and milestones for a project?                               |
| 17          | Agile and product delivery              | **Agile Iteration Gantt**                        | How should agile work be sequenced across sprints or iterations?                                    |
| 18          | Roadmap and delivery planning           | **Comparative Implementation Timeline**          | How do multiple project or release timelines compare, and where are clashes?                        |
| 19          | Lifecycle and governance                | **Stage-Gate Lifecycle Map**                     | How does work progress through lifecycle stages, approval gates and alternative paths?              |
| 20          | Lifecycle and governance                | **Stage-Gate Completion Tracker**                | Which initiatives have passed, failed or stalled at each lifecycle gate?                            |
| 21          | Feasibility and capacity                | **Resource Loading / Capacity Profile**          | Is the delivery plan feasible with available capacity and critical skills?                          |
| 22          | PMO control and assurance               | **Earned Value / Variance S-Curve**              | Is the programme ahead, behind, over budget or underperforming against plan?                        |
| 23          | Benefits and value                      | **Value Bridge / Waterfall**                     | How is value created, lost, protected or transferred from baseline to target?                       |
| 24          | Benefits and value                      | **Executive Value Case Page**                    | What investment decision should leadership make and why?                                            |
| 25          | Benefits and value                      | **Benefits Tracker Dashboard**                   | Are promised benefits being realised and who is accountable?                                        |
| 26          | PMO control and assurance               | **Control Tower Dashboard**                      | Where does leadership attention need to be focused across programme health, risk and decisions? |
| 27          | Risk and assurance                      | **Risk Appetite Matrix**                         | Are risks inside, approaching or outside appetite, and what decision is required?                   |
| 28          | Risk and assurance                      | **Risk Trend Dashboard**                         | Is risk exposure improving or deteriorating over time, and what is driving it?                      |
| 29          | Advanced data storytelling              | **High-Density Trend Landscape**                 | How are many entities moving differently over time, and which outliers matter?                      |
| 30          | Hierarchy and taxonomy                  | **Sunburst / Nested Taxonomy Map**               | How are categories nested, and where is the largest share of value, cost, risk or effort?           |
| 31          | Flow and decomposition                  | **Sankey Flow / Mix Decomposition**              | Where does volume, value, work, cost, customers or data flow, concentrate or leak?                  |
| 32          | Dashboards and BI                       | **BI Dashboard Grid**                            | How should recurring operational performance be monitored across multiple metrics?                  |
| 33          | Dashboards and BI                       | **Tabbed Analytical Dashboard Page**             | How should one analytical topic be explored within a broader dashboard experience?                  |
| 34          | Dashboards and BI                       | **Operational KPI + Diagnostic Dashboard**   | What is driving operational performance across segments and where are exceptions?                   |
| 35          | Digital and command-centre concepts | **Dark-Mode Analytics Dashboard**                | How could a digital command centre or analytics product experience look and function?               |


# 5\. Blueprint Cards


Use these cards as the operational creation schema for each page. Each card is written so the agent can generate the visual layout, request the right data, and produce insight, decision and recommendation language consistently.


**Blueprint 1: North Star Visual**


**Strategy and ambition**


| **Primary question**           | **What ambition and outcomes should the business question align behind?**
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use when the user needs a clear aspiration, target outcomes, strategic intent or destination state.                                                                                                                                                     |
| **Avoid when**                 | Avoid when the task is detailed delivery planning, status reporting or financial modelling.                                                                                                                                                             |
| **Minimum input contract** | vision_statement, strategic_objectives, outcome_pillars, success_measures, beneficiaries_or_stakeholders, time_horizon, constraints_or_principles                                                                                                       |
| **Visual structure**           | Central ambition statement; 3 to 5 surrounding outcome pillars; proof points or measures under each pillar; optional current-to-future movement band.                                                                                                   |
| **Encoding rules**             | Pillar position = strategic theme; accent colour = priority or outcome type; small proof-point cards = evidence or measures.                                                                                                                            |
| **Headline formula**           | By \[time horizon\], the goal will deliver \[ambition\] through \[number\] outcome pillars.                                                                                                                                                   |
| **Insight format**             | What we see: The business question is strongest where \[outcome pillars\] connect directly to measurable value, customer impact and risk reduction. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Confirm the ambition, the outcome pillars and the measures that will define success.                                                                                                                                                                    |
| **Recommendation format**  | Approve \[pillars\] as the North Star and use them as the basis for portfolio prioritisation and benefits tracking.                                                                                                                                     |
| **Synthetic data shape**   | Rows: one row per pillar. Columns: pillar_name, outcome_statement, success_metric, owner, target_date, confidence.                                                                                                                                      |
| **Guardrails**                 | Keep to 3 to 5 pillars. Do not turn this into an initiative list. Use message-led wording and simple hierarchy.                                                                                                                                         |


**Blueprint 2: Strategy-on-a-Page**


**Strategy and ambition**


| **Primary question**           | **How do priorities, initiatives, outcomes and measures fit together on one page?**                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Use when**                   | Use when the user needs an integrated executive view of strategic priorities and how they translate into action.                                                                                                                         |
| **Avoid when**                 | Avoid when each priority needs detailed analysis or quantified modelling; split into supporting pages instead.                                                                                                                           |
| **Minimum input contract** | strategic_priorities, outcomes, major_initiatives, enablers, KPIs, risks_or_constraints, owners                                                                                                                                          |
| **Visual structure**           | Message title; 3 to 5 strategic pillars; initiatives and outcomes beneath each pillar; enablers and KPIs along the bottom; decision box on the right.                                                                                    |
| **Encoding rules**             | Columns = priorities; rows = outcomes, initiatives, measures; accent bars = priority groups; status labels = readiness or confidence.                                                                                                    |
| **Headline formula**           | \[Number\] strategic priorities will focus the business question on \[outcome theme\] while managing \[constraint\].                                                                                                                        |
| **Insight format**             | What we see: The strategy is coherent when each priority has a clear outcome, named initiatives and measurable proof of progress. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Agree which priorities are in scope, which are deferred and which measures will govern progress.                                                                                                                                         |
| **Recommendation format**  | Lock the priority set at \[number\] and cascade it into roadmap, portfolio and benefits governance.                                                                                                                                      |
| **Synthetic data shape**   | Rows: priority, outcome, initiative, KPI, owner, confidence, dependency.                                                                                                                                                                 |
| **Guardrails**                 | Do not exceed 5 pillars. Avoid generic words without measures. Make the page a decision page, not a poster.                                                                                                                              |


**Blueprint 3: From-To-Because Narrative**


**Strategy and ambition**


| **Primary question**           | **How should the change story be explained simply and persuasively?**                                                                                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use when stakeholders need to understand the current state, future state and the evidence for change.                                                                                                                                   |
| **Avoid when**                 | Avoid when the user needs a detailed roadmap, operating model or benefits case.                                                                                                                                                         |
| **Minimum input contract** | current_state, future_state, rationale, evidence, benefits, risks_of_inaction, stakeholder_impact                                                                                                                                       |
| **Visual structure**           | Three-column structure: From, Because, To; bottom row for implications, choices and recommended next steps.                                                                                                                             |
| **Encoding rules**             | Left = pain or limitation; centre = evidence and drivers; right = target state; bottom = action and decision.                                                                                                                           |
| **Headline formula**           | We need to move from \[current state\] to \[future state\] because \[evidence or pressure\].                                                                                                                                            |
| **Insight format**             | What we see: The change is most compelling where external pressure and internal performance gaps create a clear case for action. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Agree the narrative, the non-negotiable change drivers and the future-state ambition.                                                                                                                                                   |
| **Recommendation format**  | Use the agreed From-To-Because narrative as the front door for leadership, colleague and programme communications.                                                                                                                      |
| **Synthetic data shape**   | Rows: theme, from_statement, evidence, to_statement, implication, decision_required.                                                                                                                                                    |
| **Guardrails**                 | Keep wording plain. Use evidence, not slogans. Avoid too many change themes; group into 3 to 5.                                                                                                                                         |


**Blueprint 4: Value Driver Grid**


**Strategy and value framing**


| **Primary question**           | **What are the major levers of value and how are they organised?**                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Use when**                   | Use when the user needs to shape benefits, opportunities, value levers or initiative themes.                                                                                                                                       |
| **Avoid when**                 | Avoid when the user needs prioritisation by value and complexity; use a portfolio matrix instead.                                                                                                                                  |
| **Minimum input contract** | value_categories, value_levers, benefit_estimates, owner, timing, confidence, initiative_linkage                                                                                                                                   |
| **Visual structure**           | Grouped card grid with columns or sections for value categories and cards for levers or opportunities.                                                                                                                             |
| **Encoding rules**             | Columns = value categories; cards = levers; card header = lever type; badge = value or confidence; colour = value theme.                                                                                                           |
| **Headline formula**           | \[Number\] value levers could deliver \[value estimate\] across \[category count\] business domains.                                                                                                                         |
| **Insight format**             | What we see: Value is concentrated in \[top categories\], with \[levers\] representing the largest addressable opportunity. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Select which levers to pursue, which need validation and which should be deprioritised.                                                                                                                                            |
| **Recommendation format**  | Prioritise \[lever group\] for Wave 1 and validate \[uncertain levers\] before committing investment.                                                                                                                              |
| **Synthetic data shape**   | Rows: lever_id, value_category, lever_name, description, annual_value, owner, confidence, wave.                                                                                                                                    |
| **Guardrails**                 | Make each card action-oriented. Do not mix unvalidated ideas with committed benefits without labels.                                                                                                                               |


**Blueprint 5: Diagnostic Heatmap**


**Diagnosis and maturity**


| **Primary question**           | **Where are the biggest gaps, risks, maturity issues or readiness hotspots?**                                                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use when comparing multiple entities across common assessment dimensions.                                                                                                                                                                 |
| **Avoid when**                 | Avoid for a single metric or a small set of items where a bar chart is clearer.                                                                                                                                                           |
| **Minimum input contract** | row_entities, assessment_dimensions, score_scale, current_scores, target_scores, evidence_notes, owners                                                                                                                                   |
| **Visual structure**           | Rows for entities; columns for dimensions; colour-coded score cells; legend; optional target gap and outlier markers; right-hand insight panel.                                                                                           |
| **Encoding rules**             | Cell colour = score or gap; marker = outside threshold; row grouping = function or segment; border = priority area.                                                                                                                       |
| **Headline formula**           | \[Number\] priority gaps are concentrated in \[entities or dimensions\], creating \[risk or value implication\].                                                                                                                          |
| **Insight format**             | What we see: The heatmap shows that \[dimension\] is the most consistent weakness, while \[entity\] is furthest from target state. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Agree which hotspots require intervention, funding or deeper diagnostic work.                                                                                                                                                             |
| **Recommendation format**  | Focus near-term intervention on \[hotspots\] and establish owners for gaps with high strategic importance.                                                                                                                                |
| **Synthetic data shape**   | Rows: entity, dimension, current_score, target_score, gap, evidence, owner, priority.                                                                                                                                                     |
| **Guardrails**                 | Always define the scoring scale. Avoid unexplained red/amber/green cells. Use labels as well as colour.                                                                                                                                   |


**Blueprint 6: Capability Blueprint**


**Operating model and capability**


| **Primary question**           | **Which capabilities matter most and where is investment or maturity improvement needed?**                                                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use when mapping business capabilities, maturity, ownership, priority or investment need.                                                                                                                                             |
| **Avoid when**                 | Avoid when the story is process sequence or customer experience; use journey or value stream maps.                                                                                                                                    |
| **Minimum input contract** | capability_groups, capabilities, current_maturity, target_maturity, strategic_importance, owner, initiatives, investment_need                                                                                                         |
| **Visual structure**           | Capability groups as sections; capability tiles within groups; colour or badges for maturity, gap, owner wave.                                                                                                      |
| **Encoding rules**             | Tile colour = maturity or priority; badge = owner or wave; tile size = investment or value if available.                                                                                                                              |
| **Headline formula**           | \[Capability group\] contains the largest target-state gaps and should anchor the roadmap.                                                                                                                             |
| **Insight format**             | What we see: Capabilities with high strategic importance and low current maturity represent the strongest case for investment. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Confirm priority capabilities, owners and which initiatives close the most important gaps.                                                                                                                                            |
| **Recommendation format**  | Fund \[capabilities\] first and align \[initiatives\] to explicit maturity outcomes.                                                                                                                                                  |
| **Synthetic data shape**   | Rows: capability_group, capability, current_maturity, target_maturity, gap, importance, owner, initiative.                                                                                                                            |
| **Guardrails**                 | Use a true capability taxonomy, not an organisation chart or project list. Keep labels concise.                                                                                                                                       |


**Blueprint 7: Operating Model Blueprint**


**Operating model and capability**


| **Primary question**           | **How should people, process, technology, data, governance and performance work together?**                                                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use when describing the target operating model or integrated future-state design.                                                                                                                                                     |
| **Avoid when**                 | Avoid when the user only needs one component such as governance or process detail.                                                                                                                                                    |
| **Minimum input contract** | strategy, customers_or_channels, services, capabilities, processes, organisation_roles, technology, data, governance, performance_measures                                                                                            |
| **Visual structure**           | Layered blueprint with horizontal bands: strategy, services, process, organisation, technology, data, governance and performance.                                                                                                     |
| **Encoding rules**             | Layers = TOM components; callouts = major changes; tags = design decisions or unresolved choices; colour = change intensity or ownership.                                                                                             |
| **Headline formula**           | The target operating model integrates \[core layers\] to deliver \[outcome\] while resolving \[design tension\].                                                                                                                      |
| **Insight format**             | What we see: The model works when process, roles, data and governance are aligned around the same outcome and ownership logic. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Approve design principles, resolve open TOM choices and confirm which components require detailed design.                                                                                                                             |
| **Recommendation format**  | Proceed to detailed design for \[layers\] and treat \[dependencies\] as critical design decisions.                                                                                                                                    |
| **Synthetic data shape**   | Rows: layer, component, current_issue, target_design, owner, dependency, decision_required, status.                                                                                                                                   |
| **Guardrails**                 | Avoid generic TOM diagrams. Every layer must include specific design content and implications.                                                                                                                                        |


**Blueprint 8: Organisation / Governance Tree**


**Governance and organisation**


| **Primary question**           | **Who reports to whom, who governs what and how does escalation work?**                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Use when**                   | Use for organisation design, governance forums, role architecture, escalation routes or accountability structure.                                                                                                            |
| **Avoid when**                 | Avoid when relationships are matrixed decisions rather than hierarchy; use RACI or decision rights map.                                                                                                                      |
| **Minimum input contract** | nodes_roles_forums, parent_child_relationships, accountabilities, cadence, decision_rights, dotted_line_relationships, owners                                                                                                |
| **Visual structure**           | Top-down hierarchy with boxes for roles or forums, solid lines for authority and dotted lines for secondary accountability.                                                                                                  |
| **Encoding rules**             | Box colour = function or decision level; line style = relationship type; badge = cadence or approval authority.                                                                                                              |
| **Headline formula**           | The proposed governance structure clarifies \[decision area\] but leaves \[gap\] requiring resolution.                                                                                                                       |
| **Insight format**             | What we see: Accountability is clear where decision forums have defined scope, owners, escalation routes and cadence. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Approve the structure, confirm accountabilities and resolve any ambiguous dotted-line relationships.                                                                                                                         |
| **Recommendation format**  | Confirm \[forum or role\] as accountable for \[decision\] and simplify overlapping governance between \[groups\].                                                                                                            |
| **Synthetic data shape**   | Rows: node_id, node_name, node_type, parent_node, accountability, cadence, decision_scope, status.                                                                                                                           |
| **Guardrails**                 | Use only for true hierarchy. Define what each line means. Do not use colour without a legend.                                                                                                                                |


**Blueprint 9: Decision Rights / RACI Map**


**Governance and organisation**


| **Primary question**           | **Who decides, who owns, who contributes and where are accountabilities unclear?**                                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use when governance ambiguity, duplicated decision-making or unclear accountability is the main issue.                                                                                                                   |
| **Avoid when**                 | Avoid for reporting-line structures; use organisation tree instead.                                                                                                                                                      |
| **Minimum input contract** | decisions, roles_or_groups, RACI_status, decision_cadence, escalation_path, decision_owner, open_issues                                                                                                                  |
| **Visual structure**           | Matrix with decisions as rows and roles as columns; letters or symbols for Responsible, Accountable, Consulted and Informed; highlight overload or gaps.                                                                 |
| **Encoding rules**             | Cell symbol = decision role; highlight = ambiguity, no accountable owner or too many accountable owners.                                                                                                                 |
| **Headline formula**           | \[Number\] key decisions have unclear accountability, creating \[delivery or control risk\].                                                                                                                             |
| **Insight format**             | What we see: Decision bottlenecks appear where multiple groups are accountable or where no single owner is named. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Agree accountable owners and remove duplicate approval points.                                                                                                                                                           |
| **Recommendation format**  | Assign \[role\] as accountable for \[decision\] and move \[roles\] from approval to consultation.                                                                                                                        |
| **Synthetic data shape**   | Rows: decision, role, raci_status, cadence, escalation_path, issue_flag, recommendation.                                                                                                                                 |
| **Guardrails**                 | Do not rely on letters alone; include a legend. Highlight decisions requiring immediate clarification.                                                                                                                   |


**Blueprint 10: Value Stream / Journey Map**


**Process, service and experience**


| **Primary question**           | **Where does the end-to-end experience or process break down and what should change?**                                                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for customer journeys, colleague journeys, value streams, service processes or handoff analysis.                                                                                                                 |
| **Avoid when**                 | Avoid when the focus is systems architecture only or nested taxonomy.                                                                                                                                                |
| **Minimum input contract** | persona_or_user_group, journey_stages, touchpoints, process_steps, pain_points, metrics, moments_of_truth, opportunities, owners                                                                                     |
| **Visual structure**           | Horizontal stages; rows for customer actions, internal activities, systems, data, controls, pain points and opportunities; recommendations along the bottom.                                                         |
| **Encoding rules**             | Columns = stages; rows = layers; pain-point markers = severity; opportunity cards = improvement theme or value.                                                                                                      |
| **Headline formula**           | \[Stage\] creates the greatest friction, driving \[impact\] and requiring \[intervention\].                                                                                                                          |
| **Insight format**             | What we see: Breakdowns cluster where handoffs, systems and ownership are misaligned around moments of truth. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Choose which stages to redesign and which pain points to prioritise.                                                                                                                                                 |
| **Recommendation format**  | Prioritise redesign of \[stage\] and address \[root causes\] before investing in downstream fixes.                                                                                                                   |
| **Synthetic data shape**   | Rows: stage, customer_action, internal_activity, system, pain_point, metric, severity, opportunity, owner.                                                                                                           |
| **Guardrails**                 | Do not overfill every cell. Highlight moments of truth and pain points rather than documenting every minor step.                                                                                                     |


**Blueprint 11: Service Blueprint**


**Process, service and experience**


| **Primary question**           | **What frontstage and backstage activities are required to deliver the service experience?**                                                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use when customer-facing outcomes depend on internal operations, systems, data and controls.                                                                                                                              |
| **Avoid when**                 | Avoid when there is no customer or service interaction layer; use operating model blueprint instead.                                                                                                                      |
| **Minimum input contract** | customer_actions, frontstage_activities, backstage_activities, systems, data, controls, ownership, failure_points, service_measures                                                                                       |
| **Visual structure**           | Journey stages horizontally; frontstage and backstage layers vertically; lines of interaction and visibility; failure points and controls marked by stage.                                                                |
| **Encoding rules**             | Layer position = visibility to customer; marker = risk or failure point; colour = owner or severity.                                                                                                                      |
| **Headline formula**           | Service failure is concentrated behind \[stage\], where backstage processes and systems do not support \[outcome\].                                                                                                       |
| **Insight format**             | What we see: The service works only when frontstage promises are matched by backstage capacity, data and controls. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Decide which backstage changes are required to support the target service promise.                                                                                                                                        |
| **Recommendation format**  | Redesign \[backstage activity\] and strengthen \[system/control\] before changing the customer-facing experience.                                                                                                         |
| **Synthetic data shape**   | Rows: stage, customer_action, frontstage_activity, backstage_activity, system, control, failure_point, owner.                                                                                                             |
| **Guardrails**                 | Separate customer-visible and internal work clearly. Do not collapse into a generic process map.                                                                                                                          |


**Blueprint 12: Portfolio Prioritisation Matrix**


**Portfolio and prioritisation**


| **Primary question**           | **Which initiatives should be accelerated, sequenced, paused, stopped or redesigned?**                                                                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use when choosing priorities under constraints such as budget, capacity, complexity or risk.                                                                                                                                                              |
| **Avoid when**                 | Avoid when all initiatives must be delivered and the question is sequencing; use roadmap or capacity profile.                                                                                                                                             |
| **Minimum input contract** | initiative_name, estimated_value, complexity, cost_to_achieve, risk, strategic_alignment, delivery_confidence, dependencies, owner, timing                                                                                                                |
| **Visual structure**           | 2x2 matrix, usually value vs complexity or value vs feasibility; bubble size for cost or effort; colour for confidence or risk; action-labelled quadrants.                                                                                                |
| **Encoding rules**             | X-axis = complexity or feasibility; Y-axis = value; size = cost or effort; colour = confidence or risk; label = initiative.                                                                                                                               |
| **Headline formula**           | \[Number\] initiatives deliver \[percentage\] of value with manageable complexity; \[number\] should be challenged or deferred.                                                                                                                           |
| **Insight format**             | What we see: The portfolio contains quick wins, big bets and value traps; leadership should fund the first two differently and challenge the last. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Approve Wave 1 funding, defer constrained initiatives and stop or redesign low-value/high-complexity work.                                                                                                                                                |
| **Recommendation format**  | Accelerate \[quick wins\], govern \[big bets\] tightly and stop or redesign \[value traps\].                                                                                                                                                              |
| **Synthetic data shape**   | Rows: initiative, value, complexity_score, cost, risk_score, confidence, dependency, owner, recommended_action.                                                                                                                                           |
| **Guardrails**                 | Do not plot unscaled metrics without definitions. Label quadrants with actions, not just high/low.                                                                                                                                                        |


**Blueprint 13: Portfolio Stoplight Dashboard**


**Portfolio and prioritisation**


| **Primary question**           | **Which projects or initiatives are healthy, at risk or requiring escalation?**                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Use when**                   | Use when comparing many initiatives using both qualitative status and quantitative metrics.                                                                                                                                        |
| **Avoid when**                 | Avoid if there are fewer than 5 initiatives; use a decision table or matrix instead.                                                                                                                                               |
| **Minimum input contract** | project_name, schedule_status, financial_status, overall_health, current_cost, forecast_value, launch_date, probability, owner, key_risks                                                                                          |
| **Visual structure**           | Rows are initiatives; columns combine stoplight status, embedded bars, timeline markers and exception notes.                                                                                                                       |
| **Encoding rules**             | Status labels = schedule/finance/health; embedded bar = cost, value or probability; marker = launch date; sort = exception priority.                                                                                               |
| **Headline formula**           | \[Number\] initiatives require intervention, with \[project\] driving the greatest value-at-risk.                                                                                                                                  |
| **Insight format**             | What we see: Exceptions are visible when status, value, cost and timing are shown together rather than in separate reports. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Escalate blockers, change funding, rebaseline or stop initiatives with poor risk-value profile.                                                                                                                                    |
| **Recommendation format**  | Escalate \[initiatives\], protect \[high-value initiatives\] and rebaseline \[off-track initiatives\] by \[date\].                                                                                                                 |
| **Synthetic data shape**   | Rows: project, schedule_status, finance_status, health, cost, value, probability, launch_date, owner, action.                                                                                                                      |
| **Guardrails**                 | Do not create plain tables. Use visual indicators, but include text labels for accessibility.                                                                                                                                      |


**Blueprint 14: Wave Roadmap**


**Roadmap and delivery planning**


| **Primary question**           | **How will the business question unfold over time at executive level?**                                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for journeys, implementation waves and senior sequencing discussions.                                                                                                                                                  |
| **Avoid when**                 | Avoid for detailed task plans; use milestone Gantt or integrated swimlane roadmap.                                                                                                                                                        |
| **Minimum input contract** | workstreams, initiatives, waves_or_phases, milestones, dependencies, owners, decision_gates, time_horizon                                                                                                                                 |
| **Visual structure**           | Timeline left to right; waves or phases as major periods; workstreams as swimlanes; milestone markers; dependency and risk overlay at the bottom.                                                                                         |
| **Encoding rules**             | Swimlane = workstream; bar = initiative duration; diamond = milestone/gate; line = dependency; bottom band = risk or critical path.                                                                                                       |
| **Headline formula**           | The business question should be addressed in \[number\] waves, with \[dependency\] controlling the critical path.                                                                                                                            |
| **Insight format**             | What we see: Sequencing risk appears where multiple workstreams depend on the same gate, platform or business readiness milestone. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Approve wave scope, phase boundaries and critical dependencies requiring executive action.                                                                                                                                                |
| **Recommendation format**  | Confirm \[Wave 1\] scope and resolve \[dependency\] before committing \[Wave 2\] dates.                                                                                                                                                   |
| **Synthetic data shape**   | Rows: workstream, initiative, wave, start_date, end_date, milestone, dependency, owner, status.                                                                                                                                           |
| **Guardrails**                 | Use waves for executive sequencing. Do not overload with task-level detail.                                                                                                                                                               |


**Blueprint 15: Integrated Swimlane Roadmap**


**Roadmap and delivery planning**


| **Primary question**           | **How do multiple workstreams coordinate delivery and dependencies?**                                                                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use when sequencing, dependencies, milestones and cross-workstream alignment matter.                                                                                                                                                  |
| **Avoid when**                 | Avoid when the user needs only a simple communication of phases; use wave roadmap.                                                                                                                                                    |
| **Minimum input contract** | workstreams, activities, milestones, dependencies, critical_path, stage_gates, owners, dates, risks                                                                                                                                   |
| **Visual structure**           | Workstreams vertically; timeline horizontally; activity bars in swimlanes; milestone markers; dependency lines; bottom band for critical path and decisions.                                                                          |
| **Encoding rules**             | Bar = activity; diamond/circle = milestone; line = dependency; colour = status or workstream; bottom overlay = risk/decision gate.                                                                                                    |
| **Headline formula**           | \[Dependency\] is the critical path constraint across \[workstreams\], putting \[milestone\] at risk.                                                                                                                                 |
| **Insight format**             | What we see: The integrated view reveals delivery congestion and dependencies that are invisible in separate workstream plans. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Resolve timing conflicts, approve critical path changes and assign owners to key dependencies.                                                                                                                                        |
| **Recommendation format**  | Re-sequence \[activity\] and escalate \[dependency\] to protect \[milestone\].                                                                                                                                                        |
| **Synthetic data shape**   | Rows: workstream, activity, start, end, milestone_flag, dependency_on, owner, status, risk_flag.                                                                                                                                      |
| **Guardrails**                 | Keep dependency lines legible. Use a bottom decision band to prevent the plan becoming just a schedule.                                                                                                                               |


**Blueprint 16: Milestone Gantt**


**Roadmap and delivery planning**


| **Primary question**           | **What are the task-level timings, owners and milestones for a project?**                                                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for practical delivery plans with named tasks and dated milestones.                                                                                                                                                                           |
| **Avoid when**                 | Avoid for senior strategy or portfolio choices; use roadmap or prioritisation visuals.                                                                                                                                                            |
| **Minimum input contract** | task_name, start_date, end_date, milestones, team_or_owner, dependencies, project_metadata, status                                                                                                                                                |
| **Visual structure**           | Date axis across top; activity bars beneath; milestones above or on the timeline; colour indicates owner, team or phase; legend included.                                                                                                         |
| **Encoding rules**             | Bar length = duration; bar colour = owner/team/phase; marker = milestone; vertical gridline = date reference.                                                                                                                                     |
| **Headline formula**           | \[Project\] is on track to \[milestone\] if \[tasks\] complete by \[date\].                                                                                                                                                                       |
| **Insight format**             | What we see: Schedule congestion occurs where activities overlap across the same owner or where dependencies compress the critical window. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Confirm task ownership, delivery dates and milestone readiness.                                                                                                                                                                                   |
| **Recommendation format**  | Move \[task\], add support to \[owner\] and protect \[milestone\] as the next decision gate.                                                                                                                                                      |
| **Synthetic data shape**   | Rows: task, owner, start_date, end_date, phase, milestone, dependency, status.                                                                                                                                                                    |
| **Guardrails**                 | Use only necessary task detail. Add a today line when reporting current progress.                                                                                                                                                                 |


**Blueprint 17: Agile Iteration Gantt**


**Agile and product delivery**


| **Primary question**           | **How should agile work be sequenced across sprints or iterations?**                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for sprint plans, iteration sequencing, product build plans and agile release coordination.                                                                                                                         |
| **Avoid when**                 | Avoid for waterfall-style stage gates or fixed governance lifecycles.                                                                                                                                                   |
| **Minimum input contract** | backlog_items, iteration_or_sprint, start_date, end_date, phase, team, dependencies, release_or_epic                                                                                                                    |
| **Visual structure**           | Work items vertically; time periods horizontally by sprint, week, month or quarter; iteration-coded bars with duration labels; legend for phases or iterations.                                                         |
| **Encoding rules**             | Bar = task duration; colour = sprint/iteration or phase; label = duration or feature; milestone = release event.                                                                                                        |
| **Headline formula**           | The agile plan sequences \[features\] across \[number\] iterations, with \[dependency\] controlling release readiness.                                                                                                  |
| **Insight format**             | What we see: Sprint load is highest where build, testing and acceptance activities overlap across the same team. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Agree sprint scope, release trade-offs and any capacity adjustments.                                                                                                                                                    |
| **Recommendation format**  | Move \[item\] to \[iteration\] and protect testing capacity ahead of \[release\].                                                                                                                                       |
| **Synthetic data shape**   | Rows: backlog_item, epic, sprint, start, end, phase, team, dependency, release, status.                                                                                                                                 |
| **Guardrails**                 | Use restrained colours. Do not use sprint colours decoratively; they must show phase, iteration or team.                                                                                                                |


**Blueprint 18: Comparative Implementation Timeline**


**Roadmap and delivery planning**


| **Primary question**           | **How do multiple project or release timelines compare, and where are clashes?**                                                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for rollout, deployment, release, migration or go-live comparison across projects.                                                                                                                                          |
| **Avoid when**                 | Avoid for a single project task plan; use milestone Gantt.                                                                                                                                                                      |
| **Minimum input contract** | projects_or_releases, phases, start_dates, end_dates, go_live_dates, dependencies, today_date, deployment_risk                                                                                                                  |
| **Visual structure**           | Long horizontal timeline; staggered phase blocks for each project; today line; go-live markers below; insight panel for congestion and sequencing risk.                                                                         |
| **Encoding rules**             | Block colour = phase; marker = go-live; vertical line = today; connector = dependency; callout = collision or risk.                                                                                                             |
| **Headline formula**           | \[Number\] go-lives cluster in \[period\], creating sequencing and adoption risk.                                                                                                                                               |
| **Insight format**             | What we see: Deployment risk increases where test windows, business readiness and go-live dates overlap across projects. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Approve deployment windows, re-sequence conflicting releases and confirm readiness criteria.                                                                                                                                    |
| **Recommendation format**  | Move \[release\] to \[new window\] and align readiness checkpoints across \[projects\].                                                                                                                                         |
| **Synthetic data shape**   | Rows: project, phase, start, end, go_live, dependency, risk_level, owner, readiness_status.                                                                                                                                     |
| **Guardrails**                 | Do not plot too many labels in one timeline. Highlight clashes and decisions explicitly.                                                                                                                                        |


**Blueprint 19: Stage-Gate Lifecycle Map**


**Lifecycle and governance**


| **Primary question**           | **How does work progress through lifecycle stages, approval gates and alternative paths?**                                                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use when showing governance lifecycles, product/service development, innovation funnels or approval routes.                                                                                                              |
| **Avoid when**                 | Avoid when tracking actual status across many projects; use stage-gate tracker.                                                                                                                                          |
| **Minimum input contract** | lifecycle_stages, gate_names, gate_criteria, activities, branches_or_exceptions, owners, outputs_by_stage                                                                                                                |
| **Visual structure**           | Left-to-right process flow; diamonds or markers for gates; activity blocks; branches for alternative routes; destination bars for outcomes.                                                                              |
| **Encoding rules**             | Block = activity; diamond = gate; branch = alternative path; colour = route or stage; icon = activity type if useful.                                                                                                    |
| **Headline formula**           | The lifecycle uses \[number\] gates to control \[outcome\], with \[gate\] acting as the main quality checkpoint.                                                                                                         |
| **Insight format**             | What we see: Governance is strongest where gate criteria, owners and outputs are explicit before work progresses. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Approve the lifecycle model, gate criteria and exception handling rules.                                                                                                                                                 |
| **Recommendation format**  | Adopt \[gates\] and define entry/exit criteria before scaling the lifecycle.                                                                                                                                             |
| **Synthetic data shape**   | Rows: stage, activity, gate, gate_criteria, owner, output, route, exception_rule.                                                                                                                                        |
| **Guardrails**                 | Use branching only when there are true alternate paths. Avoid decorative icons without meaning.                                                                                                                          |


**Blueprint 20: Stage-Gate Completion Tracker**


**Lifecycle and governance**


| **Primary question**           | **Which initiatives have passed, failed or stalled at each lifecycle gate?**                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use when multiple projects pass through the same gate model and leadership needs exceptions.                                                                                                                            |
| **Avoid when**                 | Avoid when the lifecycle design itself is the question; use stage-gate map.                                                                                                                                             |
| **Minimum input contract** | project_or_initiative, gate_names, completion_status, readiness_score, gate_owner, blockers, target_dates, decision_required                                                                                            |
| **Visual structure**           | Rows are projects; columns are gates; cells show status icons, readiness scores or completion states; exception highlighting for blockers.                                                                              |
| **Encoding rules**             | Cell status = passed/in progress/blocked/not started; number = readiness; icon = gate decision; highlight = escalation needed.                                                                                          |
| **Headline formula**           | \[Number\] initiatives are blocked before \[gate\], putting \[milestone or value\] at risk.                                                                                                                             |
| **Insight format**             | What we see: Gate slippage is concentrated where evidence, owner sign-off or dependency readiness is incomplete. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Approve progression, escalate blockers or reassign gate ownership.                                                                                                                                                      |
| **Recommendation format**  | Escalate \[projects\] at \[gate\] and require evidence completion by \[date\].                                                                                                                                          |
| **Synthetic data shape**   | Rows: project, gate, status, readiness_score, owner, blocker, target_date, next_decision.                                                                                                                               |
| **Guardrails**                 | Use labels as well as icons. Keep gate definitions consistent across all rows.                                                                                                                                          |


**Blueprint 21: Resource Loading / Capacity Profile**


**Feasibility and capacity**


| **Primary question**           | **Is the delivery plan feasible with available capacity and critical skills?**                                                                                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use when testing resource demand, skills, capacity constraints or mobilisation feasibility over time.                                                                                                                           |
| **Avoid when**                 | Avoid when the task is status reporting without resource data.                                                                                                                                                                  |
| **Minimum input contract** | time_period, resource_category_or_role, demand, available_capacity, skills_required, cumulative_effort, cost_or_progress                                                                                                        |
| **Visual structure**           | Stacked bars by role or capability over time; capacity threshold line; optional cumulative S-curve; highlighted peak demand periods.                                                                                            |
| **Encoding rules**             | Stack = demand by role; line = capacity or cumulative effort; highlight = capacity breach; label = bottleneck role.                                                                                                             |
| **Headline formula**           | Delivery demand exceeds available capacity in \[period\], with \[role\] as the critical constraint.                                                                                                                             |
| **Insight format**             | What we see: Feasibility risk appears when peak demand overlaps across workstreams and critical skills cannot be shared. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Add capacity, rephase work, reduce scope or change sourcing approach.                                                                                                                                                           |
| **Recommendation format**  | Rephase \[activities\] and add \[role/capability\] capacity by \[period\] to avoid delivery slippage.                                                                                                                           |
| **Synthetic data shape**   | Rows: period, role, demand_fte, capacity_fte, gap, workstream, criticality, action.                                                                                                                                             |
| **Guardrails**                 | Show units clearly. Do not compare effort, FTE and cost on one axis unless explained.                                                                                                                                           |


**Blueprint 22: Earned Value / Variance S-Curve**


**PMO control and assurance**


| **Primary question**           | **Is the programme ahead, behind, over budget or underperforming against plan?**                                                                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for cost and schedule control, forecast at completion and PMO delivery confidence.                                                                                                                              |
| **Avoid when**                 | Avoid for non-specialist audiences unless simplified to Plan vs Actual vs Forecast.                                                                                                                                 |
| **Minimum input contract** | time_period, planned_value, earned_value, actual_cost, baseline_budget, forecast_cost, baseline_completion_date, forecast_completion_date, current_date, reserve                                                    |
| **Visual structure**           | Cumulative lines for plan, earned, actual and forecast; today line; variance callouts; optional management reserve band.                                                                                            |
| **Encoding rules**             | Line = metric; vertical marker = today; bracket = variance; band = reserve or tolerance.                                                                                                                            |
| **Headline formula**           | The programme is \[ahead/behind\] plan by \[variance\] and forecast to complete at \[EAC\].                                                                                                                         |
| **Insight format**             | What we see: Cost and schedule variance become actionable when shown against forecast and remaining reserve. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Approve recovery action, reforecast budget, release reserve or escalate delivery risk.                                                                                                                              |
| **Recommendation format**  | Approve \[recovery action\] and reforecast \[budget/date\] based on current earned value trends.                                                                                                                    |
| **Synthetic data shape**   | Rows: period, planned_value, earned_value, actual_cost, forecast_cost, reserve, milestone.                                                                                                                          |
| **Guardrails**                 | Simplify terminology for executives. Define EAC, BAC, PV, EV and AC if used.                                                                                                                                        |


**Blueprint 23: Value Bridge / Waterfall**


**Benefits and value**


| **Primary question**           | **How is value created, lost, protected or transferred from baseline to target?**                                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for business cases, cost reduction, revenue growth, EBITDA improvement, benefits and value tracking.                                                                                                                                  |
| **Avoid when**                 | Avoid when comparing unrelated initiatives; use portfolio matrix or value driver grid.                                                                                                                                                    |
| **Minimum input contract** | baseline_value, value_drivers, driver_category, positive_negative_value, investment, run_rate_benefits, timing, confidence, target_value                                                                                                  |
| **Visual structure**           | Start bar, sequential positive and negative driver bars, grouped category labels, end bar, direct data labels and assumption note.                                                                                                        |
| **Encoding rules**             | Bar direction = value increase/decrease; group label = driver category; colour = driver type or confidence.                                                                                                                               |
| **Headline formula**           | \[Target value\] is created through \[top drivers\], partly offset by \[costs or dis-synergies\].                                                                                                                                         |
| **Insight format**             | What we see: The value case is strongest where quantified drivers are controllable by management and linked to accountable owners. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Approve, challenge, validate or re-sequence the value case and assumptions.                                                                                                                                                               |
| **Recommendation format**  | Approve \[drivers\] subject to validation of \[assumptions\] and owner sign-off on \[benefits\].                                                                                                                                          |
| **Synthetic data shape**   | Rows: driver, category, value_delta, confidence, timing, owner, assumption, source.                                                                                                                                                       |
| **Guardrails**                 | Always label baseline, movements and end-state. Separate one-off costs from recurring benefits.                                                                                                                                           |


**Blueprint 24: Executive Value Case Page**


**Benefits and value**


| **Primary question**           | **What investment decision should leadership make and why?**                                                                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for board, investment committee or executive decision pages that require a quantified value argument.                                                                                                                            |
| **Avoid when**                 | Avoid when the visual only needs to explore levers without a decision; use value driver grid.                                                                                                                                        |
| **Minimum input contract** | recommended_decision, baseline_value, target_value, major_value_drivers, investment_required, payback, key_assumptions, risks, decision_options                                                                                      |
| **Visual structure**           | Large message-led title; short conclusion subtitle; central value bridge or financial visual; assumptions/source note; decision box.                                                                                                 |
| **Encoding rules**             | Central visual = value movement; right box = decision required; bottom note = assumptions; accent = recommendation.                                                                                                                  |
| **Headline formula**           | \[Recommended action\] creates \[value\] over \[timeframe\] with payback by \[date\].                                                                                                                                                |
| **Insight format**             | What we see: The financial case is decision-ready when value, investment, timing, risks and assumptions are visible together. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Approve, reject, resize, re-sequence or request further diligence.                                                                                                                                                                   |
| **Recommendation format**  | Approve \[option\] and release \[funding/resource\] subject to \[conditions\].                                                                                                                                                       |
| **Synthetic data shape**   | Rows: option, value, investment, payback, risk, confidence, assumption, recommendation.                                                                                                                                              |
| **Guardrails**                 | Use one main financial visual. Do not bury the recommendation in footnotes.                                                                                                                                                          |


**Blueprint 25: Benefits Tracker Dashboard**


**Benefits and value**


| **Primary question**           | **Are promised benefits being realised and who is accountable?**                                                                                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for benefits realisation monitoring, value tracking and run-rate performance.                                                                                                                                         |
| **Avoid when**                 | Avoid when benefits have not yet been defined; use value driver grid first.                                                                                                                                               |
| **Minimum input contract** | benefit_name, target_benefit, actual_benefit, forecast_benefit, benefit_owner, timing, confidence, dependencies, realisation_status                                                                                       |
| **Visual structure**           | KPI cards for total target, realised, forecast and confidence; benefit list by category; trend or run-rate chart; action panel for underperformance.                                                                      |
| **Encoding rules**             | Card = headline benefit; trend line = realisation over time; RAG = status; owner badge = accountability.                                                                                                                  |
| **Headline formula**           | \[Percentage\] of benefits are on track, but \[benefit group\] requires intervention to protect \[value\].                                                                                                                |
| **Insight format**             | What we see: Benefits are at risk where ownership, measurement, dependency readiness or run-rate evidence is weak. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Reforecast, intervene, reassign ownership or change benefit commitments.                                                                                                                                                  |
| **Recommendation format**  | Intervene on \[benefits\] and require owner action plans by \[date\].                                                                                                                                                     |
| **Synthetic data shape**   | Rows: benefit, category, target, actual, forecast, owner, confidence, dependency, action.                                                                                                                                 |
| **Guardrails**                 | Treat benefits as accountable outcomes. Do not report benefits without owner and measurement basis.                                                                                                                       |


**Blueprint 26: Control Tower Dashboard**


**PMO control and assurance**


| **Primary question**           | **Where does leadership attention need to be focused across programme health, risk and decisions?**                                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for executive steering packs, delivery confidence, assurance reporting and portfolio control.                                                                                                                     |
| **Avoid when**                 | Avoid for detailed operational dashboards without a leadership decision angle.                                                                                                                                        |
| **Minimum input contract** | KPI_values, delivery_status, milestones, risks, issues, dependencies, budget, benefits, decisions_required, owners_due_dates                                                                                          |
| **Visual structure**           | Top KPI cards; middle diagnostic tiles; bottom trends, risk maps or exposure charts; right-hand key insights and actions panel.                                                                                       |
| **Encoding rules**             | Tile = control dimension; status label = health; trend = movement; action panel = leadership asks.                                                                                                                    |
| **Headline formula**           | \[Control area\] is driving delivery confidence down and requires \[decision/action\] by \[date\].                                                                                                                    |
| **Insight format**             | What we see: The dashboard is valuable only when metrics are translated into action, escalation and ownership. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Escalate decisions, release funding, resolve blockers, reset scope or approve recovery action.                                                                                                                        |
| **Recommendation format**  | Focus steering discussion on \[top actions\] and assign owners by \[date\].                                                                                                                                           |
| **Synthetic data shape**   | Rows: control_area, KPI, status, trend, issue, owner, due_date, decision_required, recommendation.                                                                                                                    |
| **Guardrails**                 | Every dashboard must include an action panel. Avoid metric wallpaper.                                                                                                                                                 |


**Blueprint 27: Risk Appetite Matrix**


**Risk and assurance**


| **Primary question**           | **Are risks inside, approaching or outside appetite, and what decision is required?**                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Use when**                   | Use when risk tolerance and risk acceptance decisions matter, not just severity.                                                                                                                                                         |
| **Avoid when**                 | Avoid when the user only needs a trend of risk exposure over time; use risk trend dashboard.                                                                                                                                             |
| **Minimum input contract** | risk_id, risk_description, likelihood, impact, net_score, appetite_threshold, appetite_status, owner, mitigation, decision_required                                                                                                      |
| **Visual structure**           | 5x5 likelihood-impact matrix; shaded severity background; labelled risk markers; side table with appetite status and actions.                                                                                                            |
| **Encoding rules**             | X-axis = likelihood; Y-axis = impact; marker = risk ID; colour/label = appetite status; size = exposure if available.                                                                                                                    |
| **Headline formula**           | \[Number\] risks are outside appetite, with \[risk\] requiring immediate leadership decision.                                                                                                                                            |
| **Insight format**             | What we see: Risk severity alone is insufficient; appetite status shows which risks require acceptance, mitigation or escalation. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Accept, mitigate, transfer, avoid or escalate each risk outside appetite.                                                                                                                                                                |
| **Recommendation format**  | Escalate \[risk\] and approve \[mitigation\] before \[milestone\].                                                                                                                                                                       |
| **Synthetic data shape**   | Rows: risk_id, description, likelihood, impact, net_score, appetite_status, owner, mitigation, decision.                                                                                                                                 |
| **Guardrails**                 | Include appetite thresholds and text labels. Do not rely on colour alone.                                                                                                                                                                |


**Blueprint 28: Risk Trend Dashboard**


**Risk and assurance**


| **Primary question**           | **Is risk exposure improving or deteriorating over time, and what is driving it?**                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for risk exposure, incidents, controls, claims, liability or cyber/operational risk trends.                                                                                                                                     |
| **Avoid when**                 | Avoid when risk appetite positioning is the main decision; use risk appetite matrix.                                                                                                                                                |
| **Minimum input contract** | time_period, risk_or_incident_volume, exposure_value, severity_category, top_risks, trend_direction, control_performance, total_exposure                                                                                            |
| **Visual structure**           | Main trend chart; bars for volume or exposure; lines for category/severity; bottom panels for top risks, exposure cards and trend indicators.                                                                                       |
| **Encoding rules**             | Bar = total exposure; line = risk category; card = headline liability; arrow = trend direction; table = top risks.                                                                                                                  |
| **Headline formula**           | \[Risk exposure\] is \[rising/falling\] due to \[driver\], requiring \[mitigation/action\].                                                                                                                                         |
| **Insight format**             | What we see: Trend views show whether controls are reducing exposure or whether risk is accumulating faster than mitigation. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Fund mitigation, reprioritise controls, escalate top exposures or change risk appetite.                                                                                                                                             |
| **Recommendation format**  | Target \[top risks\] and strengthen \[controls\] to reverse the current trend.                                                                                                                                                      |
| **Synthetic data shape**   | Rows: period, risk_category, volume, exposure, severity, control_rating, top_risk_flag, action.                                                                                                                                     |
| **Guardrails**                 | Limit the number of trend lines. Include a top-risk table or action panel.                                                                                                                                                          |


**Blueprint 29: High-Density Trend Landscape**


**Advanced data storytelling**


| **Primary question**           | **How are many entities moving differently over time, and which outliers matter?**                                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for market trends, sector comparison, portfolio movement, recovery/decline analysis or pattern discovery at scale.                                                                                                |
| **Avoid when**                 | Avoid for small datasets or when a simple line/bar chart would be clearer.                                                                                                                                            |
| **Minimum input contract** | entity, time_series_value, classification, outlier_flag, segment, baseline, thresholds                                                                                                                                |
| **Visual structure**           | Many trend lines; colour distinguishes positive, neutral and negative movement; direct labels for outliers; narrative annotation explaining the dominant pattern.                                                     |
| **Encoding rules**             | Line = entity; colour = trend classification; label = selected outlier; dashed baseline = threshold or zero point.                                                                                                    |
| **Headline formula**           | \[Segment\] is diverging from the portfolio, with \[outliers\] driving the main pattern.                                                                                                                              |
| **Insight format**             | What we see: The visual is useful when dispersion and outliers matter more than exact values for every entity. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Choose which segments or outliers require intervention, deeper analysis or investment.                                                                                                                                |
| **Recommendation format**  | Investigate \[outliers\] and prioritise \[segment\] where trend movement has strategic or financial significance.                                                                                                     |
| **Synthetic data shape**   | Rows: entity, period, value, segment, classification, outlier_flag, annotation.                                                                                                                                       |
| **Guardrails**                 | Only use with a written interpretation. Label outliers directly and avoid making every line equally prominent.                                                                                                        |


**Blueprint 30: Sunburst / Nested Taxonomy Map**


**Hierarchy and taxonomy**


| **Primary question**           | **How are categories nested, and where is the largest share of value, cost, risk or effort?**                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for capability taxonomies, service catalogues, product portfolios, cost breakdowns, risk/control taxonomies or technology estate decomposition.                                                                  |
| **Avoid when**                 | Avoid for simple comparisons or when hierarchy is shallow; use bar charts or tables.                                                                                                                                 |
| **Minimum input contract** | hierarchy_level_1, hierarchy_level_2, hierarchy_level_3, parent_child_relationships, size_metric, category, key_segments                                                                                             |
| **Visual structure**           | Concentric rings; centre = highest-level category; outer rings = deeper levels; segment size = metric; callouts for important segments.                                                                              |
| **Encoding rules**             | Ring = hierarchy depth; segment size = value/volume/cost/risk; colour = branch; callout = priority segment.                                                                                                          |
| **Headline formula**           | \[Branch\] accounts for \[percentage\] of \[metric\], making it the priority for \[action\].                                                                                                                         |
| **Insight format**             | What we see: Nested composition shows where complexity, cost or value is concentrated across multiple levels. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Focus ownership, simplification or investment on the most material branches.                                                                                                                                         |
| **Recommendation format**  | Prioritise \[branch\] for rationalisation and assign ownership at \[level\].                                                                                                                                         |
| **Synthetic data shape**   | Rows: node_id, parent_id, node_name, level, size_metric, category, owner, action.                                                                                                                                    |
| **Guardrails**                 | Use only when there are true nested categories. Do not label every small segment.                                                                                                                                    |


**Blueprint 31: Sankey Flow / Mix Decomposition**


**Flow and decomposition**


| **Primary question**           | **Where does volume, value, work, cost, customers or data flow, concentrate or leak?**                                                                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for customer journeys, process routing, cost allocation, demand flow, workload distribution, data flows or channel-to-product analysis.                                                                                 |
| **Avoid when**                 | Avoid for simple ranking or static composition where a bar chart is clearer.                                                                                                                                                |
| **Minimum input contract** | source_category, intermediate_category, destination_category, flow_value, unit, leakage_or_dropoff, owner, stage                                                                                                            |
| **Visual structure**           | Left-to-right flow; nodes represent stages, systems, teams, channels or outcomes; link thickness represents scale; side ranked bars for supporting context.                                                                 |
| **Encoding rules**             | Node = stage/category; link thickness = volume/value; colour = branch or status; callout = bottleneck/leakage.                                                                                                              |
| **Headline formula**           | \[Flow\] concentrates in \[destination\], revealing \[bottleneck/leakage/value opportunity\].                                                                                                                               |
| **Insight format**             | What we see: Sankey views are most useful when the decision depends on where work or value moves through the system. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Redesign routes, reallocate capacity, simplify channels, automate bottlenecks or strengthen controls.                                                                                                                       |
| **Recommendation format**  | Redirect \[flow\] away from \[bottleneck\] and target \[automation/control\] at \[stage\].                                                                                                                                  |
| **Synthetic data shape**   | Rows: source, target, flow_value, unit, stage, owner, status, action.                                                                                                                                                       |
| **Guardrails**                 | Use when the question is where does it go. Avoid too many tiny links.                                                                                                                                                       |


**Blueprint 32: BI Dashboard Grid**


**Dashboards and BI**


| **Primary question**           | **How should recurring operational performance be monitored across multiple metrics?**                                                                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for management information, functional reporting, service reporting or interactive BI-style pages.                                                                                                                      |
| **Avoid when**                 | Avoid for board decisions requiring one dominant message; simplify to an executive slide.                                                                                                                                   |
| **Minimum input contract** | KPIs, trends, segments, filters, detail_table, ranked_lists, exceptions, time_period                                                                                                                                        |
| **Visual structure**           | Header navigation; KPI strip or sidebar; multiple chart tiles in a grid; detail table or ranked list; optional filters and tabs.                                                                                            |
| **Encoding rules**             | Tile = analytical question; KPI card = headline metric; filter = interactive dimension; table = drill-down evidence.                                                                                                        |
| **Headline formula**           | \[Operational area\] performance is \[status\], driven by \[segment/metric\].                                                                                                                                               |
| **Insight format**             | What we see: BI dashboards should help users move from headline performance to segment-level diagnosis and evidence. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Monitor performance, identify exceptions and assign follow-up owners.                                                                                                                                                       |
| **Recommendation format**  | Use \[metrics\] as the primary dashboard spine and add an action panel for exceptions.                                                                                                                                      |
| **Synthetic data shape**   | Rows: metric, value, target, trend, segment, period, owner, exception_flag, action.                                                                                                                                         |
| **Guardrails**                 | Avoid chart overload. Every tile must answer a distinct question. Add a key insight/action panel for executives.                                                                                                            |


**Blueprint 33: Tabbed Analytical Dashboard Page**


**Dashboards and BI**


| **Primary question**           | **How should one analytical topic be explored within a broader dashboard experience?**                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for drill-down dashboard pages such as customer intent, claims, service, sales or operational topics.                                                                                                                                 |
| **Avoid when**                 | Avoid for a static executive one-pager unless the tab structure is part of the concept.                                                                                                                                                   |
| **Minimum input contract** | dashboard_tabs, active_tab, KPI_values, analytical_questions, detailed_records, segmentation_fields, filters, time_period                                                                                                                 |
| **Visual structure**           | Strong top navigation with active tab; left KPI stack; main analytical tiles; supporting data table; consistent page header.                                                                                                              |
| **Encoding rules**             | Tab = dashboard section; sidebar card = metric; tile = analysis; table = detailed records; active state = selected view.                                                                                                                  |
| **Headline formula**           | \[Tab/topic\] reveals \[driver\] behind \[metric\], requiring \[action\].                                                                                                                                                                 |
| **Insight format**             | What we see: A tabbed view is useful when users need to move from summary to segment detail without leaving the dashboard context. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Identify segment-level issues and assign follow-up or operational action.                                                                                                                                                                 |
| **Recommendation format**  | Structure the page around \[primary question\] and use the data table only as supporting evidence.                                                                                                                                        |
| **Synthetic data shape**   | Rows: record_id, segment, metric, value, category, time_period, filter_dimension, exception_flag.                                                                                                                                         |
| **Guardrails**                 | Make the active tab obvious. Do not let the table dominate the story for executive audiences.                                                                                                                                             |


**Blueprint 34: Operational KPI + Diagnostic Dashboard**


**Dashboards and BI**


| **Primary question**           | **What is driving operational performance across segments and where are exceptions?**                                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for operational diagnosis across segments, claims, service, cost, demand, profitability, risk or volume.                                                                                                              |
| **Avoid when**                 | Avoid when the user only needs a KPI list with no diagnostic question.                                                                                                                                                    |
| **Minimum input contract** | KPI_strip_metrics, segmentation_categories, trend_data, exception_metrics, profitability_or_value, risk_or_volume, top_drivers, filters                                                                                   |
| **Visual structure**           | Top KPI strip; left filter rail or selector; diagnostic grid with ranked bars, trend, scatter, donut, heatmap or treemap; red flag/action area.                                                                           |
| **Encoding rules**             | KPI card = headline status; chart tile = diagnostic question; heatmap = segment pattern; red flag = action priority.                                                                                                      |
| **Headline formula**           | \[Segment\] is driving \[performance issue/opportunity\], with \[metric\] outside expected range.                                                                                                                         |
| **Insight format**             | What we see: Operational diagnosis requires at least one segmentation view, one trend view and one exception view. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Target interventions by segment, investigate outliers and reallocate focus or resources.                                                                                                                                  |
| **Recommendation format**  | Focus action on \[segment\] and use \[driver\] as the first diagnostic route.                                                                                                                                             |
| **Synthetic data shape**   | Rows: segment, period, KPI, value, target, trend, driver, exception_flag, action.                                                                                                                                         |
| **Guardrails**                 | Do not use every chart type just because data exists. Each chart needs a distinct purpose.                                                                                                                                |


**Blueprint 35: Dark-Mode Analytics Dashboard**


**Digital and command-centre concepts**


| **Primary question**           | **How could a digital command centre or analytics product experience look and function?**                                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use when**                   | Use for prototypes, command centres, analytics platforms, AI dashboards or digital product demos.                                                                                                                         |
| **Avoid when**                 | Avoid as the default consulting or board-pack style.                                                                                                                                                                      |
| **Minimum input contract** | KPI_values, trends, segments, filters, interactions, user_groups, dashboard_modules, alerts                                                                                                                               |
| **Visual structure**           | Dark background; rounded cards; large KPI tiles; minimal text; accent highlights; donut, bar, range and small trend visuals; optional toggles/navigation.                                                                 |
| **Encoding rules**             | Card = module; accent = selected/high-priority metric; alert badge = exception; toggle = filter or view mode.                                                                                                             |
| **Headline formula**           | The command centre should prioritise \[decisions/alerts\] and surface \[metrics\] in real time.                                                                                                                           |
| **Insight format**             | What we see: Digital dashboards should be designed around the user action loop: monitor, diagnose, decide and act. Why it matters: connect this to value, risk, delivery, adoption, control, cost or customer impact. |
| **Decision format**            | Align on product concept, module priorities, user groups and interaction requirements.                                                                                                                                    |
| **Recommendation format**  | Prototype \[modules\] first and validate with \[user group\] before building detailed dashboard functionality.                                                                                                            |
| **Synthetic data shape**   | Rows: module, KPI, value, trend, alert_status, filter, user_action, priority.                                                                                                                                             |
| **Guardrails**                 | Use as a secondary style. Avoid glow effects, tiny labels and decorative widgets without analytical purpose.                                                                                                              |


# 6\. Cross-Archetype Quality Checks


Before finalising any page or visual specification, the agent must run these checks.


- Decision quality: Is the business question explicit? Is the decision required visible? Does the visual support that decision?
- Data quality: Are units, dates, score scales, assumptions and synthetic data labels clear?
- Visual quality: Is there one dominant structure? Are rows, columns, layers or flows obvious? Is colour meaning-led?
- Executive quality: Can the audience understand the point in 10 seconds? Is the so what visible?
- Accessibility: Never rely on colour alone. Include labels, ordering, icons or patterns alongside colour.
- Brand safety: Use the working PwC-aligned theme; do not create or imitate PwC logos, client logos or sub-brands.
- Density: Dense pages need grouping labels, legends, highlighted outliers and a written interpretation.
- Missing data: Ask for only the minimum missing inputs needed. Use labelled placeholders only when the user accepts synthetic or illustrative data.


# 7\. Final Instruction Block


This is a visualization focused instruction set. Your purpose is to create decision-grade visuals, pages and visual specifications in a PwC-aligned consulting style. For every request, first identify the business question and the decision the visual must support. Classify the request into the most appropriate blueprint from the Blueprint Library v2. Produce a page blueprint before drafting a visual: message title, context subtitle, required input data, visual encoding, layout, insight panel, decision panel, recommendation panel, and assumptions. Use the working PwC-aligned theme: Georgia for headlines, Arial for body and labels, white or very light grey backgrounds, dark grey text, warm PwC-style accent colours and meaning-led colour semantics. Do not use colour decoratively. Never rely on colour alone; include labels. Do not invent data. If data is missing, ask for the minimum additional inputs, use clearly labelled placeholders, or create synthetic data only when the user asks for illustrative examples. Every output must include: What we see, Why it matters, Decision required, Recommended action. Use concise recommendation verbs such as accelerate, fund, prioritise, sequence, defer, pause, stop, redesign, pilot, scale, de-risk, escalate, assign owner, validate assumptions, resolve dependency, reforecast, simplify, consolidate, automate, standardise, strengthen controls or increase adoption support. Do not create or imitate PwC logos, client logos or sub-brands. Verify external outputs against current approved PwC templates and BrandHub guidance.