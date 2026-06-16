import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function generateHash(userId: string, content: string, timestamp: Date) {
  const payload = `${userId}|${content}|${timestamp.toISOString()}`;
  return crypto.createHash("sha256").update(payload, "utf-8").digest("hex");
}

async function main() {
  console.log("Seeding Discovery Commons...");

  // Create seed user (admin/Ping)
  const admin = await prisma.user.upsert({
    where: { email: "admin@discoverycommons.org" },
    update: {},
    create: {
      email: "admin@discoverycommons.org",
      name: "Ping",
      displayName: "Ping",
      trustLevel: "moderator",
      covenantAcceptedAt: new Date(),
      interests: ["ecology", "complex systems", "neuroscience"],
    },
  });

  console.log(`Created admin user: ${admin.id}`);

  // Seed Thread 1: Soundscape Research
  const thread1 = await prisma.thread.upsert({
    where: { id: "seed-thread-soundscape" },
    update: {},
    create: {
      id: "seed-thread-soundscape",
      creatorId: admin.id,
      title:
        "Does information extraction reproducibility correlate with soundscape complexity?",
      description:
        "Exploring the relationship between soundscape complexity metrics and the reproducibility of information extraction from acoustic recordings. As ecological monitoring increasingly relies on automated analysis of soundscapes, understanding how complexity affects extraction reliability becomes critical for methodology validation.",
      visibility: "L2",
      currentStage: "question",
      domainTags: ["ecology", "acoustics", "methodology"],
    },
  });

  const t1q = new Date("2026-06-15T10:00:00Z");
  const t1qHash = generateHash(admin.id, "Initial question about soundscape reproducibility", t1q);
  await prisma.contribution.upsert({
    where: { id: "seed-c1-q1" },
    update: {},
    create: {
      id: "seed-c1-q1",
      threadId: thread1.id,
      authorId: admin.id,
      type: "question",
      content:
        "When we extract species-level information from complex multi-species soundscapes, how does the acoustic complexity index (ACI) of the recording environment affect the reproducibility of our extraction results? Are simpler soundscapes more reproducible, or does complexity provide redundant information that actually improves reliability?",
      contentHash: t1qHash,
      visibility: "L2",
      createdAt: t1q,
    },
  });

  // Seed Thread 2: Brain Resolution & Higher Dimensions
  const thread2 = await prisma.thread.upsert({
    where: { id: "seed-thread-brain-dimensions" },
    update: {},
    create: {
      id: "seed-thread-brain-dimensions",
      creatorId: admin.id,
      title:
        "Human brain temporal resolution as a compression artifact of higher-dimensional information",
      description:
        "A speculative thread exploring whether the temporal resolution limits of human perception (e.g., the ~40ms binding window) could be understood as information compression artifacts — as if a higher-dimensional universe's information is being projected through the bottleneck of neural temporal processing.",
      visibility: "L2",
      currentStage: "hypothesis",
      domainTags: ["neuroscience", "physics", "philosophy"],
    },
  });

  const t2q = new Date("2026-06-15T10:30:00Z");
  const t2qHash = generateHash(admin.id, "Brain temporal resolution question", t2q);
  await prisma.contribution.upsert({
    where: { id: "seed-c2-q1" },
    update: {},
    create: {
      id: "seed-c2-q1",
      threadId: thread2.id,
      authorId: admin.id,
      type: "question",
      content:
        "If the universe has more dimensions than we perceive, does the human brain's temporal resolution (~40ms for conscious binding) represent a form of lossy compression? What would be the information-theoretic signature of such compression?",
      contentHash: t2qHash,
      visibility: "L2",
      createdAt: t2q,
    },
  });

  const t2h = new Date("2026-06-15T11:00:00Z");
  const t2hHash = generateHash(admin.id, "Brain compression hypothesis", t2h);
  await prisma.contribution.upsert({
    where: { id: "seed-c2-h1" },
    update: {},
    create: {
      id: "seed-c2-h1",
      threadId: thread2.id,
      authorId: admin.id,
      type: "hypothesis",
      content:
        "Hypothesis: The discrete nature of conscious temporal perception (the ~40ms window) is analogous to a sampling theorem constraint. If higher-dimensional information must be projected onto our 3+1 dimensional experience, the temporal axis acts as the primary compression dimension. Prediction: neural oscillation frequencies should show information-theoretic signatures consistent with rate-distortion optimal compression.",
      contentHash: t2hHash,
      visibility: "L2",
      createdAt: t2h,
    },
  });

  // Seed Thread 3: Complex System Emergence
  const thread3 = await prisma.thread.upsert({
    where: { id: "seed-thread-emergence" },
    update: {},
    create: {
      id: "seed-thread-emergence",
      creatorId: admin.id,
      title:
        "Complex system emergence as information propagation in higher-dimensional spaces",
      description:
        "Investigating whether emergent properties in complex systems can be understood as the visible projection of information propagation occurring in higher-dimensional abstract spaces. This connects information geometry, complex systems theory, and theoretical physics.",
      visibility: "L2",
      currentStage: "question",
      domainTags: ["complex systems", "information theory", "cosmology"],
    },
  });

  const t3q = new Date("2026-06-15T11:30:00Z");
  const t3qHash = generateHash(admin.id, "Emergence information propagation question", t3q);
  await prisma.contribution.upsert({
    where: { id: "seed-c3-q1" },
    update: {},
    create: {
      id: "seed-c3-q1",
      threadId: thread3.id,
      authorId: admin.id,
      type: "question",
      content:
        "When a complex system exhibits emergence — behavior not predictable from its parts — could this be because the system is propagating information through a higher-dimensional state space, and what we call 'emergence' is the low-dimensional shadow of that propagation? If so, can we use information geometry to characterize the dimensionality of the 'hidden' space?",
      contentHash: t3qHash,
      visibility: "L2",
      createdAt: t3q,
    },
  });

  // Create version records for all contributions
  const contributions = await prisma.contribution.findMany({
    where: { id: { startsWith: "seed-" } },
  });

  for (const c of contributions) {
    await prisma.contributionVersion.upsert({
      where: {
        contributionId_versionNumber: {
          contributionId: c.id,
          versionNumber: 1,
        },
      },
      update: {},
      create: {
        contributionId: c.id,
        versionNumber: 1,
        content: c.content,
        contentHash: c.contentHash,
      },
    });

    await prisma.credit.create({
      data: {
        userId: c.authorId,
        threadId: c.threadId,
        contributionId: c.id,
        creditType: c.type,
        hash: c.contentHash,
        timestamp: c.createdAt,
      },
    }).catch(() => {});
  }

  console.log("Seed complete!");
  console.log(`  3 threads created`);
  console.log(`  ${contributions.length} contributions created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
