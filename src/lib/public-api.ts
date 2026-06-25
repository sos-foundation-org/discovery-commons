import { NextResponse } from "next/server";

// Shared CORS headers for the public External Collaboration API. These
// endpoints are read-only, return only L3 (public) content, and are designed
// for any external platform (including future IoBI collaboration) to consume.
export const PUBLIC_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** JSON-LD response with CORS headers for interoperability. */
export function jsonLd(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...PUBLIC_CORS_HEADERS,
      "Content-Type": "application/ld+json",
      ...(init?.headers || {}),
    },
  });
}

/** Standard CORS preflight handler for the public routes. */
export function corsPreflight() {
  return new NextResponse(null, { status: 204, headers: PUBLIC_CORS_HEADERS });
}
