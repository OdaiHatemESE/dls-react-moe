"use client";

import Link from 'next/link';
import { useI18n } from '@/app/i18n/I18nProvider';
import clsx from 'clsx';

export default function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              © {year} ParentPortal. {t.footer.rights}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t.footer.tagline}
            </p>
          </div>
          
          <div className={clsx("flex flex-wrap justify-center md:justify-end gap-6")}> 
            <Link 
              href="/privacy" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
            >
              {t.footer.privacy}
            </Link>
            <Link 
              href="/terms" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
            >
              {t.footer.terms}
            </Link>
            <Link 
              href="/support" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
            >
              {t.footer.support}
            </Link>
            <Link 
              href="/accessibility" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
            >
              {t.footer.accessibility}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Legacy export for compatibility
export { Footer };