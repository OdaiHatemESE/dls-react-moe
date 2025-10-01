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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <AnnouncementsIcon className="w-5 h-5 me-2 text-orange-600" />
            {t.dashboard.recentAnnouncements}
          </CardTitle>
          <Link
            href="/announcements"
            className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
          >
            {t.dashboard.viewAll}
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {announcement.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {announcement.content}
                  </p>
                  <div className={clsx("flex items-center gap-2")}>
                    <Badge
                      variant={
                        announcement.category === "urgent"
                          ? "destructive"
                          : announcement.category === "school"
                          ? "default"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {announcement.category}
                    </Badge>
                    <span className="text-xs text-gray-500">
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
