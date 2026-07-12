import { executeWorkflow } from './executor';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runIntegrationTest() {
  console.log("🧪 Starting Engine Integration Tests...");

  // 1. Create a workspace project & user if they do not exist
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "test-engine@example.com",
        passwordHash: "dummy-hash",
        name: "Test Engineer",
      },
    });
  }

  let project = await prisma.project.findFirst({
    where: { ownerId: user.id },
  });
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: "Integration Test project",
        ownerId: user.id,
      },
    });
  }

  // 2. Define the workflow definition JSON mapping out triggers, variables, conditionals, and script sandbox nodes
  const definition = {
    nodes: [
      {
        id: "trigger_1",
        name: "Manual Trigger",
        type: "trigger.manual",
        parameters: {},
      },
      {
        id: "set_1",
        name: "Set Variables",
        type: "action.set",
        parameters: {
          values: [
            { name: "score", value: "{{$json.score}}" },
            { name: "email", value: "{{$json.email}}" },
            { name: "name", value: "{{$json.name}}" },
            { name: "tag", value: "test-run" },
          ],
        },
      },
      {
        id: "if_1",
        name: "Check Score",
        type: "logic.if",
        parameters: {
          condition: "{{$json.score}} > 50",
        },
      },
      {
        id: "code_1",
        name: "Flag VIP True",
        type: "logic.code",
        parameters: {
          jsCode: `
            return inputData.map(item => {
              item.json.vip = true;
              item.json.status = "VIP Qualified";
              return item;
            });
          `,
        },
      },
      {
        id: "set_2",
        name: "Flag Nurture False",
        type: "action.set",
        parameters: {
          values: [
            { name: "vip", value: false },
            { name: "status", value: "Send to Nurture" },
          ],
        },
      },
    ],
    connections: {
      "Manual Trigger": {
        main: [[{ node: "Set Variables", type: "main", index: 0 }]],
      },
      "Set Variables": {
        main: [[{ node: "Check Score", type: "main", index: 0 }]],
      },
      "Check Score": {
        main: [
          [{ node: "Flag VIP True", type: "main", index: 0 }], // Port 0: True branch
          [{ node: "Flag Nurture False", type: "main", index: 0 }], // Port 1: False branch
        ],
      },
    },
  };

  const workflow = await prisma.workflow.create({
    data: {
      name: "Integration Test Workflow",
      isActive: true,
      projectId: project.id,
      definition: JSON.stringify(definition),
    },
  });

  console.log(`Created test workflow: ID=${workflow.id}`);

  try {
    // --- CASE 1: Lead Score = 75 (Should evaluate to True -> Flag VIP True Node) ---
    console.log("\n▶ Running Case 1 (Score = 75, expected branch: TRUE)...");
    const result1 = await executeWorkflow(workflow.id, "Manual Trigger", {
      email: "jane.doe@example.com",
      name: "Jane Doe",
      score: 75,
    });

    if (!result1.success) {
      throw new Error(`Case 1 execution failed: ${result1.error}`);
    }

    // Fetch Case 1 logs from database
    const exec1 = await prisma.execution.findUnique({
      where: { id: result1.executionId },
      include: { executionData: true },
    });

    console.log(`Execution Case 1 completed with status: ${exec1?.status}`);
    const steps1 = JSON.parse(exec1?.executionData?.steps || "{}");
    console.log("Node Outputs logged in database:");
    console.dir(steps1, { depth: null });

    // Assertions for Case 1
    if (steps1["Flag VIP True"] === undefined) {
      throw new Error("Assertion failed: Flag VIP True node should have executed.");
    }
    if (steps1["Flag Nurture False"] !== undefined) {
      throw new Error("Assertion failed: Flag Nurture False node should NOT have executed.");
    }
    const finalVipObj = steps1["Flag VIP True"][0][0]; // Port 0, Item 0
    if (finalVipObj.vip !== true || finalVipObj.status !== "VIP Qualified") {
      throw new Error("Assertion failed: final object in Case 1 should be flagged as VIP.");
    }
    console.log("✅ Case 1 Assertions Passed!");

    // --- CASE 2: Lead Score = 30 (Should evaluate to False -> Flag Nurture False Node) ---
    console.log("\n▶ Running Case 2 (Score = 30, expected branch: FALSE)...");
    const result2 = await executeWorkflow(workflow.id, "Manual Trigger", {
      email: "john.smith@example.com",
      name: "John Smith",
      score: 30,
    });

    if (!result2.success) {
      throw new Error(`Case 2 execution failed: ${result2.error}`);
    }

    const exec2 = await prisma.execution.findUnique({
      where: { id: result2.executionId },
      include: { executionData: true },
    });

    console.log(`Execution Case 2 completed with status: ${exec2?.status}`);
    const steps2 = JSON.parse(exec2?.executionData?.steps || "{}");
    console.log("Node Outputs logged in database:");
    console.dir(steps2, { depth: null });

    // Assertions for Case 2
    if (steps2["Flag Nurture False"] === undefined) {
      throw new Error("Assertion failed: Flag Nurture False node should have executed.");
    }
    if (steps2["Flag VIP True"] !== undefined) {
      throw new Error("Assertion failed: Flag VIP True node should NOT have executed.");
    }
    const finalNurtureObj = steps2["Flag Nurture False"][0][0]; // Port 0, Item 0
    if (finalNurtureObj.vip !== false || finalNurtureObj.status !== "Send to Nurture") {
      throw new Error("Assertion failed: final object in Case 2 should be flagged as Nurture.");
    }
    console.log("✅ Case 2 Assertions Passed!");

  } finally {
    // 3. Clean up database workflow
    await prisma.workflow.delete({
      where: { id: workflow.id },
    });
    console.log("\n🧹 Cleaned up test workflow and execution logs.");
  }

  console.log("\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!");
}

runIntegrationTest()
  .catch(err => {
    console.error("❌ Test script crashed:", err);
    process.exit(1);
  });
