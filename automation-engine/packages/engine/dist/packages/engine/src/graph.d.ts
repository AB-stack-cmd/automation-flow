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
    outgoing: Map<string, {
        toNode: string;
        toPort: number;
        fromPort: number;
    }[]>;
    incomingCount: Map<string, number>;
}
export declare function buildGraph(workflow: WorkflowDefinition): RuntimeGraph;
export declare function topologicalOrderOrThrow(graph: RuntimeGraph): string[];
