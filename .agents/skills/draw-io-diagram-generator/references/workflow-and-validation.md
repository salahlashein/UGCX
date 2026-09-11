# Workflow and Validation


## Prerequisites


- Install the VS Code draw.io extension `hediet.vscode-drawio` when interactive rendering in VS Code is needed.
- Use `.drawio`, `.drawio.svg`, or `.drawio.png` depending on the delivery format.
- Use Python 3.8+ when running the validator or helper scripts.


## Detailed workflow


### 1. Understand the request


- Identify the diagram type.
- Identify the entities, actors, classes, services, or tables.
- Identify the relationships, direction, and cardinality.
- Identify the output path.
- Identify whether you are creating or editing.


If the request is ambiguous, infer the most sensible diagram type from context.


### 2. Select a template or start fresh


- Use a template from `assets/templates/` when the target diagram matches one.
- Start from the minimal valid skeleton when the layout is custom.
- Never omit the reserved `0` and `1` cells.


### 3. Plan the layout


- Organize into rows, tiers, lanes, or grouped regions before writing XML.
- Use swimlanes when parent-child containment clarifies the model.
- Choose spacing and page size before generating a large diagram.


### 4. Generate or edit mxGraph XML


- Use unique ids within each page.
- Keep parents valid.
- Use geometry on every vertex.
- Use valid endpoints on every edge, except intentional floating edges.
- Escape XML special characters in labels.
- Use `html=1` when labels include HTML.


### 5. Validate


- Run the validator when possible.
- Open the file in draw.io to confirm it renders correctly.
- Read back the structure if the rendering looks wrong.


### 6. Deliver


- Write the file to the requested path.
- Summarize what the diagram shows.
- Tell the user how to open it.
- State whether validation was run and passed.


## Editing existing diagrams


- Read the existing file before modifying it.
- Identify the target diagram page by index or `name`.
- Assign new ids that do not collide with existing ones.
- Respect existing container hierarchies.
- Re-check edges after moving or renaming nodes.


Use the helper script when adding a single shape is safer than editing XML directly:


```bash
python .github/skills/draw-io-diagram-generator/scripts/add-shape.py docs/arch.drawio "New Service" 700 380
```


## Troubleshooting


| Problem | Likely cause | Fix |
| --- | --- | --- |
| File opens blank in VS Code | Missing `id="0"` or `id="1"` | Add both reserved root cells before any other cells |
| Shape is misplaced | Child coordinates are relative to a container | Check `parent` and recalculate coordinates relative to the container |
| Edge is not visible | `source` or `target` id is invalid | Confirm endpoint ids exist exactly as written |
| Diagram shows as compressed | `mxGraphModel` is stored compressed | Export uncompressed XML from draw.io |
| Shape style does not render | Invalid shape string | Check `references/shape-libraries.md` for the exact style string |
| Label displays raw HTML | Missing `html=1` | Add `html=1;` to the style |
| Container children overlap edges | Container geometry is too small | Increase the container height or width |


## Validation checklist


- Confirm the file starts with `<mxfile>`.
- Confirm each `<diagram>` has a non-empty `id`.
- Confirm `<mxCell id="0" />` is first in every page.
- Confirm `<mxCell id="1" parent="0" />` is second in every page.
- Confirm all cell ids are unique within each page.
- Confirm every vertex has `vertex="1"` and a child geometry element.
- Confirm every edge has `edge="1"` and valid endpoints, or valid floating-edge geometry.
- Confirm every non-root cell has a valid parent.
- Confirm labels with HTML use `html=1`.
- Confirm XML is well-formed.
- Confirm every page has a title text cell near the top.


Run the automated validator:


```bash
python .github/skills/draw-io-diagram-generator/scripts/validate-drawio.py <file.drawio>
```


## Output expectations


When delivering a draw.io diagram, include:


1. The written file path.
2. A one-sentence summary of what the diagram shows.
3. A short note on how to open it in VS Code, the web app, or the desktop app.
4. A brief editing hint when the user is likely to customize it.
5. The validation status.