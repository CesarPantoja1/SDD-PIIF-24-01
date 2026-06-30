import dagre from 'dagre';

export interface SemanticClass {
  name: string;
  stereotype?: string;
  attributes?: string[];
  methods?: string[];
}

export interface SemanticRelationship {
  source: string;
  target: string;
  type: string;
}

export interface SemanticDesign {
  classes: SemanticClass[];
  relationships: SemanticRelationship[];
}

export function parseApollonDesign(jsonStr: string) {
  let semantic: any;
  try {
    semantic = JSON.parse(jsonStr);
  } catch (e) {
    // Attempt to extract JSON if it's wrapped in markdown code blocks
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    let extracted = match ? match[1] : null;
    
    // If no code blocks, attempt to find the outermost curly braces
    if (!extracted) {
      const startIdx = jsonStr.indexOf('{');
      const endIdx = jsonStr.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        extracted = jsonStr.substring(startIdx, endIdx + 1);
      }
    }

    if (extracted) {
      try {
        semantic = JSON.parse(extracted);
      } catch (err) {
        throw new Error("Invalid JSON structure returned by AI");
      }
    } else {
      throw new Error("Invalid JSON from AI");
    }
  }

  // If the JSON is already an Apollon model (e.g. fetched from DB where it was overwritten)
  if (semantic && semantic.type === "ClassDiagram" && Array.isArray(semantic.nodes)) {
    return semantic;
  }

  const classIdMap = new Map<string, string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodes: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const edges: any[] = [];

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 100 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const c of semantic.classes || []) {
    const classId = crypto.randomUUID();
    classIdMap.set(c.name, classId);

    const methods = (c.methods || []).map(m => ({ id: crypto.randomUUID(), name: m }));
    const attributes = (c.attributes || []).map(a => ({ id: crypto.randomUUID(), name: a }));

    const maxTextLen = Math.max(
      c.name.length,
      ...methods.map(m => m.name.length),
      ...attributes.map(a => a.name.length),
      15 // Minimum width buffer
    );
    const width = Math.max(160, maxTextLen * 8);
    const height = 40 + (methods.length + attributes.length) * 30;

    g.setNode(classId, { width, height });

    nodes.push({
      id: classId,
      width,
      height,
      type: "class",
      position: { x: 0, y: 0 },
      data: {
        name: c.name,
        stereotype: c.stereotype || "",
        attributes,
        methods
      },
      measured: { width, height }
    });
  }

  for (const r of semantic.relationships || []) {
    const sourceId = classIdMap.get(r.source);
    const targetId = classIdMap.get(r.target);
    
    if (sourceId && targetId) {
      const edgeId = crypto.randomUUID();
      g.setEdge(sourceId, targetId, { id: edgeId });
      
      edges.push({
        id: edgeId,
        source: sourceId,
        target: targetId,
        type: r.type || "ClassUnidirectional",
        sourceHandle: "bottom",
        targetHandle: "top",
        data: { points: [] }
      });
    }
  }

  dagre.layout(g);

  for (const node of nodes) {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      node.position = {
        x: dagreNode.x - dagreNode.width / 2,
        y: dagreNode.y - dagreNode.height / 2
      };
    }
  }

  return {
    version: "4.0.0",
    type: "ClassDiagram",
    title: "AI Generated Class Diagram",
    nodes,
    edges,
    assessments: {}
  };
}
