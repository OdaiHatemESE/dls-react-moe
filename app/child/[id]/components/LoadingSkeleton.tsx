'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import clsx from 'clsx';

export const LoadingSkeleton = ({ locale }: { locale?: string }) => (
    <div className={clsx("min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30", locale === 'ar' && 'direction-rtl')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Enhanced Back Navigation Skeleton */}
            <nav className="mb-8">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Skeleton className="h-10 w-32 rounded-lg" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-6 w-28" />
                </div>
            </nav>

            {/* Enhanced Header Card Skeleton */}
            <Card className="mb-8 border-0 shadow-xl bg-white overflow-hidden">
                <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-16">
                    <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-8">
                        <div className="relative">
                            <Skeleton className="w-32 h-32 rounded-2xl" />
                        </div>
                        <div className="flex-1 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between w-full">
                                <div className="flex-1">
                                    <Skeleton className="h-10 w-2/3 mb-3 bg-white/20" />
                                    <Skeleton className="h-6 w-48 mb-6 bg-white/10" />
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Skeleton className="h-8 w-32 rounded-full bg-white/20" />
                                        <Skeleton className="h-8 w-24 rounded-full bg-white/20" />
                                        <Skeleton className="h-8 w-20 rounded-full bg-white/20" />
                                    </div>
                                </div>
                                <Skeleton className="w-40 h-12 mt-6 sm:mt-0 bg-white/20 rounded-lg" />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Enhanced Tabs Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-8">
                <div className="grid grid-cols-5 bg-gray-50 rounded-lg p-1 gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 rounded-lg" />
                    ))}
                </div>
            </div>

        <div className="space-y-8">
            {/* Basic Information Skeleton */}
            <Card className="border border-gray-200">
                <CardHeader className="bg-blue-50 border-b border-blue-100">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-6 w-40" />
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="p-4 bg-gray-50 rounded-lg">
                                <Skeleton className="h-3 w-20 mb-2" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Demographics Skeleton */}
            <Card className="border border-gray-200">
                <CardHeader className="bg-green-50 border-b border-green-100">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-6 w-56" />
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="p-4 bg-gray-50 rounded-lg">
                                <Skeleton className="h-3 w-24 mb-2" />
                                <Skeleton className="h-5 w-40" />
                            </div>
                        ))}
                        <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <Skeleton className="h-3 w-28 mb-2" />
                                <Skeleton className="h-5 w-64" />
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <Skeleton className="h-3 w-28 mb-2" />
                                <Skeleton className="h-5 w-64" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Address Skeleton */}
            <Card className="border border-gray-200">
                <CardHeader className="bg-purple-50 border-b border-purple-100">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-6 w-44" />
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="p-4 bg-gray-50 rounded-lg">
                                <Skeleton className="h-3 w-24 mb-2" />
                                <Skeleton className="h-5 w-48" />
                            </div>
                        ))}
                        <div className="md:col-span-2 lg:col-span-3">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <Skeleton className="h-3 w-28 mb-2" />
                                <Skeleton className="h-5 w-full" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions Skeleton */}
            <Card className="border border-gray-200">
                <CardHeader className="bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-6 w-36" />
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[0, 1].map((i) => (
                            <div key={i} className="p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-9 w-9 rounded-lg" />
                                    <div className="flex-1">
                                        <Skeleton className="h-4 w-32 mb-2" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
        </div>
    </div>
);
