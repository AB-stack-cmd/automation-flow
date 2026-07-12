import { INode } from 'sdk';

export interface WorkflowDefinition {
  nodes: INode[];
  connections: Record<string, {
    main: Array<Array<{
      node: string;
      type: string;
      index: number;
    }>>;
  }>;
}

export interface RuntimeGraph {
  nodesByName: Map<string, INode>;
  outgoing: Map<string, { toNode: string; toPort: number; fromPort: number }[]>;
  incomingCount: Map<string, number>;
}

export function buildGraph(workflow: WorkflowDefinition): RuntimeGraph {
  const nodesByName = new Map<string, INode>();
  for (const node of workflow.nodes) {
    nodesByName.set(node.name, node);
  }

  const outgoing = new Map<string, { toNode: string; toPort: number; fromPort: number }[]>();
  const incomingCount = new Map<string, number>();

  for (const name of nodesByName.keys()) {
    incomingCount.set(name, 0);
  }

  if (workflow.connections) {
    for (const [sourceName, portsObj] of Object.entries(workflow.connections)) {
      if (!portsObj?.main) continue;
      
      portsObj.main.forEach((edgesForPort, fromPort) => {
        if (!edgesForPort) return;
        for (const edge of edgesForPort) {
          if (!outgoing.has(sourceName)) {
            outgoing.set(sourceName, []);
          }
          outgoing.get(sourceName)!.push({
            toNode: edge.node,
            toPort: edge.index,
            fromPort
          });
          
          incomingCount.set(edge.node, (incomingCount.get(edge.node) ?? 0) + 1);
        }
      });
    }
  }

  return { nodesByName, outgoing, incomingCount };
}

export function topologicalOrderOrThrow(graph: RuntimeGraph): string[] {
  const inDegree = new Map(graph.incomingCount);
  const queue: string[] = [...graph.nodesByName.keys()].filter(n => !inDegree.get(n));
  const order: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    const edges = graph.outgoing.get(current) ?? [];
    for (const edge of edges) {
      const remaining = (inDegree.get(edge.toNode) ?? 1) - 1;
      inDegree.set(edge.toNode, remaining);
      if (remaining === 0) {
        queue.push(edge.toNode);
      }
    }
  }

  if (order.length !== graph.nodesByName.size) {
    throw new Error("Cycle detected in workflow graph");
  }
  return order;
}
