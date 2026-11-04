export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (message: string) => new AppError(400, "BAD_REQUEST", message);
export const unauthorized = (message = "Authentication required") =>
  new AppError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "You do not have permission to do this") =>
  new AppError(403, "FORBIDDEN", message);
export const notFound = (resource: string) =>
  new AppError(404, "NOT_FOUND", `${resource} not found`);
