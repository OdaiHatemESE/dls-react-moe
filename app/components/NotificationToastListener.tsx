"use client";

/**
 * NotificationToastListener Component
 * 
 * Centralized listener for new notifications that shows toast alerts.
 * This component should only be mounted once in the app to prevent duplicate toasts.
 */

import { useEffect, useRef } from "react";
import { useNotificationCount } from "@/lib/hooks/useNotifications";
import { toast } from "@/lib/hooks/use-toast";
import { useI18n } from "@/app/i18n/I18nProvider";

export function NotificationToastListener() {
  const { locale } = useI18n();
  const previousUnreadRef = useRef<number | undefined>(undefined);
  const isFirstLoadRef = useRef(true);
  
  const { unread } = useNotificationCount({ 
    showToast: false, // Disable the hook's internal toast
    refreshInterval: 30000,
  });

  // Show toast when new notifications arrive
  useEffect(() => {
    // On first load, just set the initial count without showing toast
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      previousUnreadRef.current = unread;
      return;
    }
    
    // Check if there are new notifications
    if (previousUnreadRef.current !== undefined && unread > previousUnreadRef.current) {
      const newUnread = unread - previousUnreadRef.current;
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
    
    // Update the previous count
    previousUnreadRef.current = unread;
  }, [unread, locale]);

  return null; // This component only handles side effects
}
