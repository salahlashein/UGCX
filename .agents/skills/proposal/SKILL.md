---
name: proposal
description: Proposal html/css template for creating a proposal for a project or feature. It is a single html file with embedded css and lightweight js for tabs and interactions. It is a decision document, not a technical specification. The Home tab is business-led. Technical depth belongs in later tabs. Use mermaid for architecture, sequence, ERD, and Gantt diagrams. Use a chart CDN only when a chart materially improves understanding. Use this when the user asks for a proposal, building a visual version of the plan.md file.
---
# AI Agent Proposal Generator


## Purpose


This template instructs an AI agent to generate an interactive, senior-leadership-ready HTML proposal for an application requested by a business team. The proposal must connect the business problem to the proposed product, architecture, data model, delivery plan, resourcing model, cost range, options, governance, and a small number of explicit decisions.


The output is a single responsive HTML file with embedded CSS and lightweight JavaScript for tabs and interactions. Use Mermaid for architecture, sequence, ERD, and Gantt diagrams. Use a chart CDN only when a chart materially improves understanding.


The proposal is a decision document, not a technical specification. The Home tab is business-led. Technical depth belongs in later tabs.


---


## 1. Agent Operating Instructions


### 1.1 Required behaviour


1. Review all user-provided briefs, notes, files, diagrams, screenshots, data dictionaries, and existing proposals before drafting.
2. Extract facts, assumptions, gaps, constraints, risks, dependencies, desired outcomes, target users, expected integrations, data entities, and decision points.
3. Separate:
   - Confirmed fact
   - User-provided estimate
   - Agent-derived assumption
   - Recommendation
   - Open question
4. Never invent metrics, prices, dates, architecture approvals, benefits, licences, or team availability.
5. If a value is unknown, use a labelled placeholder such as `[TBC: daily rate]` or provide a clearly labelled illustrative range.
6. Ask only material questions that change scope, architecture, cost, timeline, risk, or the executive decision. Consolidate questions into one short intake.
7. Produce a complete first draft when enough information exists. Put unresolved items in an Assumptions and Open Decisions panel.
8. Keep the proposal concise, visual, and navigable. Do not reproduce all source content.
9. Ensure the business case and cost model reconcile with the architecture, ERD, feature scope, and timeline.
10. Every proposed option must be viable and must state its trade-offs, cost impact, time impact, dependencies, and recommendation.


### 1.2 Mandatory intake


Collect or infer, with explicit assumption labels:


- Proposal title and business sponsor
- Business team and intended audience
- Problem statement and current process
- Target users and indicative user volume
- Desired outcomes and success measures
- In-scope and out-of-scope capabilities
- Required channels, especially Teams, web, mobile, and M365
- Data sources, file types, systems of record, integrations, and actions
- Data classification, retention, residency, confidentiality, and access model
- Expected architecture route, if known
- Required delivery date or planning horizon
- Available people, skills, and budget constraints
- Preferred currency and applicable rate card
- Known licence, infrastructure, model, and support costs
- Governance and approval requirements
- Decision required from leadership


### 1.3 Resourcing and cost rule


Resourcing and cost are optional only when the request is explicitly a product vision without a business case.


If the user selects a project overview or proposal option, ask once:


> Do you want the proposal to include resourcing and cost so it can support a business case?


If yes, collect the rate card, currency, working-day convention, contingency policy, licence assumptions, environment count, support model, and whether tax is included. If not supplied, generate structure and formulas with `[TBC]` values. Never fabricate commercial rates.


---


## 2. Deliverable Contract


### 2.1 Output format


Generate one self-contained `.html` file containing:


- Semantic HTML5
- Embedded CSS only for styling
- Minimal vanilla JavaScript for tabs, accordions, filters, and print behaviour
- Mermaid CDN for diagrams
- Optional Chart.js CDN for quantitative charts
- No external UI framework
- No external fonts unless explicitly approved
- No raster images unless supplied by the user
- Responsive layout and print stylesheet
- Accessible keyboard navigation and visible focus states


### 2.2 Tab structure


Use this order unless the content requires a justified variation:


1. Home
2. Business Case
3. Features
4. Options
5. Delivery Plan
6. Resourcing
7. Costs
8. Architecture
9. Data Model
10. Governance
11. The Ask


If resourcing and costs are excluded, hide those tabs and add a short note in Business Case stating that commercial sizing is outside the current scope.


### 2.3 Content hierarchy


Each tab should follow this pattern:


1. Eyebrow label
2. Decision-oriented headline
3. One-sentence executive summary
4. Primary visual
5. Three to five key points
6. Assumptions or caveats
7. Optional detail disclosure


No tab should begin with a dense paragraph.


---


## 3. Layout and Structure


### 3.1 Global shell


- Sticky top navigation with proposal title, status pill, tab buttons, and optional print button.
- Maximum content width: 1200 to 1280 px.
- Desktop grid: 12 columns.
- Tablet: 6 columns.
- Mobile: 1 column.
- Section spacing: 64 to 80 px desktop, 40 to 52 px mobile.
- Card gap: 16 to 24 px.
- Use progressive disclosure for detail.
- Maintain a consistent reading path from business value to delivery evidence to decision.


### 3.2 Home tab


The Home tab must be business-focused and leadership-friendly. Include:


- Status badge such as `Draft for review`
- Product name and outcome-led headline
- One-sentence proposition, maximum 35 words
- “What we propose to build” visual with 3 to 5 capability cards
- 3 or 4 KPI cards using only verified values or labelled targets
- Why now
- Target users and business process
- Recommended route in one sentence
- Top risks or dependencies, maximum 3
- The 1 to 3 decisions needed, shown as compact preview cards


Avoid technical component names on the Home tab unless they are essential to the decision.


### 3.3 Business Case tab


Include:


- Current-state challenge
- Consequence of doing nothing
- Future-state outcome
- Value drivers
- Benefits chain: capability → behavioural change → operational outcome → measure
- Baseline, target, source, owner, and confidence for each benefit
- One-off cost, recurring cost, internal effort, and cost range
- Payback or ROI only when inputs are available
- Assumptions and sensitivity drivers
- Recommended success measures


Use a metric ladder, benefit cards, or a waterfall. Do not claim savings without a baseline and calculation.


### 3.4 Features tab


Group features into 4 to 7 capability areas. For each:


- Capability name
- User need
- Key features
- Business outcome
- Delivery phase
- Priority: Must / Should / Could / Later
- Dependencies
- Acceptance signal
- Recommended phase


Show no more than 12 feature cards initially. Put full backlog detail behind an accordion or secondary table.


### 3.5 Options tab


Provide 2 or 3 credible options, normally:


- Option A: managed/ Buy not build / low-code / Teams/copilot-first
- Option B: hybrid
- Option C: custom application


Compare:


- User experience
- Functional fit
- Data and integration fit
- Security and governance
- Speed to value
- Extensibility
- Delivery complexity
- Run and support burden
- Indicative one-off cost
- Indicative recurring cost
- Key risk


Clearly mark one recommendation and explain why. Avoid false precision.


### 3.6 Delivery Plan tab


Include both:


- Roadmap table: phase, objective, features, deliverables, outcome, exit gate
- Gantt view: workstreams, phases, dependencies, milestones, governance gates


Recommended workstreams:


- Product and UX
- Platform and integration
- Data and knowledge
- AI and agent behaviour
- Security and governance
- Testing and adoption
- PMO and change


Every phase must produce a usable, reviewable outcome grouped by value. Dates are indicative unless confirmed.


### 3.7 Resourcing tab


Derive the team from the solution work packages, not from a generic staffing pattern.


Show:


- Role
- Why the role is needed
- Key deliverables
- Phase involvement
- Allocation as FTE or days
- Location or delivery model if relevant
- Rate source
- Cost
- Named or TBC


Typical role library, use only when justified:


- Product Owner / Business Lead
- Engagement or Delivery Lead
- Product Manager / Business Analyst
- Solution Architect
- Data Architect
- UX/UI Designer
- Front-end Engineer
- Back-end Engineer
- AI / Agent Engineer
- Data Engineer
- QA / Test Engineer
- DevOps / Platform Engineer
- Security / Risk Specialist
- Change and Adoption Lead
- Subject Matter Expert
- Support / Service Owner


Also show a phase-by-role heatmap and a concise RACI for major decisions.


### 3.8 Costs tab


Costs are purely initial draft estimations, make that very vlear.
Calculate the sum of the parts. Use the following model:


`Labour cost = Σ(role days × day rate)`


`Platform setup = environments + networking + identity + monitoring + deployment setup`


`Usage cost = model tokens + search/indexing + storage + compute + messaging + observability`


`Licence cost = Σ(licence quantity × unit price × period)`


`Third-party cost = APIs + data providers + specialist tools`


`Change cost = training + communications + onboarding + documentation`


`Contingency = approved percentage × eligible cost base`


`One-off total = labour + setup + migration + testing + change + contingency`


`Annual run cost = hosting + licences + usage + support + maintenance + governance operations`


`Year 1 total = one-off total + annual run cost`


Present:


- Executive cost summary cards
- Cost by category
- Cost by phase
- Cost by role
- One-off vs recurring
- Option comparison
- Low / expected / high range
- Explicit assumptions
- Exclusions
- Sensitivity drivers


Reconciliation rule: totals in cards, charts, option tables, and resourcing tables must match exactly.


### 3.9 Architecture tab


Order technical content from simplest to deepest:


1. Business view: User → Experience → Intelligence → Data → Outcomes
2. System context diagram
3. Container or service diagram
4. Key sequence diagrams
5. Integration catalogue
6. Security and trust boundaries
7. Non-functional requirements
8. Architecture decisions and trade-offs


Required Mermaid examples:


```mermaid
flowchart LR
  U[Business user] --> X[Teams or web experience]
  X --> A[Agent orchestration]
  A --> K[Approved knowledge]
  A --> T[Tools and workflows]
  T --> S[Systems of record]
  A --> O[Structured output]
```


```mermaid
sequenceDiagram
  actor U as User
  participant UI as Teams or Web
  participant A as Agent
  participant R as Retrieval
  participant T as Tool
  U->>UI: Submit request
  UI->>A: Send context and intent
  A->>R: Retrieve authorised evidence
  R-->>A: Evidence and citations
  A->>T: Execute approved action if needed
  T-->>A: Result
  A-->>UI: Structured response
```


### 3.10 Data Model tab


Start from business objects and trace them to architecture services.


Include:


- Core entities and definitions
- ERD
- Ownership and system of record
- Data classification
- Retention and deletion
- Access rules
- Audit fields
- Volume assumptions
- Data quality risks
- Integration mappings


ERD example:


```mermaid
erDiagram
  PROJECT ||--o{ WORKSPACE : contains
  WORKSPACE ||--o{ USER_MEMBERSHIP : grants
  WORKSPACE ||--o{ SOURCE_DOCUMENT : ingests
  SOURCE_DOCUMENT ||--o{ CHUNK : produces
  WORKSPACE ||--o{ CONVERSATION : hosts
  CONVERSATION ||--o{ MESSAGE : contains
  MESSAGE ||--o{ CITATION : supports
  WORKSPACE ||--o{ ARTIFACT : generates
  ARTIFACT ||--o{ APPROVAL : requires
  WORKSPACE ||--o{ COST_ESTIMATE : sizes
```


The ERD must influence cost and staffing. More entities, workflows, audit requirements, integrations, or retention rules should increase the relevant engineering, testing, architecture, and governance effort.


### 3.11 Governance tab


Cover:


- Data classification and permitted use
- Identity, RBAC, and workspace isolation
- Retrieval permission trimming
- Human review and approval
- Accuracy, citations, confidence, and assumption labels
- Prompt injection and unsafe action controls
- Logging, audit, and incident ownership
- Retention and deletion
- Model, prompt, template, and knowledge versioning
- Evaluation and release gates
- Support and service ownership
- Required internal approvals


Show governance as delivery gates, not a final checklist.


### 3.12 The Ask tab


End with 1 to 3 yes/no decisions. Each ask must include:


- A direct yes/no question
- Why the decision is needed now
- What “yes” authorises
- What “no” means
- Decision owner
- Decision date, if known


Examples:


1. **Direction:** Do you approve the recommended solution route as the basis for detailed design? Yes / No
2. **Funding:** Do you approve funding for the proposed discovery or MVP phase within the stated range? Yes / No
3. **Ownership:** Will the business nominate a Product Owner and SMEs for the proposed allocation? Yes / No


Do not use vague asks such as “provide feedback”.


---


## 4. Design System


### 4.1 Colour tokens


Use a restrained PwC-inspired palette. Do not imply formal brand approval.


```css
:root {
  --orange: #D04A02;
  --dark-orange: #B8390E;
  --tangerine: #EB8C00;
  --yellow: #FFB600;
  --ink: #1A1A1A;
  --charcoal: #2D2D2D;
  --mid-grey: #6F6F6F;
  --line: #DEDAD5;
  --soft: #F7F5F2;
  --warm: #FFF4ED;
  --white: #FFFFFF;
  --green: #2E7D32;
  --red: #C62828;
  --blue: #2C6FB7;
  --shadow: 0 10px 30px rgba(0,0,0,.08);
  --radius: 16px;
}
```


Rules:


- Orange is the primary accent and decision colour.
- Yellow and tangerine are secondary emphasis colours.
- Charcoal supports technical and executive panels.
- Green means validated or positive, red means risk or blocked, blue means informational.
- Never rely on colour alone. Add labels and icons.
- Use gradients sparingly, only in hero or ask panels.


### 4.2 Typography


- Use Segoe UI, Arial, or system sans-serif.
- Optional serif only for major display headings, never for body copy.
- H1: 42 to 56 px desktop, 34 to 40 px mobile.
- H2: 28 to 38 px.
- H3: 18 to 22 px.
- Body: 15 to 17 px.
- Small labels: 11 to 13 px.
- Maximum line length: 70 to 80 characters.
- Use sentence case for headings.


### 4.3 Cards


Use cards for discrete, comparable information. Available patterns:


- KPI card: value, label, source, confidence
- Capability card: icon, feature, outcome, phase
- Option card: route, fit, trade-off, cost range
- Risk card: risk, impact, mitigation, owner
- Ask card: yes/no question, implication
- Assumption card: value, owner, validation date
- Architecture layer card: component, responsibility, interfaces
- Cost card: category, amount, basis, range


Card rules:


- One message per card.
- 12 to 22 words of body copy where possible.
- Maximum 5 cards per row.
- Use borders and spacing before shadows.
- Avoid decorative emoji in formal client output unless the user requests them.


### 4.4 Tables


Use tables only for comparison or precise detail. Keep narrative outside tables. Use sticky headers for long tables and horizontal scrolling on mobile.


### 4.5 Interaction


- Tabs use buttons with `aria-selected` and keyboard navigation.
- Accordions default closed except the first.
- Diagrams may have “Business view” and “Technical view” toggles.
- Roadmap may toggle between table and Gantt.
- Costs may toggle between option, phase, role, and category.
- Print mode expands all required content and removes controls.
- Do not use animations longer than 200 ms.


---


## 5. Visual and Chart Selection


Use visuals to answer a question, not decorate a page.


| Question | Preferred visual |
|---|---|
| What is the headline value? | KPI cards |
| Where does value come from? | Benefit chain or waterfall |
| Which option is best? | Comparison table plus recommendation card |
| What will be delivered when? | Roadmap table and Gantt |
| Where is effort concentrated? | Stacked bar by phase and role |
| What drives cost? | Horizontal bar or stacked column |
| One-off vs recurring? | Stacked column |
| How does the solution work? | Mermaid flowchart |
| What happens during a request? | Mermaid sequence diagram |
| How is data related? | Mermaid ERD |
| What are the biggest risks? | Heatmap only when likelihood and impact are defined |
| How does scope change by option? | Feature-fit matrix |


Chart rules:


- Maximum 6 categories without grouping.
- Start bar charts at zero.
- Avoid pie/donut charts with more than 5 segments.
- Avoid 3D charts, gauges, radar charts, and decorative infographics.
- Label units and currency.
- Show source and assumption below every quantitative chart.
- If data is insufficient, show a placeholder card, not a fabricated chart.


---


## 6. Tone and Editorial Rules


### 6.1 Tone


Use a consulting tone that is:


- Executive
- Evidence-led
- Direct
- Neutral but recommendation-oriented
- Plain English
- Respectful of uncertainty
- Business-first, technically credible


### 6.2 Writing rules


- Lead with the answer.
- Use active voice.
- Prefer short sentences.
- Use outcome-led headings such as “Reduce manual triage while preserving review control”.
- Limit paragraphs to 2 or 3 sentences.
- Use 3 to 5 bullets per section.
- Define acronyms on first use.
- Label all estimates and assumptions.
- Distinguish target, forecast, commitment, and actual.
- Avoid hype such as revolutionary, seamless, effortless, guaranteed, game-changing, or fully autonomous.
- Avoid “just a chatbot”. Describe the product pattern precisely.
- Use British English unless the user requests otherwise.


### 6.3 Density budget


- Home: maximum 350 visible words.
- Each other tab: maximum 500 visible words before progressive disclosure.
- Maximum 4 KPI cards in one strip.
- Maximum 5 bullets in a card.
- Maximum 3 asks.
- Technical appendices may be denser but must not be the default view.


---


## 7. Estimation Logic


### 7.1 Work breakdown derived from architecture


Estimate at component and work-package level:


1. Experience layer
2. Agent orchestration
3. Retrieval and knowledge
4. Data model and persistence
5. Integrations and actions
6. Identity and access
7. Governance and audit
8. Platform and deployment
9. Testing and evaluation
10. Change, documentation, and support transition


For each component, score:


- Complexity: Low / Medium / High
- Novelty: Known / Adapted / New
- Integration count
- Data sensitivity
- Workflow criticality
- Availability and performance need
- Test burden


Map these drivers to role-days using an approved estimation matrix. Do not silently convert T-shirt sizes into money.


### 7.2 ERD-derived effort checks


Add effort where the model includes:


- Multi-tenant or workspace isolation
- Many-to-many permissions
- Approval state machines
- Versioned artifacts
- Audit and lineage
- Retention and deletion rules
- High-volume interactions
- Complex integration mappings
- Historical migration
- Reporting aggregates


### 7.3 Cost ranges


Use low / expected / high ranges when uncertainty exists.


- Low: confirmed scope, reused assets, minimal integrations
- Expected: likely scope and normal delivery overhead
- High: unresolved integrations, governance, migration, or custom UX


State which assumptions move the estimate between ranges.


---


## 8. Quality Gates


Before final output, verify:


### Content


- Business problem, users, outcomes, scope, and recommendation are clear.
- Every quantitative claim has a source or assumption label.
- Options are genuinely different.
- Timeline, features, architecture, ERD, resources, and costs align.
- The proposed team covers every major work package.
- The asks are answerable yes/no.


### Commercial


- Labour totals equal role days × rates.
- Phase totals equal the sum of work packages.
- One-off and recurring costs are separate.
- Currency and tax basis are stated.
- Contingency basis is stated.
- All totals reconcile across cards, tables, and charts.


### Design


- Home is understandable in under two minutes.
- No section is text heavy.
- The visual hierarchy is consistent.
- Colours have sufficient contrast.
- Mobile and print layouts work.
- Tabs and controls are keyboard accessible.


### Technical


- Mermaid syntax renders.
- ERD entities match the architecture and feature set.
- Sequence diagrams cover important user journeys.
- Security boundaries and systems of record are identified.
- Unknown technologies are marked TBC, not invented.


---


## 9. Agent Output Skeleton


Use this skeleton to generate the final proposal:


```text
Proposal metadata
├── Title, sponsor, team, status, date, version
├── Sources reviewed
└── Assumptions and open questions


Home
├── Outcome-led proposition
├── What we propose to build
├── Verified KPIs or targets
├── Why now
├── Recommended route
└── Decision preview


Business Case
├── Challenge and do-nothing impact
├── Value drivers and benefits chain
├── Success measures
├── Cost summary
└── Assumptions and sensitivities


Features
├── Capability groups
├── Prioritised features
├── User journeys
└── Acceptance signals


Options
├── 2–3 viable routes
├── Feature-fit comparison
├── Cost and timeline comparison
└── Recommendation


Delivery Plan
├── Phases and workstreams
├── Roadmap table
├── Gantt
├── Dependencies
└── Exit gates


Resourcing
├── Team model
├── Role-days / FTE by phase
├── RACI
└── Delivery assumptions


Costs
├── One-off total
├── Annual run cost
├── By role / phase / category
├── Low / expected / high
└── Exclusions and sensitivities


Architecture
├── Business view
├── System context
├── Service view
├── Sequences
├── Integrations
└── Non-functional requirements


Data Model
├── Entity definitions
├── ERD
├── Ownership and classification
├── Retention and access
└── Data quality and migration


Governance
├── Controls
├── Evaluation
├── Approval gates
├── Support model
└── Residual risks


The Ask
├── Ask 1: yes / no
├── Ask 2: yes / no
└── Ask 3: yes / no
```


---


## 10. Example Executive Copy Pattern


**Headline:** Create a governed knowledge and workflow assistant that helps teams find approved guidance, complete repeatable tasks, and produce review-ready outputs in one place.


**Recommendation:** Start with a Teams-first managed pilot to validate adoption, retrieval quality, and workflow fit. Retain a hybrid path if structured state, custom visualisations, or complex integrations prove necessary.


**Value statement:** The initial release focuses on faster access to trusted knowledge, more consistent delivery, and reusable output generation. Financial benefits remain directional until current effort and rework baselines are validated.


**Cost statement:** The estimate is built from architecture work packages, role-days, platform services, licences, testing, governance, and support. Commercial values remain subject to the approved rate card and final integration scope.


**Ask:** Do you approve the recommended route as the basis for detailed design and MVP sizing? Yes / No.

