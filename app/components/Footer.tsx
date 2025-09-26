import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-800 mt-24 py-12 bg-white/60 dark:bg-black/40 backdrop-blur supports-[backdrop-filter]:bg-white/30 dark:supports-[backdrop-filter]:bg-black/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/next.svg" alt="Logo" width={80} height={18} className="dark:invert" />
            <span className="font-semibold tracking-tight text-gray-800 dark:text-gray-100">Parent Portal</span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-medium text-gray-600 dark:text-gray-300">
            <Link href="/about" className="hover:text-gray-900 dark:hover:text-white transition-colors">About</Link>
            <Link href="/features" className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</Link>
            <Link href="/blog" className="hover:text-gray-900 dark:hover:text-white transition-colors">Blog</Link>
            <Link href="/contact" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</Link>
          </nav>
        </div>
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} Parent Portal. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Terms</Link>
            <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
              <Image src="/globe.svg" alt="Next.js" width={14} height={14} /> Next.js
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
