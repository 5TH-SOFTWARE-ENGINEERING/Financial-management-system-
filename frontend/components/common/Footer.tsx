// components/common/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="container flex flex-col items-center justify-between gap-6 px-4 py-8 sm:flex-row sm:gap-0 sm:px-6 lg:px-8">
        {/* Copyright */}
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          © 2025 Financial Management System. All rights reserved.
        </p>

        {/* Links */}
        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
          <Link href="/support" className="hover:underline">Support</Link>
        </nav>
      </div>
    </footer>
  );
}