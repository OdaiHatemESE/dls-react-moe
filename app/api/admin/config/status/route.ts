import { NextResponse } from "next/server";
import { 
  isUpdatePeriodActive, 
  getCurrentUpdatePeriod,
  getEnabledActionsForEducationType 
} from "@/lib/admin-config";

// GET configuration status for a specific education type
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const educationType = searchParams.get("educationType");

    // Check if updates are currently allowed
    const isActive = await isUpdatePeriodActive();
    const currentPeriod = await getCurrentUpdatePeriod();

    // Get actions for education type if specified
    let actions = null;
    if (educationType) {
      actions = await getEnabledActionsForEducationType(educationType);
    }

    return NextResponse.json({
      updatePeriod: {
        isActive,
        current: currentPeriod ? {
          name: currentPeriod.name,
          startDate: currentPeriod.startDate,
          endDate: currentPeriod.endDate,
          description: currentPeriod.description,
        } : null,
      },
      actions: actions ? actions.map(action => ({
        id: action.id,
        actionName: action.actionName,
        actionKey: action.actionKey,
        description: action.description,
        displayOrder: action.displayOrder,
        config: action.configJson ? JSON.parse(action.configJson) : null,
      })) : null,
    });
  } catch (error) {
    console.error("Error fetching config status:", error);
    return NextResponse.json(
      { error: "Failed to fetch configuration status" },
      { status: 500 }
    );
  }
}
