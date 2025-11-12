// components/common/Header.tsx
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui
import { useState } from "react";
import { Menu, X } from "lucide-react"; // Assuming lucide-react for icons; install if needed: npm i lucide-react

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

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

        {/* Desktop CTA Buttons */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm" className="px-4">
              Login
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button - Visible only on small and medium screens, hidden on large/desktop/full screen */}
        <div className="lg:hidden">
          <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav Menu - Visible only on small and medium screens */}
      {isMobileMenuOpen && (
        <div className="lg:hidden">
          <nav className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black px-4 py-4">
            <div className="flex flex-col gap-2">
              <Link 
                href="/features" 
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 py-2"
                onClick={toggleMobileMenu}
              >
                Features
              </Link>
              <Link 
                href="/pricing" 
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 py-2"
                onClick={toggleMobileMenu}
              >
                Pricing
              </Link>
              <Link 
                href="/about" 
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 py-2"
                onClick={toggleMobileMenu}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 py-2"
                onClick={toggleMobileMenu}
              >
                Contact
              </Link>
              <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <Link 
                  href="/auth/login"
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  onClick={toggleMobileMenu}
                >
                  Login
                </Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}