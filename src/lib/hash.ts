import crypto from "crypto";

export function generatePriorityHash(
  userId: string,
  content: string,
  timestamp: Date
): string {
  const payload = `${userId}|${content}|${timestamp.toISOString()}`;
  return crypto.createHash("sha256").update(payload, "utf-8").digest("hex");
}

export function generateContentHash(content: string): string {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex");
}

export function verifyHash(
  userId: string,
  content: string,
  timestamp: Date,
  hash: string
): boolean {
  const computed = generatePriorityHash(userId, content, timestamp);
  return computed === hash;
}

export function truncateHash(hash: string, length: number = 8): string {
  return hash.slice(0, length) + "..." + hash.slice(-4);
}
