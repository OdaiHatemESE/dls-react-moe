'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// SignConductSection component
function SignConductSection({ locale, studentId }: { locale: string; studentId?: string }) {
    const [signed, setSigned] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);

    // Simulate actions (replace with real logic as needed)
    const handlePrintCertification = () => {
        alert(locale === 'ar' ? 'طباعة الشهادة...' : 'Printing certification...');
        setIsOpen(false);
    };

    const handleSignConduct = () => {
        if (studentId) {
            // Navigate to sign conduct page
            window.location.href = `/child/${encodeURIComponent(studentId)}/parent-conduct?studentId=${encodeURIComponent(studentId)}`;
        }
        setIsOpen(false);
    };

    const handleDownloadDocument = () => {
        alert(locale === 'ar' ? 'تحميل الوثيقة...' : 'Downloading document...');
        setIsOpen(false);
    };

    return (
        <div className="flex items-center justify-center">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button 
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3 text-lg font-semibold hover:scale-105 transform"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                        {locale === 'ar' ? 'إجراءات ولي الأمر' : 'Parent Actions'}
                    </Button>
                </SheetTrigger>
                
                <SheetContent className={`sm:max-w-md ${locale === 'ar' ? 'direction-rtl' : ''}`}>
                    <SheetHeader className="mb-6">
                        <SheetTitle className={`${locale === 'ar' ? 'text-right font-medium text-lg' : 'text-left text-xl font-semibold'} text-gray-900`}>
                            {locale === 'ar' ? 'إجراءات ولي الأمر' : 'Parent Actions'}
                        </SheetTitle>
                        <SheetDescription className={`${locale === 'ar' ? 'text-right text-sm' : 'text-left'} text-gray-600`}>
                            {locale === 'ar' ? 'اختر الإجراء الذي تريد تنفيذه' : 'Choose the action you want to perform'}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4">
                        {/* Print Certification Action */}
                        <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200">
                            <Button
                                onClick={handlePrintCertification}
                                className="w-full justify-start gap-3 h-auto p-4 bg-white hover:bg-blue-50 text-gray-900 border border-gray-200 hover:border-blue-300 shadow-sm"
                                variant="outline"
                            >
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                </div>
                                <div className={`flex-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                    <div className={`${locale === 'ar' ? 'font-medium text-sm' : 'font-semibold'} text-gray-900`}>
                                        {locale === 'ar' ? 'طباعة الشهادة' : 'Print Certification'}
                                    </div>
                                    <div className={`${locale === 'ar' ? 'text-xs' : 'text-sm'} text-gray-600`}>
                                        {locale === 'ar' ? 'طباعة شهادة السلوك المدرسي' : 'Print school conduct certification'}
                                    </div>
                                </div>
                                <svg className={`w-4 h-4 text-gray-400 ${locale === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Button>
                        </div>

                        {/* Sign Conduct Action */}
                        <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200">
                            <Button
                                onClick={handleSignConduct}
                                className="w-full justify-start gap-3 h-auto p-4 bg-white hover:bg-blue-50 text-gray-900 border border-gray-200 hover:border-blue-300 shadow-sm"
                                variant="outline"
                            >
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <div className={`flex-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                    <div className={`${locale === 'ar' ? 'font-medium text-sm' : 'font-semibold'} text-gray-900`}>
                                        {locale === 'ar' ? 'توقيع ميثاق السلوك' : 'Sign Conduct'}
                                    </div>
                                    <div className={`${locale === 'ar' ? 'text-xs' : 'text-sm'} text-gray-600`}>
                                        {locale === 'ar' ? 'توقيع ميثاق السلوك المدرسي' : 'Sign the school conduct charter'}
                                    </div>
                                </div>
                                <svg className={`w-4 h-4 text-gray-400 ${locale === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Button>
                        </div>

                        {/* Download Document Action (for signed documents) */}
                        {signed && (
                            <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200">
                                <Button
                                    onClick={handleDownloadDocument}
                                    className="w-full justify-start gap-3 h-auto p-4 bg-white hover:bg-blue-50 text-gray-900 border border-gray-200 hover:border-blue-300 shadow-sm"
                                    variant="outline"
                                >
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className={`flex-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                        <div className={`${locale === 'ar' ? 'font-medium text-sm' : 'font-semibold'} text-gray-900`}>
                                            {locale === 'ar' ? 'تحميل الوثيقة' : 'Download Document'}
                                        </div>
                                        <div className={`${locale === 'ar' ? 'text-xs' : 'text-sm'} text-gray-600`}>
                                            {locale === 'ar' ? 'تحميل الوثيقة الموقعة' : 'Download signed document'}
                                        </div>
                                    </div>
                                    <svg className={`w-4 h-4 text-gray-400 ${locale === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Status Badge */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className={`flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-2 h-2 rounded-full ${signed ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <span className={`${locale === 'ar' ? 'text-xs font-normal' : 'text-sm font-medium'} ${signed ? 'text-green-700' : 'text-yellow-700'}`}>
                                {signed 
                                    ? (locale === 'ar' ? 'تم التوقيع' : 'Signed') 
                                    : (locale === 'ar' ? 'غير موقع' : 'Not Signed')
                                }
                            </span>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default SignConductSection;
