import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Migrations need the direct (non-pooled) URL. The fallback keeps
  // `prisma generate` working on Vercel, where no connection is opened.
  datasource: { url: process.env.DIRECT_URL ?? "" },
});
