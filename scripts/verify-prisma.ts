import { prisma } from "../lib/prisma";

async function verify() {
  console.log("🔍 Running Prisma Postgres Verification...");
  try {
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    const sampleUser = await prisma.user.findFirst({
      include: { posts: true },
    });

    console.log("----------------------------------------");
    console.log(`📊 User Count: ${userCount}`);
    console.log(`📊 Post Count: ${postCount}`);
    if (sampleUser) {
      console.log(`👤 Sample User: ${sampleUser.name} (${sampleUser.email}) - ${sampleUser.posts.length} post(s)`);
    }
    console.log("----------------------------------------");
    console.log("✅ Connected to Prisma Postgres successfully!");
  } catch (error: any) {
    console.error("❌ Prisma Verification Failed:", error?.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
