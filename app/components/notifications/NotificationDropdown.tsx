/**
 * NotificationDropdown Component
 * 
 * A complete dropdown popup showing latest notifications.
 * Includes bell icon trigger, notification list, and "View all" link.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "./NotificationBell";
import { NotificationCard } from "./NotificationCard";
import { useNotifications, useNotificationCount } from "@/lib/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface NotificationDropdownProps {
  /** Locale for translations */
  locale?: string;
  /** Maximum number of notifications to show in dropdown */
  limit?: number;
}

/**
 * Notification dropdown with bell trigger
 * Shows latest notifications and provides quick actions
 */
export function NotificationDropdown({
  locale = "en",
  limit = 5,
}: NotificationDropdownProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isRTL = locale === "ar";

  // Fetch notification count for badge
  const { unread, refresh: refreshCount } = useNotificationCount();

  // Fetch latest notifications for dropdown
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications({ status: "all", limit });

  // Handle notification click
  const handleNotificationClick = (id: number) => {
    markAsRead(id);
    setOpen(false);
  };

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    await markAllAsRead();
    refreshCount();
  };

  // Handle refresh
  const handleRefresh = () => {
    refresh();
    refreshCount();
  };

  // Translations
  const t = {
    notifications: locale === "ar" ? "الإشعارات" : "Notifications",
    markAllRead: locale === "ar" ? "تحديد الكل كمقروء" : "Mark all as read",
    viewAll: locale === "ar" ? "عرض الكل" : "View all",
    noNotifications: locale === "ar" ? "لا توجد إشعارات" : "No notifications",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
    refresh: locale === "ar" ? "تحديث" : "Refresh",
  };

  const hasUnread = unread > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div>
          <NotificationBell unreadCount={unread} />
        </div>
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          "w-[90vw] max-w-md p-0 shadow-xl",
          isRTL && "rtl"
        )}
        align={isRTL ? "start" : "end"}
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
          <h3 className="text-sm font-semibold">{t.notifications}</h3>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-8 px-2 text-xs"
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              <span className={cn("ml-1", isRTL && "mr-1 ml-0")}>{t.refresh}</span>
            </Button>
            
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="h-8 px-2 text-xs"
              >
                {t.markAllRead}
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              {t.loading}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              {t.noNotifications}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <NotificationCard
                    notification={notification}
                    onRead={markAsRead}
                    showFullBody={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs font-medium"
                onClick={() => {
                  router.push("/notifications");
                  setOpen(false);
                }}
              >
                {t.viewAll}
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
