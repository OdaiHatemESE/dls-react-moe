"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnnouncementsIcon } from "@/app/components/icons";
import { mockAnnouncements } from "@/app/data/mockData";
import { useI18n } from "@/app/i18n/I18nProvider";
import clsx from "clsx";

export default function RecentAnnouncements() {
  const { t, locale } = useI18n();
  const recentAnnouncements = mockAnnouncements.slice(0, 3);

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="bg-orange-50 border-b border-orange-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-3">
              <AnnouncementsIcon className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-gray-900">{t.dashboard.recentAnnouncements}</span>
          </CardTitle>
          <Link
            href="/announcements"
            className="text-sm text-orange-600 hover:text-orange-700 font-medium hover:bg-orange-100 px-3 py-1 rounded-lg transition-colors"
          >
            {t.dashboard.viewAll}
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {recentAnnouncements.map((announcement, index) => (
            <div
              key={announcement.id}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={clsx(
                      "w-2 h-2 rounded-full",
                      announcement.category === "urgent" ? "bg-red-500" :
                      announcement.category === "school" ? "bg-blue-500" : "bg-gray-400"
                    )}></div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {announcement.title}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {announcement.content}
                  </p>
                  <div className={clsx("flex items-center gap-3")}>
                    <Badge
                      variant={
                        announcement.category === "urgent"
                          ? "destructive"
                          : announcement.category === "school"
                          ? "default"
                          : "outline"
                      }
                      className="text-xs px-2 py-1"
                    >
                      {announcement.category}
                    </Badge>
                    <span className="text-xs text-gray-500 font-medium">
                      {new Date(announcement.date).toLocaleDateString(locale)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {recentAnnouncements.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              {t.dashboard.noRecentAnnouncements}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
