import { NextRequest, NextResponse } from "next/server";

type RouteHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse> | NextResponse;

/**
 * Typed API error that carries an HTTP status code.
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Wraps an API route handler with consistent error handling.
 * Catches unhandled errors and returns a structured JSON response.
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      console.error(`[API Error] ${request.method} ${request.nextUrl.pathname}:`, error);
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  };
}

/**
 * Parse JSON body with a consistent error response on invalid JSON.
 */
export async function parseBody<T = unknown>(request: NextRequest): Promise<T> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Invalid JSON in request body");
  }
}
