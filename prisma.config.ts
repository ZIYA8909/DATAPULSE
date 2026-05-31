import path from "node:path";
import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Explicitly load .env since prisma.config.ts runs outside Next.js runtime
config({ path: path.join(process.cwd(), ".env") });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
