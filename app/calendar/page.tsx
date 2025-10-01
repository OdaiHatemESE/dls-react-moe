"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '../components/custom/States';
import { 
  CalendarIcon, 
  ExportIcon,
  ChevronRightIcon,
  ChevronDownIcon 
} from '../components/icons';
import { mockCalendarEvents } from '../data/mockData';
import { useI18n } from "@/app/i18n/I18nProvider";
import clsx from "clsx";

export default function CalendarPage() {
  const { t, locale } = useI18n();
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const currentMonth = selectedMonth.getMonth();
  const currentYear = selectedMonth.getFullYear();

  // Generate calendar days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Filter events for the current month
  const monthEvents = mockCalendarEvents.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
  });

  // Group events by date
  const eventsByDate = monthEvents.reduce((acc, event) => {
    const date = new Date(event.date).getDate();
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<number, typeof mockCalendarEvents>);

  const handleExport = (type: 'google' | 'outlook') => {
    alert(`Export to ${type} would be implemented here (This is a demo)`);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div className={clsx("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", locale === 'ar' && 'direction-rtl')}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.calendar.title}</h1>
          <p className="mt-1 text-sm text-gray-600">{t.calendar.subtitle}</p>
        </div>
  <div className={clsx("flex items-center gap-3")}>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              {t.calendar.month}
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              {t.calendar.list}
            </Button>
          </div>
          <div className="relative">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ExportIcon className="w-4 h-4" />
              <span>{t.calendar.export}</span>
              <ChevronDownIcon className="w-4 h-4" />
            </Button>
            {/* Export dropdown would be implemented here */}
          </div>
        </div>
      </div>

      {viewMode === 'month' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {selectedMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
              </CardTitle>
              <div className={clsx("flex items-center gap-2")}>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')} aria-label="Previous month">
                  <ChevronRightIcon className={clsx("w-4 h-4", locale === 'ar' ? '' : 'transform rotate-180')} />
                </Button>
                <button
                  onClick={() => setSelectedMonth(new Date())}
                  className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
                >
                  {t.common.today}
                </button>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')} aria-label="Next month">
                  <ChevronRightIcon className={clsx("w-4 h-4", locale === 'ar' ? 'transform rotate-180' : '')} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {/* Day headers */}
              {(t.calendar.daysShort as string[]).map(day => (
                <div key={day} className="bg-gray-50 p-2 text-center">
                  <span className="text-xs font-medium text-gray-500">{day}</span>
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`bg-white p-2 min-h-[100px] ${
                    day ? 'hover:bg-gray-50' : ''
                  }`}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${
                          day === new Date().getDate() && 
                          currentMonth === new Date().getMonth() && 
                          currentYear === new Date().getFullYear()
                            ? 'text-blue-600' 
                            : 'text-gray-900'
                        }`}>
                          {day}
                        </span>
                      </div>
                      {eventsByDate[day] && (
                        <div className="space-y-1">
                          {eventsByDate[day].slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded truncate ${
                                event.type === 'exam' ? 'bg-yellow-100 text-yellow-800' :
                                event.type === 'holiday' ? 'bg-green-100 text-green-800' :
                                event.type === 'meeting' ? 'bg-purple-100 text-purple-800' :
                                'bg-blue-100 text-blue-800'
                              }`}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          ))}
                          {eventsByDate[day].length > 2 && (
                            <div className="text-xs text-gray-500 truncate">
                              +{eventsByDate[day].length - 2} {t.calendar.more}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className={clsx("flex items-center gap-2")}>
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">{t.calendar.legend.event}</span>
              </div>
              <div className={clsx("flex items-center gap-2")}>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-700">{t.calendar.legend.exam}</span>
              </div>
              <div className={clsx("flex items-center gap-2")}>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">{t.calendar.legend.holiday}</span>
              </div>
              <div className={clsx("flex items-center gap-2")}>
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-700">{t.calendar.legend.meeting}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="w-5 h-5 me-2" />
              {t.calendar.upcomingEvents}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mockCalendarEvents.length > 0 ? (
              <div className="space-y-4">
                {mockCalendarEvents.map((event) => (
                  <div key={event.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      )}
                      <div className={clsx("flex items-center gap-4 text-sm text-gray-500")}>
                        <span>
                          {new Date(event.date).toLocaleDateString(locale, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        {event.time && <span>• {event.time}</span>}
                      </div>
                    </div>
                    <div className="ms-4">
                      <Badge
                        variant={
                          event.type === 'exam' ? 'secondary' :
                          event.type === 'holiday' ? 'default' :
                          event.type === 'meeting' ? 'outline' : 'outline'
                        }
                      >
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarIcon}
                title="No events scheduled"
                description="There are no upcoming events at this time"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Export Actions */}
      <div className={clsx("mt-6 flex justify-center gap-4")}>
        <Button
          onClick={() => handleExport('google')}
          className={clsx("flex items-center gap-2")}
        >
          <ExportIcon className="w-4 h-4" />
          <span>{t.calendar.exportGoogle}</span>
        </Button>
        <Button
          onClick={() => handleExport('outlook')}
          variant="secondary"
          className={clsx("flex items-center gap-2")}
        >
          <ExportIcon className="w-4 h-4" />
          <span>{t.calendar.exportOutlook}</span>
        </Button>
      </div>
    </div>
  );
}