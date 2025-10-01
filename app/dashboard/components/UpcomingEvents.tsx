"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "@/app/components/icons";
import { mockCalendarEvents } from "@/app/data/mockData";
import { useI18n } from "@/app/i18n/I18nProvider";
import clsx from "clsx";

export default function UpcomingEvents() {
  const { t, locale } = useI18n();
  const upcomingEvents = mockCalendarEvents.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <CalendarIcon className="w-5 h-5 me-2 text-purple-600" />
            {t.dashboard.upcomingEvents}
          </CardTitle>
          <Link
            href="/calendar"
            className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
          >
            {t.dashboard.viewCalendar}
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between border-b border-gray-200 last:border-b-0 pb-4 last:pb-0"
            >
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {event.title}
                </h4>
                <div
                  className={clsx(
                    "flex items-center gap-2",
                    locale === "ar" && "flex-row-reverse"
                  )}
                >
                  <span className="text-sm text-gray-600">
                    {new Date(event.date).toLocaleDateString(locale)}
                  </span>
                  {event.time && (
                    <span className="text-sm text-gray-600">• {event.time}</span>
                  )}
                </div>
              </div>
              <Badge
                variant={
                  event.type === "exam"
                    ? "secondary"
                    : event.type === "holiday"
                    ? "default"
                    : "outline"
                }
                className="text-xs"
              >
                {event.type}
              </Badge>
            </div>
          ))}
          {upcomingEvents.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              {t.dashboard.noUpcomingEvents}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
