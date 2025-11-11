// app/page.tsx (Landing page - enhanced responsiveness: mobile-first grid, stacked elements, fluid text/sizing; added hover animations and click interactions with modal popups; features cards always side by side from sm screens up for parallel layout)
'use client'; // Client Component for interactive elements

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { useState } from "react";

export default function Home() {
  const [openModal, setOpenModal] = useState<string | null>(null); // State for modal: 'growth', 'budget', 'secure'

  const closeModal = () => setOpenModal(null);

  const modals = {
    growth: {
      title: "Growth Analyzer",
      description: "Dive deep into your business performance with our AI-driven Growth Analyzer. Track key metrics like revenue trends, customer acquisition costs, and churn rates in real-time. Predictive analytics help forecast future growth, while customizable dashboards let you visualize data your way.",
      features: ["AI-Powered Insights", "Predictive Forecasting", "Custom Dashboards", "Real-Time Alerts"],
      image: "/images/growth-analyzer.png"
    },
    budget: {
      title: "Budget Allocator",
      description: "Effortlessly manage your finances with the Budget Allocator. Automate allocation across departments, track variances against actual spend, and get instant notifications for overages. Integrate with your accounting software for seamless reconciliation.",
      features: ["Automated Allocations", "Variance Tracking", "Departmental Budgets", "Integration Ready"],
      image: "/images/budget-allocator.png"
    },
    secure: {
      title: "Secure Investments",
      description: "Protect and grow your portfolio with enterprise-grade security. Our Secure Investments module offers end-to-end encryption, multi-factor authentication, and compliance reporting for global standards like GDPR and SOX. Monitor investments with advanced risk assessment tools.",
      features: ["End-to-End Encryption", "MFA Protection", "Compliance Reporting", "Risk Analytics"],
      image: "/images/secure-investments.png"
    }
  };

  const renderModal = (type: string) => {
    const modal = modals[type as keyof typeof modals];
    if (!modal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
        <div 
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-800"
          onClick={(e) => e.stopPropagation()} // Prevent closing on inner click
        >
          {/* Close Button */}
          <button 
            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            onClick={closeModal}
          >
            ×
          </button>

          {/* Modal Content */}
          <div className="text-center">
            <Image
              src={modal.image}
              alt={modal.title}
              width={400}
              height={250}
              className="mx-auto mb-4 rounded-lg object-cover"
              onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/400x250/6b7280/ffffff?text=Feature+Image")}
            />
            <h2 className="mb-4 text-2xl font-bold text-black dark:text-white">{modal.title}</h2>
            <p className="mb-6 text-lg text-zinc-600 dark:text-zinc-300">{modal.description}</p>
            <ul className="mb-6 space-y-2 text-left">
              {modal.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <span className="text-green-500">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <Button onClick={closeModal} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section with Background Image Overlay - Responsive text/button stacking */}
        <section className="relative flex min-h-[60vh] md:min-h-[70vh] items-center justify-center bg-gradient-to-br from-blue-900/20 via-zinc-900/10 to-black/20 dark:from-blue-900/30 dark:via-black/20 dark:to-black/30 overflow-hidden">
          {/* Background Image (futuristic office scene) */}
          <Image
            src="/images/landing.png" // Placeholder; add the provided image to public/images/landing.png
            alt="Futuristic office with dashboards and global investments"
            fill
            className="object-cover opacity-50"
            priority
            onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/1920x1080/1e293b/ffffff?text=Futuristic+Office")}
          />
          <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12 md:px-6 lg:px-8 text-center">
            <h1 className="mb-4 max-w-4xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white">
              Secure Financial Management System
            </h1>
            <p className="mx-auto mb-6 md:mb-8 max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed text-zinc-200">
              Streamline revenue tracking, expense approvals, and reporting with role-based hierarchy. Empower your team with real-time dashboards and compliance-ready workflows.
            </p>
            {/* CTA Buttons - Stacked on mobile, row on larger screens */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Link href="/auth/login">
                <Button size="lg" className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-4 text-base md:text-lg">
                  Get Started - Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section with Dashboard Visuals - Parallel grid: side by side from sm screens up (1 col xs, 3 col sm+); hover animations + click interactions */}
        <section className="container relative mx-auto px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-8">
          <h2 className="mb-8 md:mb-12 text-center text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white">
            Key Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Growth Analyzer Card - Hover: scale up, shadow increase, subtle lift; Click: open modal */}
            <div 
              className="relative rounded-xl bg-white p-4 sm:p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out dark:bg-zinc-800 group cursor-pointer" 
              onClick={() => setOpenModal('growth')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setOpenModal('growth')} // Keyboard accessibility
            >
              <div className="mb-4 aspect-video rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">📈</span> {/* Fallback icon if image fails */}
              </div>
              <Image
                src="/images/growth-analyzer.png" // Placeholder; add chart image to public/images/
                alt="Growth Analyzer Dashboard"
                width={300}
                height={200}
                className="mb-4 rounded-lg object-cover w-full h-40 md:h-48 transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'; // Hide broken image
                  e.currentTarget.nextElementSibling.style.display = 'flex'; // Show icon
                }}
              />
              <div className="hidden mb-4 aspect-video rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">📈</span>
              </div>
              <h3 className="mb-2 text-lg sm:text-xl font-semibold text-black dark:text-white transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Growth Analyzer
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 transition-colors duration-300 group-hover:text-zinc-700 dark:group-hover:text-zinc-300">
                Track performance metrics with AI-powered insights and predictive analytics for sustainable growth.
              </p>
            </div>

            {/* Budget Allocator Card - Hover: scale up, shadow increase, subtle lift; Click: open modal */}
            <div 
              className="relative rounded-xl bg-white p-4 sm:p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out dark:bg-zinc-800 group cursor-pointer" 
              onClick={() => setOpenModal('budget')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setOpenModal('budget')} // Keyboard accessibility
            >
              <div className="mb-4 aspect-video rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">💰</span>
              </div>
              <Image
                src="/images/budget-allocator.png" // Placeholder
                alt="Budget Allocator"
                width={300}
                height={200}
                className="mb-4 rounded-lg object-cover w-full h-40 md:h-48 transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="hidden mb-4 aspect-video rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">💰</span>
              </div>
              <h3 className="mb-2 text-lg sm:text-xl font-semibold text-black dark:text-white transition-colors duration-300 group-hover:text-green-600 dark:group-hover:text-green-400">
                Budget Allocator
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 transition-colors duration-300 group-hover:text-zinc-700 dark:group-hover:text-zinc-300">
                Optimize resource allocation with real-time budgeting tools and automated approval workflows.
              </p>
            </div>

            {/* Secure Investments Card - Hover: scale up, shadow increase, subtle lift; Click: open modal */}
            <div 
              className="relative rounded-xl bg-white p-4 sm:p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out dark:bg-zinc-800 group cursor-pointer" 
              onClick={() => setOpenModal('secure')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setOpenModal('secure')} // Keyboard accessibility
            >
              <div className="mb-4 aspect-video rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">🔒</span>
              </div>
              <Image
                src="/images/secure-investments.png" // Placeholder
                alt="Secure Global Investments"
                width={300}
                height={200}
                className="mb-4 rounded-lg object-cover w-full h-40 md:h-48 transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="hidden mb-4 aspect-video rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">🔒</span>
              </div>
              <h3 className="mb-2 text-lg sm:text-xl font-semibold text-black dark:text-white transition-colors duration-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                Secure Investments
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 transition-colors duration-300 group-hover:text-zinc-700 dark:group-hover:text-zinc-300">
                Global portfolio management with end-to-end encryption and compliance monitoring.
              </p>
            </div>
          </div>
        </section>

        {/* Team Photo Section - Responsive image sizing */}
        <section className="container relative mx-auto px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-8">
          <div className="text-center">
            <h2 className="mb-6 text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white">
              Meet Our Team
            </h2>
            <div className="mb-6 aspect-[2/1] sm:aspect-video max-w-full mx-auto rounded-xl shadow-lg overflow-hidden">
              <Image
                src="/images/team-photo.png" // Placeholder; add team photo to public/images/
                alt="Our diverse team in a modern office"
                fill
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement.innerHTML = '<div class="h-48 sm:h-64 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400">Team Photo Placeholder</div>';
                }}
              />
            </div>
            <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400">
              A global team of finance experts driving innovation in financial management.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals - Render based on openModal state */}
      {openModal && renderModal(openModal)}
    </div>
  );
}

// Modal render function (moved outside for clarity)
const renderModal = (type: string) => {
  const modals = {
    growth: {
      title: "Growth Analyzer",
      description: "Dive deep into your business performance with our AI-driven Growth Analyzer. Track key metrics like revenue trends, customer acquisition costs, and churn rates in real-time. Predictive analytics help forecast future growth, while customizable dashboards let you visualize data your way.",
      features: ["AI-Powered Insights", "Predictive Forecasting", "Custom Dashboards", "Real-Time Alerts"],
      image: "/images/growth-analyzer.png"
    },
    budget: {
      title: "Budget Allocator",
      description: "Effortlessly manage your finances with the Budget Allocator. Automate allocation across departments, track variances against actual spend, and get instant notifications for overages. Integrate with your accounting software for seamless reconciliation.",
      features: ["Automated Allocations", "Variance Tracking", "Departmental Budgets", "Integration Ready"],
      image: "/images/budget-allocator.png"
    },
    secure: {
      title: "Secure Investments",
      description: "Protect and grow your portfolio with enterprise-grade security. Our Secure Investments module offers end-to-end encryption, multi-factor authentication, and compliance reporting for global standards like GDPR and SOX. Monitor investments with advanced risk assessment tools.",
      features: ["End-to-End Encryption", "MFA Protection", "Compliance Reporting", "Risk Analytics"],
      image: "/images/secure-investments.png"
    }
  };

  const modal = modals[type as keyof typeof modals];
  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpenModal(null)}>
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-800"
        onClick={(e) => e.stopPropagation()} // Prevent closing on inner click
      >
        {/* Close Button */}
        <button 
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          onClick={() => setOpenModal(null)}
        >
          ×
        </button>

        {/* Modal Content */}
        <div className="text-center">
          <Image
            src={modal.image}
            alt={modal.title}
            width={400}
            height={250}
            className="mx-auto mb-4 rounded-lg object-cover"
            onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/400x250/6b7280/ffffff?text=Feature+Image")}
          />
          <h2 className="mb-4 text-2xl font-bold text-black dark:text-white">{modal.title}</h2>
          <p className="mb-6 text-lg text-zinc-600 dark:text-zinc-300">{modal.description}</p>
          <ul className="mb-6 space-y-2 text-left">
            {modal.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <span className="text-green-500">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <Button onClick={() => setOpenModal(null)} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};