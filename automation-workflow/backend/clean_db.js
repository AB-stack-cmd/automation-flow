import { prisma } from './db.js';

async function cleanupDB() {
  console.log('🧹 Cleaning up execution logs and resetting scheduled workflows...');
  
  try {
    const logCount = await prisma.executionLog.count();
    console.log(`Current execution log count: ${logCount}`);
    
    // Delete excess execution logs
    const deleted = await prisma.executionLog.deleteMany({});
    console.log(`Deleted ${deleted.count} execution logs.`);

    // Reset active scheduled workflows so nextRun is properly spaced in the future
    const activeWorkflows = await prisma.workflow.findMany({ where: { isActive: true } });
    const now = new Date();

    for (const wf of activeWorkflows) {
      try {
        const def = JSON.parse(wf.definition);
        let updated = false;
        if (def && def.nodes) {
          for (const node of def.nodes) {
            if (node.type === 'schedule_trigger') {
              if (!node.data) node.data = {};
              // Set next run to 60 seconds from now for safety
              node.data.nextRun = new Date(now.getTime() + 60000).toISOString();
              node.data.lastRun = now.toISOString();
              updated = true;
            }
          }
        }
        if (updated) {
          await prisma.workflow.update({
            where: { id: wf.id },
            data: { definition: JSON.stringify(def) }
          });
          console.log(`Reset nextRun schedule for workflow ID=${wf.id}`);
        }
      } catch (e) {
        console.error(`Error updating workflow ${wf.id}:`, e.message);
      }
    }

    // Run SQLite VACUUM to shrink database size
    console.log('Compacting SQLite database with VACUUM...');
    await prisma.$executeRawUnsafe(`VACUUM;`);
    console.log('✅ DB Cleanup & Compaction completed successfully!');
  } catch (err) {
    console.error('Cleanup error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDB();
