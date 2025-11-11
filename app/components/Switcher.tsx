"use client";

import React, { useState } from "react";
import { useChildren } from "@/lib/hooks/useChildren";
import { useRouter, usePathname } from "next/navigation";
import type { StudentProfileV1 } from "@/app/types/studentprofile";

// Fixed position switcher for parent to switch between kids
export default function Switcher() {
  const { children, isLoading, error } = useChildren();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) return (
    <div className="fixed top-4 right-4 z-50 bg-white/95 backdrop-blur-sm shadow-xl rounded-xl border border-gray-200 p-4 min-w-[200px]">
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading students...</span>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="fixed top-4 right-4 z-50 bg-red-50/95 backdrop-blur-sm shadow-xl rounded-xl border border-red-200 p-4 min-w-[200px]">
      <div className="flex items-center space-x-2">
        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="text-sm text-red-700">Error loading students</span>
      </div>
    </div>
  );
  
  if (!children?.length) return null;

  // If on /child/[id] page, replace id in URL, else go to /child/[id]
  function getSwitchUrl(newId: string) {
    const childDetailRegex = /^\/child\/([^/]+)/;
    if (childDetailRegex.test(pathname)) {
      return pathname.replace(childDetailRegex, `/child/${newId}`);
    }
    return `/child/${newId}`;
  }

  // Get current student ID from URL if on child page
  const currentStudentId = pathname.match(/^\/child\/([^/]+)/)?.[1];

  return (
    <>
      {/* Floating Icon Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-1/2 left-4 transform -translate-y-1/2 z-50 w-12 h-12 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        title="Switch Student"
      >
        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
        </svg>
        {children.length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full hidden sm:flex items-center justify-center font-medium">
            {children.length}
          </div>
        )}
      </button>

      {/* Sheet/Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sheet */}
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl transform transition-transform">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10  rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 text-lg">Switch Student</h2>
                    <p className="text-sm text-gray-500">{children.length} student{children.length !== 1 ? 's' : ''} available</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="text-gray-600">Loading students...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <svg className="w-8 h-8 text-red-500 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-red-700 font-medium">Error loading students</p>
                      <p className="text-red-600 text-sm mt-1">Please try again later</p>
                    </div>
                  </div>
                ) : children.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-gray-500 font-medium">No students found</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {children.map((child: StudentProfileV1) => {
                      const isCurrentStudent = currentStudentId === child.id;
                      const displayName = child.firstNameArabic || child.firstNameEnglish || child.familyNameEnglish || child.username || "Student";
                      
                      return (
                        <button
                          key={child.id}
                          className={`w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center space-x-4 ${
                            isCurrentStudent
                              ? 'bg-blue-50 text-primary-900 border-2 border-blue-200 shadow-sm'
                              : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-2 border-transparent'
                          }`}
                          onClick={() => {
                            if (child.id && !isCurrentStudent) {
                              router.push(getSwitchUrl(child.id));
                              setIsOpen(false);
                            }
                          }}
                          disabled={isCurrentStudent}
                        >
                          {/* Avatar */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                            isCurrentStudent
                              ? 'bg-blue-100 text-primary-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          
                          {/* Name and Status */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-base font-semibold truncate ${
                              isCurrentStudent ? 'text-primary-900' : 'text-gray-900'
                            }`}>
                              {displayName}
                            </p>
                            <p className={`text-sm truncate ${
                              isCurrentStudent ? 'text-primary-600' : 'text-gray-500'
                            }`}>
                              Student ID: {child.id}
                            </p>
                          </div>

                          {/* Current indicator & Arrow */}
                          <div className="flex items-center space-x-2">
                            {isCurrentStudent ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-primary-600 bg-blue-100 px-2 py-1 rounded-full">Current</span>
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              </div>
                            ) : (
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
