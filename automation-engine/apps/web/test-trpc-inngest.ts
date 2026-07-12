import { PrismaClient } from '@prisma/client';
import { encrypt } from '../../packages/engine/src/crypto';
import { POST as createWorkflowRoute } from './app/api/workflows/route';
import { POST as executeWorkflowRoute } from './app/api/workflows/[id]/execute/route';
import { GET as getExecutionLogsRoute } from './app/api/executions/[id]/route';

const prisma = new PrismaClient();

async function runRESTAndIntegrationTest() {
  console.log("🧪 Starting REST API + Decryption Engine Integration Test in Web App...");
  
  // Connect Google Form API with environment variables
  process.env.GOOGLE_CLIENT_EMAIL = "google-forms-sa@neuron-flow-prod.iam.gserviceaccount.com";

  const originalFetch = global.fetch;
  global.fetch = async (url: any, options: any) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    
    if (urlStr.includes('api.openai.com')) {
      console.log("   [Mock Fetch] Intercepted OpenAI API call");
      return new Response(JSON.stringify({
        id: "resp_123",
        object: "response",
        status: "completed",
        output: [
          {
            id: "msg_123",
            type: "message",
            role: "assistant",
            content: [{
              type: "output_text",
              text: "Mock completion success from OpenAI!",
              annotations: []
            }]
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 10,
          total_tokens: 20,
          input_tokens: 10,
          output_tokens: 10
        }
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      } as any);
    }

    if (urlStr.includes('discord.com/api/webhooks')) {
      console.log(`   [Mock Fetch] Intercepted Discord webhook POST to: ${urlStr}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      } as any);
    }

    return originalFetch(url, options);
  };

  let user = await prisma.user.findFirst({
    where: { email: "rest-test@example.com" },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "rest-test@example.com",
        passwordHash: "secure-auth-hash",
        name: "REST Developer",
      },
    });
  }

  let project = await prisma.project.findFirst({
    where: { ownerId: user.id },
  });
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: "AI Automations project",
        ownerId: user.id,
      },
    });
  }

  const credPayload = JSON.stringify({ apiKey: "sk-mock-key-12345" });
  const encrypted = encrypt(credPayload);

  await prisma.credential.deleteMany({
    where: { projectId: project.id, type: "openai" },
  });

  const credential = await prisma.credential.create({
    data: {
      name: "My OpenAI Key",
      type: "openai",
      encryptedData: encrypted.encryptedData,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      projectId: project.id,
    },
  });

  console.log(`Created encrypted credential: ID=${credential.id}`);

  const definition = {
    nodes: [
      {
        id: "trigger_1",
        name: "Google Form Trigger",
        type: "trigger.googleForm",
        parameters: {},
      },
      {
        id: "ai_1",
        name: "AI Text Generation",
        type: "action.openai",
        parameters: {
          model: "gpt-4o",
          prompt: "Generate a welcome email for {{$json.name}} with score {{$json.score}}",
        },
      },
      {
        id: "discord_1",
        name: "Discord Publish",
        type: "action.discord",
        parameters: {
          webhookUrl: "https://discord.com/api/webhooks/mock-id/mock-token",
          content: "Pipeline execution complete! OpenAI Result: {{$json.result}}",
        },
      },
    ],
    connections: {
      "Google Form Trigger": {
        main: [[{ node: "AI Text Generation", type: "main", index: 0 }]],
      },
      "AI Text Generation": {
        main: [[{ node: "Discord Publish", type: "main", index: 0 }]],
      },
    },
  };

  // Mock POST request to create workflow
  const createReq = new Request("http://localhost/api/workflows", {
    method: "POST",
    body: JSON.stringify({
      name: "AI and Discord Integration Pipeline",
      projectId: project.id,
      definition: JSON.stringify(definition),
    }),
  });
  const createRes = await createWorkflowRoute(createReq);
  const workflow = await createRes.json();

  console.log(`Created workflow via REST API: ID=${workflow.id}`);

  try {
    console.log("\n▶ Executing Workflow via REST API...");
    const executeReq = new Request(`http://localhost/api/workflows/${workflow.id}/execute`, {
      method: "POST",
      body: JSON.stringify({
        triggerNodeName: "Google Form Trigger",
        payload: {
          name: "Alice Vance",
          score: 95,
        },
      }),
    });
    
    // Pass params directly as dynamic parameter
    const executeRes = await executeWorkflowRoute(executeReq, { params: Promise.resolve({ id: workflow.id }) });
    const result = await executeRes.json();

    if (result.error) {
      throw new Error(`REST execute failed: ${result.error}`);
    }

    console.log(`Execution success! ID: ${result.executionId}`);

    const logsReq = new Request(`http://localhost/api/executions/${result.executionId}`);
    const logsRes = await getExecutionLogsRoute(logsReq, { params: Promise.resolve({ id: result.executionId }) });
    const log = await logsRes.json();

    console.log(`\nExecution Database Log Status: ${log?.status}`);
    const steps = JSON.parse(log?.executionData?.steps || "{}");
    console.log("Steps Output recorded in database:");
    console.dir(steps, { depth: null });

    if (!steps["Google Form Trigger"]) {
      throw new Error("Assertion failed: Google Form Trigger node should have executed.");
    }
    if (!steps["AI Text Generation"]) {
      throw new Error("Assertion failed: AI Text Generation node should have executed.");
    }
    const aiOutput = steps["AI Text Generation"][0][0];
    if (!aiOutput.result.includes("Mock completion success")) {
      throw new Error("Assertion failed: AI Output result does not contain mock completion text.");
    }

    if (!steps["Discord Publish"]) {
      throw new Error("Assertion failed: Discord Publish node should have executed.");
    }
    const discordOutput = steps["Discord Publish"][0][0];
    if (!discordOutput.content.includes("Mock completion success")) {
      throw new Error("Assertion failed: Discord Publish content did not interpolate AI output.");
    }

    console.log("\n✅ REST API + Decryption Engine Integration Test Passed Successfully!");

  } finally {
    await prisma.workflow.delete({
      where: { id: workflow.id },
    });
    await prisma.credential.delete({
      where: { id: credential.id },
    });
    console.log("🧹 Cleaned up test workflow and credentials.");
  }
  
  global.fetch = originalFetch;
}

runRESTAndIntegrationTest()
  .catch(err => {
    console.error("❌ Test crashed:", err);
    process.exit(1);
  });
