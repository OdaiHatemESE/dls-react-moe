'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useI18n } from '@/app/i18n/I18nProvider';
import clsx from 'clsx';

interface MobilePullToRefreshProps {
  onRefreshAction: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export default function MobilePullToRefresh({ 
  onRefreshAction, 
  children, 
  className 
}: MobilePullToRefreshProps) {
  const { locale } = useI18n();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const maxPullDistance = 80;
  const triggerDistance = 60;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || window.scrollY > 0) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startYRef.current;
    
    if (deltaY > 0) {
      const distance = Math.min(deltaY * 0.5, maxPullDistance);
      setPullDistance(distance);
      
      // Prevent default scrolling when pulling down
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, maxPullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= triggerDistance && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefreshAction();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  }, [isPulling, pullDistance, triggerDistance, isRefreshing, onRefreshAction]);

  const refreshProgress = Math.min(pullDistance / triggerDistance, 1);
  const shouldTrigger = pullDistance >= triggerDistance;

  return (
    <div 
      ref={containerRef}
      className={clsx("relative overflow-hidden", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <div 
        className={clsx(
          "absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-300 ease-out",
          "bg-gradient-to-b from-primary/10 to-transparent backdrop-blur-sm",
          pullDistance > 0 ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          height: `${Math.max(pullDistance, 0)}px`,
          transform: `translateY(-${Math.max(maxPullDistance - pullDistance, 0)}px)`
        }}
      >
        <div className={clsx(
          "flex flex-col items-center gap-2 transition-all duration-200",
          pullDistance > 20 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        )}>
          <div className={clsx(
            "relative w-8 h-8 rounded-full border-2 transition-all duration-200",
            shouldTrigger || isRefreshing 
              ? "border-primary bg-primary/10" 
              : "border-muted-foreground/30 bg-muted/50"
          )}>
            {isRefreshing ? (
              <div className="absolute inset-1 rounded-full border-2 border-primary border-r-transparent animate-spin" />
            ) : (
              <svg 
                className={clsx(
                  "absolute inset-1 transition-all duration-200",
                  shouldTrigger ? "text-primary rotate-180" : "text-muted-foreground"
                )}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ transform: `rotate(${refreshProgress * 180}deg)` }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                />
              </svg>
            )}
          </div>
          
          <span className={clsx(
            "text-xs font-medium transition-all duration-200",
            shouldTrigger || isRefreshing ? "text-primary" : "text-muted-foreground",
            locale === 'ar' ? 'font-semibold' : 'font-medium'
          )}>
            {isRefreshing 
              ? (locale === 'ar' ? 'جاري التحديث...' : 'Refreshing...')
              : shouldTrigger 
                ? (locale === 'ar' ? 'اتركه للتحديث' : 'Release to refresh')
                : (locale === 'ar' ? 'اسحب للأسفل للتحديث' : 'Pull down to refresh')
            }
          </span>
        </div>
      </div>

      {/* Content */}
      <div 
        className="transition-transform duration-300 ease-out"
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          // Add subtle spring effect when releasing
          transitionTimingFunction: isPulling ? 'ease-out' : 'cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
}