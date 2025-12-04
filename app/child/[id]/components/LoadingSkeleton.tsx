'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import clsx from 'clsx';

export const LoadingSkeleton = ({ locale }: { locale?: string }) => (
    <div className={clsx("min-h-screen bg-gradient-to-br from-background/40 via-background to-background/60 relative overflow-hidden", locale === 'ar' && 'direction-rtl')}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute top-40 -right-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
            <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-primary/4 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        </div>

        {/* Header */}
        <header className="border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 sticky top-0 z-40 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <nav className="mb-3">
                    <Skeleton className="h-5 w-32" />
                </nav>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-5 w-96" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-full" />
                </div>
            </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
            {/* Student Info Card */}
            <Card className="border border-primary/20 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1">
                            <Skeleton className="h-5 w-48 mb-2" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Progress Indicator */}
            <div className="flex items-center justify-between px-1">
                <Skeleton className="h-4 w-32" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-2 w-2 rounded-full" />
                </div>
            </div>

            {/* Contact Numbers Section */}
            <Card className="shadow-md border-2 border-border/40 bg-card/50 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/40">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1">
                            <Skeleton className="h-6 w-40 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-5 pt-6">
                    {/* Contact Number 1 */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-10 w-full rounded-md" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                    {/* Contact Number 2 */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-40 mb-2" />
                        <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                    {/* Add Contact Button */}
                    <Skeleton className="h-10 w-48 rounded-md" />
                </CardContent>
            </Card>

            {/* Address Section */}
            <Card className="shadow-md border-2 border-border/40 bg-card/50 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/40">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1">
                            <Skeleton className="h-6 w-48 mb-2" />
                            <Skeleton className="h-4 w-80" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-5 pt-6">
                    {/* Current Address Display */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>
                    
                    {/* Address Change Toggle */}
                    <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-lg border border-border/30">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-5 w-56" />
                    </div>

                    {/* Address Picker Placeholder */}
                    <div className="space-y-3 p-4 bg-muted/10 rounded-lg border-2 border-dashed border-border/30">
                        <Skeleton className="h-5 w-48 mb-3" />
                        <Skeleton className="h-64 w-full rounded-md" />
                    </div>

                    {/* Supporting Document */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-40 mb-2" />
                        <Skeleton className="h-10 w-full rounded-md" />
                        <Skeleton className="h-3 w-64" />
                    </div>
                </CardContent>
            </Card>

            {/* Transportation Section */}
            <Card className="shadow-md border-2 border-border/40 bg-card/50 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/40">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1">
                            <Skeleton className="h-6 w-56 mb-2" />
                            <Skeleton className="h-4 w-72" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-5 pt-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-40 mb-2" />
                        <Skeleton className="h-10 w-full rounded-md" />
                        <Skeleton className="h-3 w-56" />
                    </div>
                </CardContent>
            </Card>

            {/* Important Notice Alert */}
            <div className="rounded-xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 p-5 sm:p-6 shadow-sm">
                <div className="flex gap-4">
                    <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-5 w-32 mb-3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-border/60 pt-6 mt-8">
                <Skeleton className="h-11 w-full sm:w-32 rounded-md" />
                <Skeleton className="h-11 w-full sm:w-48 rounded-md" />
            </div>
        </main>
    </div>
);
