"use client";

import { useI18n } from '@/app/i18n/I18nProvider';

export default function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            © {year} {t.footer.rights}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {t.footer.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}

// Legacy export for compatibility
export { Footer };