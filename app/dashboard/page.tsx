"use client";

import React from 'react';
// Unused UI and icons were removed after refactor
import { useI18n } from "@/app/i18n/I18nProvider";
import clsx from "clsx";
import ChildCards from "./components/ChildCards";
import RecentAnnouncements from "./components/RecentAnnouncements";
import UpcomingEvents from "./components/UpcomingEvents";

export default function DashboardPage() {
  const { t, locale } = useI18n();
  // Data slicing moved inside respective components

  return (
    <div className={clsx("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", locale === 'ar' && 'direction-rtl')}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.title}</h1>
        <p className="mt-1 text-sm text-gray-600">{t.dashboard.welcome}</p>
      </div>

      {/* Children Cards */}
      <ChildCards />

    
    </div>
  );
}