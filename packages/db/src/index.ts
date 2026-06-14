import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

// Prisma 7's new client requires a driver adapter (the DB URL is no longer
// read from the schema). We use the node-postgres adapter against Neon.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
const adapter = new PrismaPg({ connectionString });

// Reuse a single PrismaClient across hot-reloads in development.
// Without this, Next.js's dev hot-reload creates a new client (and a new
// DB connection pool) on every file change, quickly exhausting the
// connection limit on free-tier databases (Neon/Supabase).
const globalForPrisma = globalThis as unknown as {
  prisma?: InstanceType<typeof PrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}