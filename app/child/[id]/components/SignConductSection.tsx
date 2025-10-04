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
                        className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 font-medium hover:scale-105 transform"
                    >
                        {locale === 'ar' ? 'ابدأ الآن' : 'Get Started'}
                        <svg className={`w-5 h-5 ${locale === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Button>
                </SheetTrigger>
                
                <SheetContent className={`sm:max-w-lg ${locale === 'ar' ? 'direction-rtl' : ''} bg-white`}>
                    <SheetHeader className="mb-8 pb-6 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-primary rounded-xl shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <SheetTitle className={`${locale === 'ar' ? 'text-right font-semibold text-xl' : 'text-left text-2xl font-bold'} text-gray-900`}>
                                    {locale === 'ar' ? 'إجراءات ولي الأمر' : 'Parent Actions'}
                                </SheetTitle>
                            </div>
                        </div>
                        <SheetDescription className={`${locale === 'ar' ? 'text-right text-base' : 'text-left text-lg'} text-gray-600 leading-relaxed`}>
                            {locale === 'ar' 
                                ? 'اختر الإجراء المناسب من الخيارات المتاحة أدناه للمتابعة' 
                                : 'Select the appropriate action from the available options below to continue'}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-3">
                        {/* Print Certification Action */}
                        <div className="group relative overflow-hidden bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <Button
                                onClick={handlePrintCertification}
                                className="relative w-full justify-start gap-4 h-auto p-6 bg-transparent hover:bg-transparent text-gray-900 border-0 shadow-none"
                                variant="ghost"
                            >
                                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                </div>
                                <div className={`flex-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                    <div className={`${locale === 'ar' ? 'font-semibold text-base' : 'font-bold text-lg'} text-gray-900 group-hover:text-green-700 transition-colors`}>
                                        {locale === 'ar' ? 'طباعة الشهادة' : 'Print Certification'}
                                    </div>
                                    <div className={`${locale === 'ar' ? 'text-sm' : 'text-base'} text-gray-600 group-hover:text-green-600 transition-colors mt-1`}>
                                        {locale === 'ar' ? 'طباعة شهادة السلوك المدرسي بصيغة PDF' : 'Generate and print school conduct certification'}
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-green-100 group-hover:bg-green-200 flex items-center justify-center transition-all duration-300">
                                        <svg className={`w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform ${locale === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Button>
                        </div>

                        {/* Sign Conduct Action */}
                        <div className="group relative overflow-hidden bg-white rounded-xl border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <Button
                                onClick={handleSignConduct}
                                className="relative w-full justify-start gap-4 h-auto p-6 bg-transparent hover:bg-transparent text-gray-900 border-0 shadow-none"
                                variant="ghost"
                            >
                                <div className="p-3 bg-primary rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <div className={`flex-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                    <div className={`${locale === 'ar' ? 'font-semibold text-base' : 'font-bold text-lg'} text-gray-900 group-hover:text-primary transition-colors`}>
                                        {locale === 'ar' ? 'توقيع ميثاق السلوك' : 'Sign Conduct Charter'}
                                    </div>
                                    <div className={`${locale === 'ar' ? 'text-sm' : 'text-base'} text-gray-600 group-hover:text-primary/80 transition-colors mt-1`}>
                                        {locale === 'ar' ? 'راجع ووقع على ميثاق السلوك المدرسي' : 'Review and digitally sign the school conduct charter'}
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-all duration-300">
                                        <svg className={`w-4 h-4 text-primary group-hover:translate-x-1 transition-transform ${locale === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Button>
                        </div>

                        {/* Download Document Action (for signed documents) */}
                        {signed && (
                            <div className="group relative overflow-hidden bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                <div className="absolute inset-0 bg-gradient-to-r from-aegreen-50 to-aegreen-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <Button
                                    onClick={handleDownloadDocument}
                                    className="relative w-full justify-start gap-4 h-auto p-6 bg-transparent hover:bg-transparent text-gray-900 border-0 shadow-none"
                                    variant="ghost"
                                >
                                    <div className="p-3 bg-gradient-to-br from-aegreen-500 to-aegreen-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className={`flex-1 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                                        <div className={`${locale === 'ar' ? 'font-semibold text-base' : 'font-bold text-lg'} text-gray-900 group-hover:text-purple-700 transition-colors`}>
                                            {locale === 'ar' ? 'تحميل الوثيقة' : 'Download Document'}
                                        </div>
                                        <div className={`${locale === 'ar' ? 'text-sm' : 'text-base'} text-gray-600 group-hover:text-purple-600 transition-colors mt-1`}>
                                            {locale === 'ar' ? 'تحميل نسخة من الوثيقة الموقعة بصيغة PDF' : 'Download a copy of the signed document in PDF format'}
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-all duration-300">
                                            <svg className={`w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform ${locale === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Enhanced Status Section */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <div className={`flex items-center justify-between ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                <div className={`flex items-center gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-3 h-3 rounded-full ${signed ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></div>
                                    <div>
                                        <span className={`${locale === 'ar' ? 'text-sm font-medium' : 'text-base font-semibold'} ${signed ? 'text-green-700' : 'text-amber-700'}`}>
                                            {signed 
                                                ? (locale === 'ar' ? 'حالة الوثيقة: تم التوقيع' : 'Document Status: Signed') 
                                                : (locale === 'ar' ? 'حالة الوثيقة: في انتظار التوقيع' : 'Document Status: Pending Signature')
                                            }
                                        </span>
                                        <div className={`${locale === 'ar' ? 'text-xs' : 'text-sm'} text-gray-600 mt-1`}>
                                            {signed 
                                                ? (locale === 'ar' ? 'تم إكمال التوقيع بنجاح' : 'Successfully completed and signed') 
                                                : (locale === 'ar' ? 'يتطلب توقيعك للمتابعة' : 'Requires your signature to proceed')
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    signed 
                                        ? 'bg-green-100 text-green-800 border border-green-200' 
                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                    {signed 
                                        ? (locale === 'ar' ? 'مكتمل' : 'Complete') 
                                        : (locale === 'ar' ? 'معلق' : 'Pending')
                                    }
                                </div>
                            </div>
                        </div>
                        
                        {/* Help Text */}
                        <div className="mt-4 text-center">
                            <p className={`${locale === 'ar' ? 'text-xs' : 'text-sm'} text-gray-500`}>
                                {locale === 'ar' 
                                    ? 'في حالة وجود أي استفسارات، يرجى التواصل مع إدارة المدرسة' 
                                    : 'For any questions or assistance, please contact the school administration'
                                }
                            </p>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default SignConductSection;
