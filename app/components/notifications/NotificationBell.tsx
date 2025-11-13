/**
 * NotificationBell Component
 * 
 * A simple bell icon with an unread notification count badge.
 * Used as a trigger for notification dropdown or navigation.
 */

"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  /** Number of unread notifications */
  unreadCount?: number;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Button variant */
  variant?: "default" | "ghost" | "outline";
  /** Size variant */
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * Bell icon with badge showing unread count
 */
export function NotificationBell({
  unreadCount = 0,
  onClick,
  className,
  variant = "ghost",
  size = "icon",
}: NotificationBellProps) {
  const hasUnread = unreadCount > 0;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn("relative", className)}
      aria-label={
        hasUnread
          ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
          : "Notifications"
      }
    >
      <Bell className="h-5 w-5" />
      
      {hasUnread && (
        <span
          className={cn(
            "absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg ring-2 ring-background",
            "animate-in zoom-in duration-200"
          )}
          aria-hidden="true"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
      
      {hasUnread && (
        <span className="absolute -right-1 -top-1 h-5 w-5 animate-ping rounded-full bg-red-400 opacity-75" aria-hidden="true" />
      )}
    </Button>
  );
}
