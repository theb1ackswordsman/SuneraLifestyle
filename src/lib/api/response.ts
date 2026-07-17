import { NextResponse } from "next/server";

export const ok = <T>(data: T, message?: string) =>
  NextResponse.json({ success: true, data, ...(message && { message }) }, { status: 200 });

export const created = <T>(data: T, message?: string) =>
  NextResponse.json({ success: true, data, ...(message && { message }) }, { status: 201 });

export const badRequest = (error: string) =>
  NextResponse.json({ success: false, error }, { status: 400 });

export const unauthorized = (error = "Unauthorized") =>
  NextResponse.json({ success: false, error }, { status: 401 });

export const forbidden = (error = "Access denied") =>
  NextResponse.json({ success: false, error }, { status: 403 });

export const notFound = (error = "Not found") =>
  NextResponse.json({ success: false, error }, { status: 404 });

export const conflict = (error: string) =>
  NextResponse.json({ success: false, error }, { status: 409 });

export const tooManyRequests = (error = "Too many requests, please try again later") =>
  NextResponse.json({ success: false, error }, { status: 429 });

export const serverError = (error = "Internal server error") =>
  NextResponse.json({ success: false, error }, { status: 500 });

export function handleApiError(err: unknown): NextResponse {
  console.error("[API Error]", err);
  if (err instanceof Error) {
    // Mongoose duplicate key
    if ("code" in err && (err as NodeJS.ErrnoException).code === "11000") {
      return conflict("A record with this value already exists");
    }
    if (err.name === "ValidationError") {
      return badRequest(err.message);
    }
    if (err.name === "JsonWebTokenError" || err.name === "JWTInvalid") {
      return unauthorized("Invalid or expired token");
    }
  }
  return serverError();
}
