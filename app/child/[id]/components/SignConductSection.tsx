'use client';

import React from 'react';
import Link from 'next/link';

// SignConductSection component
function SignConductSection({ locale, studentId }: { locale: string; studentId?: string }) {
    const [signed, setSigned] = React.useState(false);
    // Simulate download (replace with real logic as needed)
    const handleDownload = () => {
        alert(locale === 'ar' ? 'تحميل الوثيقة...' : 'Downloading document...');
    };
    return (
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
            {!signed ? (
                <>
                    <Link
                        href={studentId ? `/child/${encodeURIComponent(studentId)}/parent-conduct?studentId=${encodeURIComponent(studentId)}` : '#'}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        {locale === 'ar' ? 'ميثاق ولي الأمر' : 'Parent Conduct'}
                    </Link>
                    <span className="text-sm text-yellow-600 font-semibold">
                        {locale === 'ar' ? 'غير موقع' : 'Not Signed'}
                    </span>
                </>
            ) : (
                <>
                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        onClick={handleDownload}
                    >
                        {locale === 'ar' ? 'تحميل الوثيقة' : 'Download Document'}
                    </button>
                    <span className="text-sm text-green-700 font-semibold">
                        {locale === 'ar' ? 'تم التوقيع' : 'Signed'}
                    </span>
                </>
            )}
        </div>
    );
}

export default SignConductSection;
