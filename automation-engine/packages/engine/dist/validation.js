"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWorkflowGraph = validateWorkflowGraph;
const graph_1 = require("./graph");
function validateWorkflowGraph(workflow) {
    const errors = [];
    const warnings = [];
    if (!workflow.nodes || !Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
        errors.push("Workflow must contain at least one node.");
        return { valid: false, errors, warnings };
    }
    const graph = (0, graph_1.buildGraph)(workflow);
    const cycleCheck = (0, graph_1.detectGraphCycle)(graph);
    if (cycleCheck.hasCycle) {
        errors.push(`Cycle detected in workflow graph: ${cycleCheck.cyclePath?.join(' -> ')}`);
    }
    // Check for orphan connections
    if (workflow.connections) {
        for (const [sourceName, portsObj] of Object.entries(workflow.connections)) {
            if (!graph.nodesByName.has(sourceName)) {
                errors.push(`Connection references undefined source node: "${sourceName}"`);
            }
            if (portsObj?.main) {
                portsObj.main.forEach((edges) => {
                    if (!edges)
                        return;
                    for (const edge of edges) {
                        if (!graph.nodesByName.has(edge.node)) {
                            errors.push(`Node "${sourceName}" connects to undefined target node "${edge.node}"`);
                        }
                    }
                });
            }
        }
    }
    // Warn about unlinked orphan nodes
    for (const nodeName of graph.nodesByName.keys()) {
        const hasIncoming = (graph.incomingCount.get(nodeName) ?? 0) > 0;
        const hasOutgoing = (graph.outgoing.get(nodeName) ?? []).length > 0;
        if (!hasIncoming && !hasOutgoing && graph.nodesByName.size > 1) {
            warnings.push(`Node "${nodeName}" is detached (no incoming or outgoing connections).`);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        cyclePath: cycleCheck.cyclePath,
    };
}
