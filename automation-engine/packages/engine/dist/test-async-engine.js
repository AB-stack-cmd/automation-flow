"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graph_1 = require("./graph");
const validation_1 = require("./validation");
const queue_1 = require("./queue");
async function runAsyncEngineTests() {
    console.log("=== RUNNING ASYNC WORKFLOW ENGINE INTEGRATION TESTS ===");
    // 1. Test Valid Linear & Branching Graph
    const validWorkflow = {
        nodes: [
            { id: '1', name: 'Trigger', type: 'trigger.manual', parameters: {} },
            { id: '2', name: 'ProcessA', type: 'code', parameters: {} },
            { id: '3', name: 'ProcessB', type: 'code', parameters: {} },
            { id: '4', name: 'MergeNode', type: 'code', parameters: {} }
        ],
        connections: {
            'Trigger': {
                main: [
                    [{ node: 'ProcessA', type: 'main', index: 0 }],
                    [{ node: 'ProcessB', type: 'main', index: 0 }]
                ]
            },
            'ProcessA': {
                main: [[{ node: 'MergeNode', type: 'main', index: 0 }]]
            },
            'ProcessB': {
                main: [[{ node: 'MergeNode', type: 'main', index: 0 }]]
            }
        }
    };
    const graph = (0, graph_1.buildGraph)(validWorkflow);
    const validation = (0, validation_1.validateWorkflowGraph)(validWorkflow);
    console.log("✔ Validation Result (Valid Graph):", validation.valid ? "PASSED" : "FAILED");
    const cycleCheck = (0, graph_1.detectGraphCycle)(graph);
    console.log("✔ Cycle Detection (Valid Graph):", cycleCheck.hasCycle ? "FAILED (Cycle Found)" : "PASSED (No Cycle)");
    const waves = (0, graph_1.computeTopologicalWaves)(graph);
    console.log("✔ Wave Partitioning:", JSON.stringify(waves));
    if (waves.length !== 3 || waves[0][0] !== 'Trigger' || waves[2][0] !== 'MergeNode') {
        throw new Error("Wave partitioning failed math expectation!");
    }
    // 2. Test Invalid Cyclic Graph
    const cyclicWorkflow = {
        nodes: [
            { id: '1', name: 'NodeA', type: 'code', parameters: {} },
            { id: '2', name: 'NodeB', type: 'code', parameters: {} }
        ],
        connections: {
            'NodeA': { main: [[{ node: 'NodeB', type: 'main', index: 0 }]] },
            'NodeB': { main: [[{ node: 'NodeA', type: 'main', index: 0 }]] }
        }
    };
    const cyclicGraph = (0, graph_1.buildGraph)(cyclicWorkflow);
    const cyclicValidation = (0, validation_1.validateWorkflowGraph)(cyclicWorkflow);
    console.log("✔ Cycle Rejection Validation:", !cyclicValidation.valid ? "PASSED (Cycle Rejected)" : "FAILED");
    console.log("✔ Cycle Path Identified:", cyclicValidation.cyclePath?.join(" -> "));
    // 3. Test Async Queue Lock & Enqueueing
    const lockSuccess = await queue_1.defaultExecutionQueue.acquireLock('lock:test:node1', 5000);
    const lockFail = await queue_1.defaultExecutionQueue.acquireLock('lock:test:node1', 5000);
    console.log("✔ Queue Lock Acquisition:", lockSuccess && !lockFail ? "PASSED" : "FAILED");
    await queue_1.defaultExecutionQueue.releaseLock('lock:test:node1');
    const relockSuccess = await queue_1.defaultExecutionQueue.acquireLock('lock:test:node1', 5000);
    console.log("✔ Queue Lock Release & Re-lock:", relockSuccess ? "PASSED" : "FAILED");
    console.log("=== ALL FEATURE 1 ASYNC ENGINE TESTS PASSED SUCCESSFULLY ===");
}
runAsyncEngineTests().catch((err) => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
});
