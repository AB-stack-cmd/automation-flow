"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _app_1 = require("../../../apps/web/server/routers/_app");
const client_1 = require("@prisma/client");
const crypto_1 = require("./crypto");
const prisma = new client_1.PrismaClient();
async function runTrpcAndIntegrationTest() {
    console.log("🧪 Starting tRPC + Decryption Engine Integration Test...");
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.includes('api.openai.com')) {
            console.log("   [Mock Fetch] Intercepted OpenAI API call");
            return new Response(JSON.stringify({
                choices: [{ message: { content: "Mock completion success from OpenAI!" } }],
                usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
            }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
            });
        }
        if (urlStr.includes('discord.com/api/webhooks')) {
            console.log(`   [Mock Fetch] Intercepted Discord webhook POST to: ${urlStr}`);
            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
            });
        }
        return originalFetch(url, options);
    };
    let user = await prisma.user.findFirst({
        where: { email: "trpc-test@example.com" },
    });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: "trpc-test@example.com",
                passwordHash: "secure-auth-hash",
                name: "tRPC Developer",
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
    const encrypted = (0, crypto_1.encrypt)(credPayload);
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
                name: "Manual Trigger",
                type: "trigger.manual",
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
            "Manual Trigger": {
                main: [[{ node: "AI Text Generation", type: "main", index: 0 }]],
            },
            "AI Text Generation": {
                main: [[{ node: "Discord Publish", type: "main", index: 0 }]],
            },
        },
    };
    const caller = _app_1.appRouter.createCaller({});
    const workflow = await caller.workflow.create({
        name: "AI and Discord Integration Pipeline",
        projectId: project.id,
        definition: JSON.stringify(definition),
    });
    console.log(`Created workflow via tRPC: ID=${workflow.id}`);
    try {
        console.log("\n▶ Executing Workflow via tRPC...");
        const result = await caller.workflow.execute({
            workflowId: workflow.id,
            triggerNodeName: "Manual Trigger",
            payload: {
                name: "Alice Vance",
                score: 95,
            },
        });
        if (!result.success) {
            throw new Error(`tRPC execute failed: ${result.error}`);
        }
        console.log(`Execution success! ID: ${result.executionId}`);
        const log = await caller.workflow.getExecutionLogs({
            executionId: result.executionId,
        });
        console.log(`\nExecution Database Log Status: ${log?.status}`);
        const steps = JSON.parse(log?.executionData?.steps || "{}");
        console.log("Steps Output recorded in database:");
        console.dir(steps, { depth: null });
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
        console.log("\n✅ tRPC + Decryption Engine Integration Test Passed Successfully!");
    }
    finally {
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
runTrpcAndIntegrationTest()
    .catch(err => {
    console.error("❌ Test crashed:", err);
    process.exit(1);
});
