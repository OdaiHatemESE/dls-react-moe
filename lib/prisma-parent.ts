import { PrismaClient } from "@prisma/client-parent-portal";

// Ensure a single PrismaClient instance across hot reloads in dev
const globalForPrisma = globalThis as unknown as { prismaParent?: PrismaClient };

export const prismaParent =
  globalForPrisma.prismaParent ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaParent = prismaParent;

export default prismaParent;
