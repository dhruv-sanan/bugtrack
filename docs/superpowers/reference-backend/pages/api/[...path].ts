import app from "@/server/app";

// Hands every /api/* request to Express. Express parses bodies itself, and
// externalResolver tells Next.js that Express sends the response.
export const config = { api: { bodyParser: false, externalResolver: true } };

export default app;
