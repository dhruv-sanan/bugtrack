import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError, z } from "zod";
import { AppError, notFound } from "./errors";

interface ErrorBody {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

// Prisma's request errors carry stable string codes.
const PRISMA_ERRORS: Record<string, ErrorBody> = {
  P2002: { status: 409, code: "CONFLICT", message: "That value is already in use" },
  P2003: { status: 400, code: "BAD_REFERENCE", message: "A referenced record does not exist" },
  P2025: { status: 404, code: "NOT_FOUND", message: "Record not found" },
};

function toErrorBody(err: unknown): ErrorBody | undefined {
  if (err instanceof AppError) {
    return { status: err.status, code: err.code, message: err.message, details: err.details };
  }
  if (err instanceof ZodError) {
    return {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Please check the submitted values",
      details: z.flattenError(err),
    };
  }
  if (typeof err !== "object" || err === null) return undefined;

  const { code, type } = err as { code?: unknown; type?: unknown };
  if (typeof code === "string" && code in PRISMA_ERRORS) return PRISMA_ERRORS[code];
  // Raised by express.json() for bodies it cannot accept.
  if (type === "entity.parse.failed") {
    return { status: 400, code: "BAD_JSON", message: "Request body is not valid JSON" };
  }
  if (type === "entity.too.large") {
    return { status: 413, code: "BODY_TOO_LARGE", message: "Request body is too large" };
  }
  return undefined;
}

export const notFoundHandler: RequestHandler = () => {
  throw notFound("Route");
};

// Express identifies error handlers by their four-argument signature.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const known = toErrorBody(err);
  if (!known) console.error("Unhandled API error:", err);

  const { status, code, message, details } = known ?? {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Something went wrong",
  };
  res.status(status).json({ error: { code, message, details } });
};
