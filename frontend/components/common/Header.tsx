// components/common/Header.tsx
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-black/95 dark:supports-[backdrop-filter]:bg-black/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/log.png" // Placeholder; replace with actual logo in public/
            alt="Financial Management System"
            width={40}
            height={40}
            className="dark:invert"
          />
          <span className="font-bold text-xl text-black dark:text-white">Financial management System
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-6 lg:flex">
          <Link href="/features" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
            Features
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
            Pricing
          </Link>
          <Link href="/about" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
            About
          </Link>
          <Link href="/contact" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
            Contact
          </Link>
        </nav>

        {/* CTA Buttons - Visible on all screens */}
        <div className="flex items-center gap-2">
          <Link href="/auth/login">
          <Button
  variant="ghost"
  size="sm"
  className="px-4 cursor-pointer transition-all duration-300 text-zinc-700 dark:text-zinc-300 
             hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 
             hover:scale-105 hover:shadow-[0_0_10px_rgba(99,102,241,0.3)]"
>

              Login
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}