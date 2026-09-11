---
name: draw-io-diagram-generator
description: Use when creating, editing, or reviewing `.drawio`, `.drawio.svg`, or `.drawio.png` files. Covers mxGraph XML authoring, templates, layout, style rules, supported diagram types, validation, and draw.io-specific troubleshooting.
---


# Draw.io Diagram Authoring


Use this skill to create, edit, validate, and review draw.io diagram files that open cleanly in the draw.io VS Code extension, the web app, or the desktop app.


## When to use


- Use when a task asks for a diagram, flowchart, architecture view, sequence diagram, ERD, UML diagram, network topology, BPMN workflow, or mind map in draw.io format.
- Use when a task mentions `.drawio`, `.drawio.svg`, `.drawio.png`, `mxGraph XML`, or draw.io rendering issues.
- Use when updating an existing draw.io diagram and preserving valid cell ids, container hierarchy, geometry, and styles matters.


## Supported outputs


- `.drawio` for version-controlled editable diagrams.
- `.drawio.svg` for embeddable diagrams that still preserve draw.io metadata.
- `.drawio.png` when a PNG with embedded draw.io data is required.


## Supported diagram types


| Diagram type | Template | Notes |
| --- | --- | --- |
| Flowchart | `assets/templates/flowchart.drawio` | Process flows, decisions, and branches |
| System architecture | `assets/templates/architecture.drawio` | Multi-tier or layered service architecture |
| Sequence diagram | `assets/templates/sequence.drawio` | Lifelines, activations, and message flow |
| ER diagram | `assets/templates/er-diagram.drawio` | Tables and crow's-foot relationships |
| UML class diagram | `assets/templates/uml-class.drawio` | Classes, interfaces, enums, and relationships |
| Network topology | Use shape libraries | Routers, firewalls, subnets, and servers |
| BPMN workflow | Use shape libraries | Events, tasks, gateways, pools, and lanes |
| Mind map | Manual layout | Central topic with radiating branches |


## Non-negotiables


- Always produce valid mxGraph XML.
- Always include `<mxCell id="0" />` and `<mxCell id="1" parent="0" />` as the first two cells in every diagram page.
- Always use unique cell ids within a diagram page.
- Always give every vertex a child `<mxGeometry ... as="geometry" />`.
- Always ensure every edge references valid endpoints, unless it is a deliberate floating edge such as a sequence lifeline.
- Always keep `parent` references valid.
- Always use `html=1` when a label contains HTML.
- Always escape XML special characters inside attribute values.
- Always keep child coordinates relative to their parent container.
- Always align layouts to the 10px grid unless there is a compelling diagram-specific reason not to.
- Always add a title text cell at the top of each page.


## Preferred workflow


1. Identify the diagram type, entities, relationships, output path, and whether the file is new or existing.
2. Start from a template when one fits.
3. Plan the layout before writing XML.
4. Generate or edit the mxGraph XML.
5. Validate structure and rendering.
6. Hand off the file with a short summary and opening instructions.


See `references/workflow-and-validation.md` for the detailed step-by-step workflow, editing rules, troubleshooting, validation checklist, and delivery format.


## Minimal valid skeleton


```xml
<!-- Set modified to the current ISO 8601 timestamp when generating a new file -->
<mxfile host="Electron" modified="" version="26.0.0">
  <diagram id="page-1" name="Page-1">
        <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1"
                      tooltips="1" connect="1" arrows="1" fold="1"
                      page="1" pageScale="1" pageWidth="1169" pageHeight="827"
                      math="0" shadow="0">
          <root>
            <mxCell id="0" />
            <mxCell id="1" parent="0" />
          </root>
        </mxGraphModel>
  </diagram>
</mxfile>
```


## Core style rules


- Use `whiteSpace=wrap;html=1;` on vertex shapes by default.
- Prefer `edgeStyle=orthogonalEdgeStyle;html=1;` for general connectors.
- Use the semantic palette consistently across a project.


| Role | fillColor | strokeColor |
| --- | --- | --- |
| Primary / Info | `#dae8fc` | `#6c8ebf` |
| Success / Start | `#d5e8d4` | `#82b366` |
| Warning / Decision | `#fff2cc` | `#d6b656` |
| Error / End | `#f8cecc` | `#b85450` |
| Neutral / Interface | `#f5f5f5` | `#666666` |
| External / Partner | `#e1d5e7` | `#9673a6` |


See `references/style-reference.md` for the full style-key catalog and `references/shape-libraries.md` for exact shape strings.


## Layout defaults


- Use 40–60px horizontal spacing between peer shapes.
- Use 80–120px vertical spacing between rows or tiers.
- Use `120x60` for common process boxes.
- Use a larger footprint, such as `200x100`, for decision diamonds.
- Use A4 landscape `1169x827` as the default page size unless the diagram needs another format.
- Keep one main topic per page and split large diagrams across multiple pages.
- Aim for 40 or fewer cells per page for readability.


## Diagram-specific notes


- Use swimlanes for layered architecture and containerized UML layouts.
- Use floating edges with `sourcePoint` and `targetPoint` for sequence lifelines.
- Use `shape=table` and row children for ER diagrams.
- Use the correct relationship arrow styles for UML and ER connectors.


See `references/diagram-recipes.md` for flowchart, architecture, sequence, ER, UML, and multipage recipes with XML snippets.


## Validation and tooling


- Use the draw.io VS Code extension `hediet.vscode-drawio` when available.
- Use Python 3.8+ tooling when validation or scripted shape insertion is helpful.


```bash
python .github/skills/draw-io-diagram-generator/scripts/validate-drawio.py <file.drawio>
python .github/skills/draw-io-diagram-generator/scripts/add-shape.py <file.drawio> "New Shape" 100 100
```


See `scripts/README.md` for validator and helper script usage.


## Reference map


| File | Use when |
| --- | --- |
| `references/workflow-and-validation.md` | You need the detailed workflow, editing rules, troubleshooting matrix, validation checklist, or handoff format. |
| `references/diagram-recipes.md` | You need diagram-type recipes, XML snippets, or relationship style guidance. |
| `references/drawio-xml-schema.md` | You need the complete mxfile, mxGraphModel, mxCell, geometry, layer, and container schema. |
| `references/style-reference.md` | You need the full style key catalog, edge styles, arrow types, or shape catalog. |
| `references/shape-libraries.md` | You need exact shape-library strings across flowchart, UML, ER, networking, BPMN, and other libraries. |
| `assets/templates/` | You need ready-to-use templates for common diagram types. |
| `scripts/README.md` | You need command usage for validation and shape insertion utilities. |


## Final reminder


- Open the generated file and confirm it renders.
- Prefer draw.io-native patterns over improvised XML.
- Split complexity into additional pages instead of overloading one canvas.

