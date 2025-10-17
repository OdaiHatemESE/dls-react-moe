import { PrismaClient } from "@prisma/client-student-registration";

// Ensure a single PrismaClient instance across hot reloads in dev
const globalForPrisma = globalThis as unknown as { prismaStudent?: PrismaClient };

export const prismaStudent =
  globalForPrisma.prismaStudent ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaStudent = prismaStudent;

export default prismaStudent;
