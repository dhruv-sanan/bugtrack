import { z } from "zod";

const schema = z.object({
  JWT_SECRET: z.string().min(32, "must be at least 32 characters"),
  APP_URL: z.url().default("http://localhost:3000"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
});

let cached: z.infer<typeof schema> | undefined;

/**
 * Read lazily, not at import time: `next build` imports API routes while
 * collecting page data, when runtime secrets may not exist.
 */
export function env() {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // A plain Error, so the error handler returns a generic 500 rather than
    // reporting configuration problems to API clients as a validation error.
    throw new Error(`Invalid environment: ${z.prettifyError(parsed.error)}`);
  }
  cached = parsed.data;
  return cached;
}
