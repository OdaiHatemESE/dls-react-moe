/**
 * useNotifications Hook
 * 
 * React hooks for fetching and managing notifications with SWR.
 * Supports auto-refresh, optimistic updates, and filtering.
 */

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { jsonFetcher } from "@/lib/swr";
import { toast } from "@/lib/hooks/use-toast";
import { Bell } from "lucide-react";
import type {
  Notification,
  NotificationCount,
  NotificationFilter,
} from "@/types";

/**
 * Hook to fetch and manage notifications
 * 
 * @param filter - Filter options (status, type, limit, offset)
 * @param config - SWR configuration options
 * @returns notifications, total count, loading state, and mutation functions
 */
export function useNotifications(
  filter: NotificationFilter = {},
  config?: { refreshInterval?: number }
) {
  const params = new URLSearchParams();
  
  if (filter.status) params.append("status", filter.status);
  if (filter.type) params.append("type", filter.type);
  if (filter.limit) params.append("limit", filter.limit.toString());
  if (filter.offset) params.append("offset", filter.offset.toString());

  const url = `/api/notifications?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<{
    notifications: Notification[];
    total: number;
  }>(
    url,
    jsonFetcher,
    {
      refreshInterval: config?.refreshInterval ?? 30000, // Default 30s
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  /**
   * Mark a notification as read
   */
  const markAsRead = async (id: number) => {
    try {
      // Optimistic update
      if (data) {
        mutate(
          {
            ...data,
            notifications: data.notifications.map((n) =>
              n.id === id ? { ...n, isRead: true, readAt: new Date() } : n
            ),
          },
          false // Don't revalidate immediately
        );
      }

      // Make API call
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });

      // Revalidate
      mutate();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      // Revert optimistic update on error
      mutate();
    }
  };

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    try {
      // Optimistic update
      if (data) {
        mutate(
          {
            ...data,
            notifications: data.notifications.map((n) => ({
              ...n,
              isRead: true,
              readAt: new Date(),
            })),
          },
          false
        );
      }

      // Make API call
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      // Revalidate
      mutate();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      // Revert on error
      mutate();
    }
  };

  /**
   * Manually refresh notifications
   */
  const refresh = () => mutate();

  return {
    notifications: data?.notifications ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}

/**
 * Hook to fetch notification count
 * 
 * @param config - SWR configuration options
 * @returns unread count, total count, and refresh function
 */
export function useNotificationCount(config?: { 
  refreshInterval?: number;
  showToast?: boolean;
  locale?: string;
}) {
  const previousUnreadRef = useRef<number | undefined>(undefined);
  const isFirstLoadRef = useRef(true);
  
  const { data, error, isLoading, mutate } = useSWR<NotificationCount>(
    "/api/notifications/count",
    jsonFetcher,
    {
      refreshInterval: config?.refreshInterval ?? 30000, // Default 30s
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  // Show toast when new notifications arrive
  useEffect(() => {
    const showToast = config?.showToast !== false; // Default true
    const locale = config?.locale || "en";
    
    if (showToast && data) {
      // On first load, just set the initial count without showing toast
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
        previousUnreadRef.current = data.unread;
        return;
      }
      
      // Check if there are new notifications
      if (previousUnreadRef.current !== undefined) {
        const newUnread = data.unread - previousUnreadRef.current;
        
        if (newUnread > 0) {
          const isArabic = locale === "ar";
          const title = isArabic 
            ? newUnread === 1 ? "🔔 إشعار جديد" : "🔔 إشعارات جديدة"
            : newUnread === 1 ? "🔔 New Notification" : "🔔 New Notifications";
          
          const description = isArabic 
            ? `لديك ${newUnread} إشعار${newUnread > 1 ? 'ات' : ''} جديد${newUnread > 1 ? 'ة' : ''}`
            : `You have ${newUnread} new notification${newUnread > 1 ? 's' : ''}`;
          
          toast({
            title,
            description,
            duration: 5000,
          });
        }
      }
      
      // Update the previous count
      previousUnreadRef.current = data.unread;
    }
  }, [data?.unread, config?.showToast, config?.locale]);

  return {
    count: data,
    unread: data?.unread ?? 0,
    total: data?.total ?? 0,
    isLoading,
    error,
    refresh: () => mutate(),
  };
}
