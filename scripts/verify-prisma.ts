import { prisma } from "../lib/prisma";

async function verify() {
  try {
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    const sampleUser = await prisma.user.findFirst({
      include: { posts: true },
    });

    console.log(`User Count: ${userCount}, Post Count: ${postCount}`);
    if (sampleUser) {
      console.log(`Sample User: ${sampleUser.name} (${sampleUser.email}) - ${sampleUser.posts.length} posts`);
    }

    console.log("✅ Connected");
  } catch (error) {
    console.error("❌ Prisma Verification Failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
