import { prisma } from "../lib/prisma";

async function main() {
  console.log("Seeding Prisma Postgres database...");

  const user1 = await prisma.user.upsert({
    where: { email: "alex.smith@example.com" },
    update: {},
    create: {
      email: "alex.smith@example.com",
      name: "Alex Smith",
      posts: {
        create: [
          {
            title: "Welcome to Prisma Postgres",
            content: "Serverless Postgres database integrated with Prisma ORM.",
            published: true,
          },
          {
            title: "Building Workflow Automation Engines",
            content: "Scalable event-driven pipelines powered by Prisma and Express.",
            published: true,
          },
        ],
      },
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "sarah.johnson@example.com" },
    update: {},
    create: {
      email: "sarah.johnson@example.com",
      name: "Sarah Johnson",
      posts: {
        create: [
          {
            title: "AI Agent Orchestration",
            content: "Using LLM completion nodes in automated visual flows.",
            published: true,
          },
        ],
      },
    },
  });

  console.log(`Seeded users: ${user1.name}, ${user2.name}`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
