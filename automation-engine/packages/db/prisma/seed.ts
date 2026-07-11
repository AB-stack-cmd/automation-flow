import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Delete all existing records to ensure clean seed
  await prisma.auditLog.deleteMany({});
  await prisma.variable.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.webhook.deleteMany({});
  await prisma.credential.deleteMany({});
  await prisma.executionData.deleteMany({});
  await prisma.execution.deleteMany({});
  await prisma.workflow.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create User
  const user = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: '$2b$10$wK1W6QO9j8t3YF6Jt1qHbeuL1R03y2b2Uv3K7J0KqO5X2g8iR1t2e', // dummy bcrypt hash
      name: 'System Admin'
    }
  });
  console.log(`Created user: ${user.email} (ID: ${user.id})`);

  // 3. Create Project
  const project = await prisma.project.create({
    data: {
      name: 'Production Automations',
      ownerId: user.id
    }
  });
  console.log(`Created project: ${project.name} (ID: ${project.id})`);

  // 4. Create a starter 2-node workflow
  const definition = {
    nodes: [
      {
        id: 'node-manual-trigger',
        type: 'manual-trigger',
        position: { x: 100, y: 150 },
        data: { label: 'Manual Trigger' }
      },
      {
        id: 'node-http-request',
        type: 'http-request',
        position: { x: 350, y: 150 },
        data: {
          label: 'HTTP Request',
          url: 'https://api.github.com/zen',
          method: 'GET'
        }
      }
    ],
    edges: [
      {
        id: 'edge-1-2',
        source: 'node-manual-trigger',
        target: 'node-http-request',
        sourceHandle: 'output',
        targetHandle: 'input'
      }
    ]
  };

  const workflow = await prisma.workflow.create({
    data: {
      name: 'GitHub Zen Generator',
      definition: JSON.stringify(definition),
      isActive: true,
      projectId: project.id
    }
  });
  console.log(`Created workflow preset: ${workflow.name} (ID: ${workflow.id})`);
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
