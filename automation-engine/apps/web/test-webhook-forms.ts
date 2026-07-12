import { PrismaClient } from '@prisma/client';
import { POST as webhookTestRoute } from './app/api/webhook-test/[workflowId]/route';

const prisma = new PrismaClient();

async function runWebhookAndFormsTest() {
  console.log("🧪 Starting Webhook Trigger & Form Integration Pipeline Test...");

  // 1. Create developer project context
  let user = await prisma.user.findFirst({
    where: { email: "forms-test@example.com" },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "forms-test@example.com",
        passwordHash: "auth-pass-hash",
        name: "Forms QA Specialist",
      },
    });
  }

  let project = await prisma.project.findFirst({
    where: { ownerId: user.id },
  });
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: "QA Pipeline project",
        ownerId: user.id,
      },
    });
  }

  // 2. Define workflow definition using trigger.webhook and action.respondToWebhook
  const definition = {
    nodes: [
      {
        id: "webhook_1",
        name: "Webhook Trigger",
        type: "trigger.webhook",
        parameters: {
          authentication: "none",
        },
      },
      {
        id: "respond_1",
        name: "Respond to Webhook",
        type: "action.respondToWebhook",
        parameters: {
          responseMode: "json",
          statusCode: 201,
          responseBody: '{"success": true, "name": "{{$json.name}}", "email": "{{$json.email}}", "age": "{{$json.age}}"}',
        },
      },
    ],
    connections: {
      "Webhook Trigger": {
        main: [[{ node: "Respond to Webhook", type: "main", index: 0 }]],
      },
    },
  };

  // 3. Create workflow
  const workflow = await prisma.workflow.create({
    data: {
      name: "Custom Webhook Responder Pipeline",
      projectId: project.id,
      definition: JSON.stringify(definition),
      isActive: true,
    },
  });
  console.log(`Created test workflow: ID=${workflow.id}`);

  // 4. Create form schema linked to workflow
  const formFields = [
    {
      id: "f_name",
      type: "text",
      name: "name",
      label: "Full Name",
      required: true,
      validation: { minLength: 3 }
    },
    {
      id: "f_email",
      type: "email",
      name: "email",
      label: "Email Address",
      required: true
    },
    {
      id: "f_age",
      type: "number",
      name: "age",
      label: "Age",
      required: false,
      validation: { minNumber: 18 }
    }
  ];

  const form = await prisma.form.create({
    data: {
      name: "Lead Onboarding Form",
      definition: JSON.stringify(formFields),
      workflowId: workflow.id
    }
  });
  console.log(`Created test Form: ID=${form.id}`);

  try {
    // TEST 1: Valid submission with trimming and normalization
    console.log("\n▶ TEST 1: Sending valid form payload...");
    const payloadValid = {
      name: "   Alice Vance   ",
      email: "ALICE@EXAMPLE.COM",
      age: "24"
    };

    const reqValid = new Request(`http://localhost/api/webhook-test/${workflow.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadValid),
    });

    const resValid = await webhookTestRoute(reqValid, { params: Promise.resolve({ workflowId: workflow.id }) });
    
    console.log(`Response Status: ${resValid.status}`);
    const bodyValid = await resValid.json();
    console.dir(bodyValid);

    if (resValid.status !== 201) {
      throw new Error(`Assertion failed: expected status 201, got ${resValid.status}`);
    }
    if (bodyValid.name !== "Alice Vance") {
      throw new Error(`Assertion failed: expected name to be trimmed to "Alice Vance", got "${bodyValid.name}"`);
    }
    if (bodyValid.email !== "alice@example.com") {
      throw new Error(`Assertion failed: expected email to be normalized to lowercase, got "${bodyValid.email}"`);
    }
    if (Number(bodyValid.age) !== 24) {
      throw new Error(`Assertion failed: expected age value to be 24, got ${bodyValid.age}`);
    }
    console.log("✅ TEST 1 Passed!");

    // TEST 2: Validation Failure
    console.log("\n▶ TEST 2: Sending invalid payload (missing email, name too short, too young)...");
    const payloadInvalid = {
      name: "Al",
      age: "16"
    };

    const reqInvalid = new Request(`http://localhost/api/webhook-test/${workflow.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadInvalid),
    });

    const resInvalid = await webhookTestRoute(reqInvalid, { params: Promise.resolve({ workflowId: workflow.id }) });
    console.log(`Response Status: ${resInvalid.status}`);
    const bodyInvalid = await resInvalid.json();
    console.dir(bodyInvalid);

    if (resInvalid.status !== 400) {
      throw new Error(`Assertion failed: expected validation rejection 400, got ${resInvalid.status}`);
    }
    if (!bodyInvalid.validationErrors) {
      throw new Error("Assertion failed: validationErrors expected in payload response.");
    }
    if (!bodyInvalid.validationErrors.name || !bodyInvalid.validationErrors.email || !bodyInvalid.validationErrors.age) {
      throw new Error("Assertion failed: expected errors for name, email, and age fields.");
    }
    console.log("✅ TEST 2 Passed!");

    // TEST 3: XSS and Script Injection Shield
    console.log("\n▶ TEST 3: Sending injection payload (XSS attack vectors)...");
    const payloadXss = {
      name: "<script>alert('hack')</script>Vance",
      email: "vance@domain.com",
    };

    const reqXss = new Request(`http://localhost/api/webhook-test/${workflow.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadXss),
    });

    const resXss = await webhookTestRoute(reqXss, { params: Promise.resolve({ workflowId: workflow.id }) });
    const bodyXss = await resXss.json();
    console.dir(bodyXss);

    if (bodyXss.name.includes("<script>")) {
      throw new Error(`Assertion failed: XSS script tag was not stripped/escaped. Got: ${bodyXss.name}`);
    }
    // TEST 4: On Event (Trigger Connection Selection)
    console.log("\n▶ TEST 4: Verifying On Event (Trigger connection selection)...");
    const choiceDefinition = {
      nodes: [
        {
          id: "trigger_a",
          name: "Webhook Trigger A",
          type: "trigger.webhook",
          parameters: { authentication: "none" },
        },
        {
          id: "trigger_b",
          name: "Webhook Trigger B",
          type: "trigger.webhook",
          parameters: { authentication: "none" },
        },
        {
          id: "respond_a",
          name: "Respond to Webhook A",
          type: "action.respondToWebhook",
          parameters: {
            responseMode: "json",
            statusCode: 200,
            responseBody: '{"triggered": "A"}',
          },
        },
        {
          id: "respond_b",
          name: "Respond to Webhook B",
          type: "action.respondToWebhook",
          parameters: {
            responseMode: "json",
            statusCode: 200,
            responseBody: '{"triggered": "B"}',
          },
        },
      ],
      connections: {
        "Webhook Trigger A": {
          main: [[{ node: "Respond to Webhook A", type: "main", index: 0 }]],
        },
        "Webhook Trigger B": {
          main: [[{ node: "Respond to Webhook B", type: "main", index: 0 }]],
        },
      },
    };

    const workflowChoice = await prisma.workflow.create({
      data: {
        name: "Multi Trigger Pipeline",
        projectId: project.id,
        definition: JSON.stringify(choiceDefinition),
        isActive: true,
      },
    });

    const formChoice = await prisma.form.create({
      data: {
        name: "Lead Form for Trigger B",
        definition: JSON.stringify(formFields),
        workflowId: workflowChoice.id,
        triggerNodeName: "Webhook Trigger B", // Explicit trigger selection!
      },
    });

    try {
      const reqChoice = new Request(`http://localhost/api/webhook-test/${workflowChoice.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Bob Builder",
          email: "bob@domain.com",
          age: "30",
        }),
      });

      const resChoice = await webhookTestRoute(reqChoice, { params: Promise.resolve({ workflowId: workflowChoice.id }) });
      const bodyChoice = await resChoice.json();
      console.log("Choice result:", bodyChoice);

      if (bodyChoice.triggered !== "B") {
        throw new Error(`Assertion failed: expected trigger to evaluate from Webhook Trigger B, got output: ${JSON.stringify(bodyChoice)}`);
      }
      console.log("✅ TEST 4 Passed!");
    } finally {
      await prisma.form.delete({ where: { id: formChoice.id } });
      await prisma.workflow.delete({ where: { id: workflowChoice.id } });
    }

    console.log("\n🎉 ALL webhook trigger and form submission engine tests passed successfully!");

  } finally {
    // Cleanup
    await prisma.form.delete({ where: { id: form.id } });
    await prisma.workflow.delete({ where: { id: workflow.id } });
    console.log("\n🧹 Cleaned up database entries successfully.");
  }
}

runWebhookAndFormsTest()
  .catch(err => {
    console.error("❌ Integration test failed:", err);
    process.exit(1);
  });
