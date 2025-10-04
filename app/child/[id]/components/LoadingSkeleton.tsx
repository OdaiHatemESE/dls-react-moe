'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import clsx from 'clsx';

export const LoadingSkeleton = ({ locale }: { locale?: string }) => (
    <div className={clsx("max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6", locale === 'ar' && 'direction-rtl')}>
        {/* Back Navigation */}
        <div className="mb-6">
            <Skeleton className="h-5 w-40" />
        </div>

        {/* Header Card Skeleton */}
        <Card className="mb-8 border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-12">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <Skeleton className="w-24 h-24 rounded-full" />
                    <div className="flex-1 w-full max-w-xl">
                        <Skeleton className="h-8 w-2/3 mb-3" />
                        <div className="flex flex-wrap items-center gap-3">
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-40 mt-4" />
                    </div>
                </div>
            </div>
        </Card>

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
);
