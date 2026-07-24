import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { generateCredits } from "../lib/credits";

const prisma = new PrismaClient();

// Mirror src/lib/hash.ts generatePriorityHash: SHA-256 over authorId|content|ISO.
// Hashing the ACTUAL content (not a label) keeps seed data verifiable, so the
// reveal flow's integrity check passes.
function priorityHash(userId: string, content: string, timestamp: Date) {
  const payload = `${userId}|${content}|${timestamp.toISOString()}`;
  return crypto.createHash("sha256").update(payload, "utf-8").digest("hex");
}

async function seedContribution(opts: {
  id: string;
  threadId: string;
  authorId: string;
  type: string;
  content: string;
  visibility: string;
  createdAt: Date;
  sealedAt?: Date;
}) {
  const contentHash = priorityHash(opts.authorId, opts.content, opts.createdAt);
  // Seeded public contributions are treated as published at creation time so
  // they carry a credit timestamp (Web Prototype §3B). Non-public → null.
  const publishedAt = opts.visibility === "public" ? opts.createdAt : null;
  await prisma.contribution.upsert({
    where: { id: opts.id },
    update: {
      visibility: opts.visibility,
      content: opts.content,
      contentHash,
      sealedAt: opts.sealedAt ?? null,
      revealedAt: null,
      publishedAt,
    },
    create: {
      id: opts.id,
      threadId: opts.threadId,
      authorId: opts.authorId,
      type: opts.type,
      content: opts.content,
      contentHash,
      visibility: opts.visibility,
      sealedAt: opts.sealedAt ?? null,
      publishedAt,
      createdAt: opts.createdAt,
    },
  });
}

async function main() {
  console.log("Seeding Discovery Commons...");

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

  // Collaborator (Wei) — demonstrates shared visibility + thread collaborators.
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

  // ---- Thread 1: Soundscape — fully public ----
  const thread1 = await prisma.thread.upsert({
    where: { id: "seed-thread-soundscape" },
    update: { visibility: "public", discipline: "earth_environment" },
    create: {
      id: "seed-thread-soundscape",
      creatorId: admin.id,
      title:
        "Does information extraction reproducibility correlate with soundscape complexity?",
      description:
        "Exploring the relationship between soundscape complexity metrics and the reproducibility of information extraction from acoustic recordings. As ecological monitoring increasingly relies on automated analysis of soundscapes, understanding how complexity affects extraction reliability becomes critical for methodology validation.",
      visibility: "public",
      discipline: "earth_environment",
      currentStage: "question",
      domainTags: ["ecology", "acoustics", "methodology"],
    },
  });

  await seedContribution({
    id: "seed-c1-q1",
    threadId: thread1.id,
    authorId: admin.id,
    type: "question",
    visibility: "public",
    createdAt: new Date("2026-06-15T10:00:00Z"),
    content:
      "When we extract species-level information from complex multi-species soundscapes, how does the acoustic complexity index (ACI) of the recording environment affect the reproducibility of our extraction results? Are simpler soundscapes more reproducible, or does complexity provide redundant information that actually improves reliability?",
  });

  // ---- Thread 2: Brain resolution — public thread, full visibility range ----
  const thread2 = await prisma.thread.upsert({
    where: { id: "seed-thread-brain-dimensions" },
    update: { visibility: "public", discipline: "interdisciplinary" },
    create: {
      id: "seed-thread-brain-dimensions",
      creatorId: admin.id,
      title:
        "Human brain temporal resolution as a compression artifact of higher-dimensional information",
      description:
        "A speculative thread exploring whether the temporal resolution limits of human perception (e.g., the ~40ms binding window) could be understood as information compression artifacts — as if a higher-dimensional universe's information is being projected through the bottleneck of neural temporal processing.",
      visibility: "public",
      discipline: "interdisciplinary",
      currentStage: "hypothesis",
      domainTags: ["neuroscience", "physics", "philosophy"],
    },
  });

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

  await seedContribution({
    id: "seed-c2-q1",
    threadId: thread2.id,
    authorId: admin.id,
    type: "question",
    visibility: "public",
    createdAt: new Date("2026-06-15T10:30:00Z"),
    content:
      "If the universe has more dimensions than we perceive, does the human brain's temporal resolution (~40ms for conscious binding) represent a form of lossy compression? What would be the information-theoretic signature of such compression?",
  });

  // SEALED hypothesis — content hidden, hash + timestamp public (anti-scooping).
  const t2h = new Date("2026-06-15T11:00:00Z");
  await seedContribution({
    id: "seed-c2-h1",
    threadId: thread2.id,
    authorId: admin.id,
    type: "hypothesis",
    visibility: "sealed",
    createdAt: t2h,
    sealedAt: t2h,
    content:
      "Hypothesis: The discrete nature of conscious temporal perception (the ~40ms window) is analogous to a sampling theorem constraint. If higher-dimensional information must be projected onto our 3+1 dimensional experience, the temporal axis acts as the primary compression dimension. Prediction: neural oscillation frequencies should show information-theoretic signatures consistent with rate-distortion optimal compression.",
  });

  // SHARED interpretation — visible to thread collaborators (Wei) only.
  await seedContribution({
    id: "seed-c2-i1",
    threadId: thread2.id,
    authorId: admin.id,
    type: "interpretation",
    visibility: "shared",
    createdAt: new Date("2026-06-15T11:15:00Z"),
    content:
      "Working note for collaborators: if the sealed hypothesis holds, we should be able to test it against existing EEG datasets before going public. Wei — can you check whether the gamma-band data we discussed shows the predicted rate-distortion signature?",
  });

  // PRIVATE draft — only the author (Ping) can see this.
  await seedContribution({
    id: "seed-c2-p1",
    threadId: thread2.id,
    authorId: admin.id,
    type: "insight",
    visibility: "private",
    createdAt: new Date("2026-06-15T11:20:00Z"),
    content:
      "Private scratchpad: half-formed idea about connecting this to the holographic principle. Not ready to share — revisit after the EEG check.",
  });

  // ---- Thread 3: Emergence — fully public ----
  const thread3 = await prisma.thread.upsert({
    where: { id: "seed-thread-emergence" },
    update: { visibility: "public", discipline: "physical_sciences" },
    create: {
      id: "seed-thread-emergence",
      creatorId: admin.id,
      title:
        "Complex system emergence as information propagation in higher-dimensional spaces",
      description:
        "Investigating whether emergent properties in complex systems can be understood as the visible projection of information propagation occurring in higher-dimensional abstract spaces. This connects information geometry, complex systems theory, and theoretical physics.",
      visibility: "public",
      discipline: "physical_sciences",
      currentStage: "question",
      domainTags: ["complex systems", "information theory", "cosmology"],
    },
  });

  await seedContribution({
    id: "seed-c3-q1",
    threadId: thread3.id,
    authorId: admin.id,
    type: "question",
    visibility: "public",
    createdAt: new Date("2026-06-15T11:30:00Z"),
    content:
      "When a complex system exhibits emergence — behavior not predictable from its parts — could this be because the system is propagating information through a higher-dimensional state space, and what we call 'emergence' is the low-dimensional shadow of that propagation? If so, can we use information geometry to characterize the dimensionality of the 'hidden' space?",
  });

  // Version + credit records for all seed contributions.
  const contributions = await prisma.contribution.findMany({
    where: { id: { startsWith: "seed-" } },
  });
  const seedIds = contributions.map((c) => c.id);

  // Idempotent: clear prior seed credits so re-seeding doesn't duplicate them.
  // (On fresh Postgres these match nothing; SQLite has no delete triggers.)
  await prisma.creditV2.deleteMany({ where: { contributionId: { in: seedIds } } });
  await prisma.credit.deleteMany({ where: { contributionId: { in: seedIds } } });

  for (const c of contributions) {
    await prisma.contributionVersion.upsert({
      where: {
        contributionId_versionNumber: {
          contributionId: c.id,
          versionNumber: 1,
        },
      },
      update: { content: c.content, contentHash: c.contentHash },
      create: {
        contributionId: c.id,
        versionNumber: 1,
        content: c.content,
        contentHash: c.contentHash,
      },
    });

    // Legacy v1 credit (contribution-type keyed).
    await prisma.credit.create({
      data: {
        userId: c.authorId,
        threadId: c.threadId,
        contributionId: c.id,
        creditType: c.type,
        hash: c.contentHash,
        timestamp: c.createdAt,
      },
    });

    // v2 credits — the 4-dimension prototype model (idea/data/analysis/validation).
    await generateCredits(
      { id: c.id, authorId: c.authorId, threadId: c.threadId, type: c.type },
      prisma
    );
  }

  console.log("Seed complete!");
  console.log(`  2 users, 3 threads, ${contributions.length} contributions`);
  console.log(`  Demonstrates: public / sealed / shared / private + 5-dim credits`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
