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

// Translate raw Mongoose field paths into plain-language messages
function friendlyValidationError(err: Error): string {
  const mongoErr = err as Error & {
    errors?: Record<string, { path: string; kind: string }>;
  };
  if (!mongoErr.errors) return "Please check all required fields and try again.";

  const keys = Object.keys(mongoErr.errors);

  // Variant sub-document errors
  if (keys.some((k) => k.startsWith("variants."))) {
    return "Please fill in all required information for each size / pack option.";
  }

  const FIELD_LABELS: Record<string, string> = {
    name:           "Product name",
    slug:           "Page URL",
    sku:            "Product code",
    basePrice:      "Selling price",
    compareAtPrice: "MRP / Original price",
    stock:          "Stock quantity",
    category:       "Category",
    description:    "Description",
    email:          "Email address",
    password:       "Password",
    phone:          "Phone number",
  };

  const first  = mongoErr.errors[keys[0]];
  const label  = FIELD_LABELS[first?.path ?? keys[0]] ?? (first?.path ?? keys[0]);
  const kind   = first?.kind ?? "";

  if (kind === "required") return `${label} is required.`;
  if (kind === "min")      return `${label} cannot be negative.`;
  if (kind === "max")      return `${label} value is too high.`;
  if (kind === "enum")     return `${label} has an invalid value.`;

  return "Please check all required fields and try again.";
}

export function handleApiError(err: unknown): NextResponse {
  console.error("[API Error]", err);
  if (err instanceof Error) {
    // Mongoose duplicate key
    if ("code" in err && (err as NodeJS.ErrnoException).code === "11000") {
      return conflict("A product with this code or URL already exists.");
    }
    if (err.name === "ValidationError") {
      return badRequest(friendlyValidationError(err));
    }
    if (err.name === "JsonWebTokenError" || err.name === "JWTInvalid") {
      return unauthorized("Invalid or expired session. Please log in again.");
    }
  }
  return serverError();
}
