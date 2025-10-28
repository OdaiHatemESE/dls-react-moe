import { PrismaClient as ParentPortalPrisma } from "@prisma/client-parent-portal";

const prisma = new ParentPortalPrisma();

/**
 * Check if information updates are currently allowed based on configured periods
 */
export async function isUpdatePeriodActive(): Promise<boolean> {
  try {
    const now = new Date();
    
    const activePeriod = await prisma.updatePeriodConfig.findFirst({
      where: {
        isEnabled: true,
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
    });

    return !!activePeriod;
  } catch (error) {
    console.error("Error checking update period:", error);
    return false;
  }
}

/**
 * Get current active update period details
 */
export async function getCurrentUpdatePeriod() {
  try {
    const now = new Date();
    
    return await prisma.updatePeriodConfig.findFirst({
      where: {
        isEnabled: true,
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching current update period:", error);
    return null;
  }
}

/**
 * Get enabled actions for a specific education type
 */
export async function getEnabledActionsForEducationType(educationType: string) {
  try {
    return await prisma.studentActionConfig.findMany({
      where: {
        educationType,
        isEnabled: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    });
  } catch (error) {
    console.error("Error fetching student actions:", error);
    return [];
  }
}

/**
 * Check if a user is an admin by Emirates ID
 */
export async function isAdminUser(emirateId: string): Promise<boolean> {
  try {
    const normalizedEid = emirateId.replace(/[-\s]/g, "");
    
    const adminUser = await prisma.adminUser.findUnique({
      where: { emirateId: normalizedEid },
    });

    return adminUser?.isActive ?? false;
  } catch (error) {
    console.error("Error checking admin user:", error);
    return false;
  }
}
