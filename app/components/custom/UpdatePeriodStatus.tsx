"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarCheck, CalendarX, Loader2 } from "lucide-react";

type ConfigStatus = {
  updatePeriod: {
    isActive: boolean;
    current: {
      name: string;
      startDate: string;
      endDate: string;
      description?: string | null;
    } | null;
  };
  actions: Array<{
    id: number;
    actionName: string;
    actionKey: string;
    description?: string | null;
    displayOrder: number;
    config: any;
  }> | null;
};

type Props = {
  educationType?: string;
  showActions?: boolean;
};

export function UpdatePeriodStatus({ educationType, showActions = false }: Props) {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const url = educationType
          ? `/api/admin/config/status?educationType=${encodeURIComponent(educationType)}`
          : "/api/admin/config/status";
        
        const res = await fetch(url);
        const data = await res.json();
        setStatus(data);
      } catch (error) {
        console.error("Error fetching config status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
  }, [educationType]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Checking update period...</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const { updatePeriod } = status;
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (updatePeriod.isActive && updatePeriod.current) {
    return (
      <div className="space-y-4">
        <Alert>
          <CalendarCheck className="h-4 w-4 text-green-600" />
          <AlertTitle>Updates Currently Allowed</AlertTitle>
          <AlertDescription>
            <p className="font-medium">{updatePeriod.current.name}</p>
            <p className="text-sm mt-1">
              Valid from {formatDate(updatePeriod.current.startDate)} to{" "}
              {formatDate(updatePeriod.current.endDate)}
            </p>
            {updatePeriod.current.description && (
              <p className="text-sm mt-2 text-muted-foreground">
                {updatePeriod.current.description}
              </p>
            )}
          </AlertDescription>
        </Alert>

        {showActions && status.actions && status.actions.length > 0 && (
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">Available Actions</h4>
            <ul className="space-y-2">
              {status.actions.map((action) => (
                <li key={action.id} className="flex items-start gap-2">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{action.actionName}</p>
                    {action.description && (
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <Alert variant="destructive">
      <CalendarX className="h-4 w-4" />
      <AlertTitle>Updates Not Available</AlertTitle>
      <AlertDescription>
        Information updates are currently disabled. Please check back during the
        next update period.
      </AlertDescription>
    </Alert>
  );
}
