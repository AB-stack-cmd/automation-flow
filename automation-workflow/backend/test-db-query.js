import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const workflows = await prisma.workflow.findMany();
    console.log(`Workflows count: ${workflows.length}`);
    for (const w of workflows) {
      console.log(`\nWorkflow ID: ${w.id}, Name: ${w.name}, Active: ${w.isActive}`);
      try {
        const def = JSON.parse(w.definition);
        console.log(`Nodes: ${def.nodes?.length || 0}, Edges: ${def.edges?.length || 0}`);
        console.log('Nodes:', def.nodes.map(n => ({ id: n.id, type: n.type, label: n.data?.label || n.data?.title || n.id })));
        console.log('Edges:', def.edges.map(e => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle })));
      } catch (e) {
        console.log('Invalid JSON definition:', w.definition);
      }
    }

    const logs = await prisma.executionLog.findMany({ take: 5 });
    console.log(`\nExecution Logs count: ${logs.length}`);
    for (const l of logs) {
      console.log(`Log ID: ${l.id}, Workflow ID: ${l.workflowId}, Status: ${l.status}, Started: ${l.startedAt}`);
    }
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
