# Diagram Recipes


## Flowchart


Use start and end ellipses, rounded process boxes, and rhombus decisions.


```xml
<mxCell id="start" value="Start"
            style="ellipse;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;"
            vertex="1" parent="1">
  <mxGeometry x="500" y="80" width="120" height="60" as="geometry" />
</mxCell>


<mxCell id="p1" value="Process Step"
            style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
            vertex="1" parent="1">
  <mxGeometry x="500" y="200" width="120" height="60" as="geometry" />
</mxCell>


<mxCell id="d1" value="Condition?"
            style="rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;"
            vertex="1" parent="1">
  <mxGeometry x="460" y="320" width="200" height="100" as="geometry" />
</mxCell>


<mxCell id="e1" value=""
            style="edgeStyle=orthogonalEdgeStyle;html=1;"
            edge="1" source="start" target="p1" parent="1">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```


## Architecture diagram


Use swimlane containers for layers or tiers and place services as children.


```xml
<mxCell id="tier1" value="Client Layer"
            style="swimlane;startSize=30;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;"
            vertex="1" parent="1">
  <mxGeometry x="60" y="100" width="1050" height="130" as="geometry" />
</mxCell>


<mxCell id="webapp" value="Web App"
            style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
            vertex="1" parent="tier1">
  <mxGeometry x="80" y="40" width="120" height="60" as="geometry" />
</mxCell>
```


Connectors between tiers often use `parent="1"` with absolute coordinates.


## Sequence diagram


Use actors, lifelines, activation boxes, and message arrows.


- Use floating edges with `sourcePoint` and `targetPoint` for lifelines.
- Use `endArrow=block;endFill=1` for synchronous messages.
- Use `endArrow=open;endFill=0;dashed=1` for returns.
- Use manual control points for self-calls when needed.


```xml
<mxCell id="actorA" value="Client"
            style="shape=mxgraph.uml.actor;pointerEvents=1;dashed=0;whiteSpace=wrap;html=1;aspect=fixed;"
            vertex="1" parent="1">
  <mxGeometry x="110" y="80" width="60" height="80" as="geometry" />
</mxCell>


<mxCell id="lifA" value=""
            style="edgeStyle=none;dashed=1;endArrow=none;"
            edge="1" parent="1">
  <mxGeometry relative="1" as="geometry">
        <mxPoint x="140" y="160" as="sourcePoint" />
        <mxPoint x="140" y="700" as="targetPoint" />
  </mxGeometry>
</mxCell>
```


## ER diagram


Use `shape=table` containers with `childLayout=tableLayout`.


- Use `shape=tableRow` for rows.
- Use `shape=partialRectangle` for PK, name, and type cells inside each row.
- Use `edgeStyle=entityRelationEdgeStyle` for crow's-foot relationships.


Relationship patterns:


- One-to-one: `startArrow=ERone;endArrow=ERone`
- One-to-many: `startArrow=ERone;endArrow=ERmany`
- Many-to-many: `startArrow=ERmany;endArrow=ERmany`
- Mandatory or optional variants: use `ERmandOne`, `ERzeroToOne`, or `ERzeroToMany`


## UML class diagram


Use swimlane containers for classes and text cells for attributes and methods.


Relationship styles:


| Relationship | Style string |
| --- | --- |
| Inheritance | `edgeStyle=orthogonalEdgeStyle;html=1;endArrow=block;endFill=0;` |
| Realization | `edgeStyle=orthogonalEdgeStyle;dashed=1;html=1;endArrow=block;endFill=0;` |
| Composition | `edgeStyle=orthogonalEdgeStyle;html=1;startArrow=diamond;startFill=1;endArrow=none;` |
| Aggregation | `edgeStyle=orthogonalEdgeStyle;html=1;startArrow=diamond;startFill=0;endArrow=none;` |
| Dependency | `edgeStyle=orthogonalEdgeStyle;dashed=1;html=1;endArrow=open;endFill=0;` |
| Association | `edgeStyle=orthogonalEdgeStyle;html=1;endArrow=open;endFill=0;` |


## Multipage diagrams


Use multiple `<diagram>` elements for overview-plus-detail layouts.


```xml
<mxfile host="Electron" version="26.0.0">
  <diagram id="overview" name="Overview">
        <mxGraphModel>...</mxGraphModel>
  </diagram>
  <diagram id="detail" name="Detail View">
        <mxGraphModel>...</mxGraphModel>
  </diagram>
</mxfile>
```


Cell ids are scoped to each page, so the same id can appear on different pages without conflict.