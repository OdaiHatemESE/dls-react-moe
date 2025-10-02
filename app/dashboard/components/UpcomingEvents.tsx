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
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="bg-purple-50 border-b border-purple-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <CalendarIcon className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-gray-900">{t.dashboard.upcomingEvents}</span>
          </CardTitle>
          <Link
            href="/calendar"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:bg-purple-100 px-3 py-1 rounded-lg transition-colors"
          >
            {t.dashboard.viewCalendar}
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    {event.title}
                  </h4>
                  <div className={clsx("flex items-center gap-3", locale === "ar" && "flex-row-reverse")}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 font-medium">
                        {new Date(event.date).toLocaleDateString(locale)}
                      </span>
                      {event.time && (
                        <span className="text-sm text-gray-600">• {event.time}</span>
                      )}
                    </div>
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
