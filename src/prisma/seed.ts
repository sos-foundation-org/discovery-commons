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

  // Create a collaborator (Wei) to demonstrate shared visibility + collaborators.
  const collaborator = await prisma.user.upsert({
    where: { email: "wei@discoverycommons.org" },
    update: {},
    create: {
      email: "wei@discoverycommons.org",
      name: "Wei",
      displayName: "Wei",
      trustLevel: "trusted",
      covenantAcceptedAt: new Date(),
      interests: ["neuroscience", "information theory"],
    },
  });

  console.log(`Created users: ${admin.id}, ${collaborator.id}`);

  // Seed Thread 1: Soundscape Research — fully public
  const thread1 = await prisma.thread.upsert({
    where: { id: "seed-thread-soundscape" },
    update: { visibility: "public" },
    create: {
      id: "seed-thread-soundscape",
      creatorId: admin.id,
      title:
        "Does information extraction reproducibility correlate with soundscape complexity?",
      description:
        "Exploring the relationship between soundscape complexity metrics and the reproducibility of information extraction from acoustic recordings. As ecological monitoring increasingly relies on automated analysis of soundscapes, understanding how complexity affects extraction reliability becomes critical for methodology validation.",
      visibility: "public",
      currentStage: "question",
      domainTags: ["ecology", "acoustics", "methodology"],
    },
  });

  const t1q = new Date("2026-06-15T10:00:00Z");
  const t1qHash = generateHash(admin.id, "Initial question about soundscape reproducibility", t1q);
  await prisma.contribution.upsert({
    where: { id: "seed-c1-q1" },
    update: { visibility: "public" },
    create: {
      id: "seed-c1-q1",
      threadId: thread1.id,
      authorId: admin.id,
      type: "question",
      content:
        "When we extract species-level information from complex multi-species soundscapes, how does the acoustic complexity index (ACI) of the recording environment affect the reproducibility of our extraction results? Are simpler soundscapes more reproducible, or does complexity provide redundant information that actually improves reliability?",
      contentHash: t1qHash,
      visibility: "public",
      createdAt: t1q,
    },
  });

  // Seed Thread 2: Brain Resolution — public thread, but demonstrates the full
  // per-contribution visibility range: public question, SEALED hypothesis,
  // SHARED interpretation (collaborators only), and a PRIVATE draft.
  const thread2 = await prisma.thread.upsert({
    where: { id: "seed-thread-brain-dimensions" },
    update: { visibility: "public" },
    create: {
      id: "seed-thread-brain-dimensions",
      creatorId: admin.id,
      title:
        "Human brain temporal resolution as a compression artifact of higher-dimensional information",
      description:
        "A speculative thread exploring whether the temporal resolution limits of human perception (e.g., the ~40ms binding window) could be understood as information compression artifacts — as if a higher-dimensional universe's information is being projected through the bottleneck of neural temporal processing.",
      visibility: "public",
      currentStage: "hypothesis",
      domainTags: ["neuroscience", "physics", "philosophy"],
    },
  });

  // Wei collaborates on thread 2 (grants access to shared contributions).
  await prisma.threadCollaborator.upsert({
    where: {
      threadId_userId: { threadId: thread2.id, userId: collaborator.id },
    },
    update: {},
    create: {
      threadId: thread2.id,
      userId: collaborator.id,
      role: "contributor",
      addedBy: admin.id,
    },
  });

  const t2q = new Date("2026-06-15T10:30:00Z");
  const t2qHash = generateHash(admin.id, "Brain temporal resolution question", t2q);
  await prisma.contribution.upsert({
    where: { id: "seed-c2-q1" },
    update: { visibility: "public" },
    create: {
      id: "seed-c2-q1",
      threadId: thread2.id,
      authorId: admin.id,
      type: "question",
      content:
        "If the universe has more dimensions than we perceive, does the human brain's temporal resolution (~40ms for conscious binding) represent a form of lossy compression? What would be the information-theoretic signature of such compression?",
      contentHash: t2qHash,
      visibility: "public",
      createdAt: t2q,
    },
  });

  // SEALED hypothesis — content hidden, hash + timestamp public (anti-scooping).
  const t2h = new Date("2026-06-15T11:00:00Z");
  const t2hHash = generateHash(admin.id, "Brain compression hypothesis", t2h);
  await prisma.contribution.upsert({
    where: { id: "seed-c2-h1" },
    update: { visibility: "sealed", sealedAt: t2h },
    create: {
      id: "seed-c2-h1",
      threadId: thread2.id,
      authorId: admin.id,
      type: "hypothesis",
      content:
        "Hypothesis: The discrete nature of conscious temporal perception (the ~40ms window) is analogous to a sampling theorem constraint. If higher-dimensional information must be projected onto our 3+1 dimensional experience, the temporal axis acts as the primary compression dimension. Prediction: neural oscillation frequencies should show information-theoretic signatures consistent with rate-distortion optimal compression.",
      contentHash: t2hHash,
      visibility: "sealed",
      sealedAt: t2h,
      createdAt: t2h,
    },
  });

  // SHARED interpretation — visible to thread collaborators (Wei) only.
  const t2i = new Date("2026-06-15T11:15:00Z");
  const t2iHash = generateHash(admin.id, "Shared interpretation draft", t2i);
  await prisma.contribution.upsert({
    where: { id: "seed-c2-i1" },
    update: { visibility: "shared" },
    create: {
      id: "seed-c2-i1",
      threadId: thread2.id,
      authorId: admin.id,
      type: "interpretation",
      content:
        "Working note for collaborators: if the sealed hypothesis holds, we should be able to test it against existing EEG datasets before going public. Wei — can you check whether the gamma-band data we discussed shows the predicted rate-distortion signature?",
      contentHash: t2iHash,
      visibility: "shared",
      createdAt: t2i,
    },
  });

  // PRIVATE draft — only the author (Ping) can see this.
  const t2p = new Date("2026-06-15T11:20:00Z");
  const t2pHash = generateHash(admin.id, "Private draft note", t2p);
  await prisma.contribution.upsert({
    where: { id: "seed-c2-p1" },
    update: { visibility: "private" },
    create: {
      id: "seed-c2-p1",
      threadId: thread2.id,
      authorId: admin.id,
      type: "insight",
      content:
        "Private scratchpad: half-formed idea about connecting this to the holographic principle. Not ready to share — revisit after the EEG check.",
      contentHash: t2pHash,
      visibility: "private",
      createdAt: t2p,
    },
  });

  // Seed Thread 3: Complex System Emergence — fully public
  const thread3 = await prisma.thread.upsert({
    where: { id: "seed-thread-emergence" },
    update: { visibility: "public" },
    create: {
      id: "seed-thread-emergence",
      creatorId: admin.id,
      title:
        "Complex system emergence as information propagation in higher-dimensional spaces",
      description:
        "Investigating whether emergent properties in complex systems can be understood as the visible projection of information propagation occurring in higher-dimensional abstract spaces. This connects information geometry, complex systems theory, and theoretical physics.",
      visibility: "public",
      currentStage: "question",
      domainTags: ["complex systems", "information theory", "cosmology"],
    },
  });

  const t3q = new Date("2026-06-15T11:30:00Z");
  const t3qHash = generateHash(admin.id, "Emergence information propagation question", t3q);
  await prisma.contribution.upsert({
    where: { id: "seed-c3-q1" },
    update: { visibility: "public" },
    create: {
      id: "seed-c3-q1",
      threadId: thread3.id,
      authorId: admin.id,
      type: "question",
      content:
        "When a complex system exhibits emergence — behavior not predictable from its parts — could this be because the system is propagating information through a higher-dimensional state space, and what we call 'emergence' is the low-dimensional shadow of that propagation? If so, can we use information geometry to characterize the dimensionality of the 'hidden' space?",
      contentHash: t3qHash,
      visibility: "public",
      createdAt: t3q,
    },
  });

  // Create version + legacy credit records for all seed contributions.
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

    await prisma.credit
      .create({
        data: {
          userId: c.authorId,
          threadId: c.threadId,
          contributionId: c.id,
          creditType: c.type,
          hash: c.contentHash,
          timestamp: c.createdAt,
        },
      })
      .catch(() => {});
  }

  console.log("Seed complete!");
  console.log(`  2 users, 3 threads, ${contributions.length} contributions`);
  console.log(`  Demonstrates: public / sealed / shared / private visibility`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
