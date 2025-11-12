// app/page.tsx (Landing page - enhanced with search functionality: live filtering of features based on search query in header; other enhancements remain)
'use client'; // Client Component for interactive elements

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion"; // Enhanced for word stagger and scroll-triggered animations
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { Mesh } from 'three';

export default function Home() {
  const [openModal, setOpenModal] = useState<string | null>(null); // State for modal: 'growth', 'budget', 'secure'
  const [searchQuery, setSearchQuery] = useState(''); // State for search query

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

  // Features data for dynamic rendering and search filtering
  const featuresData = [
    {
      id: 'growth',
      title: "Growth Analyzer",
      description: "Track performance metrics with AI-powered insights and predictive analytics for sustainable growth.",
      image: "/images/growth-analyzer.png",
      icon: "📈",
      gradient: "from-blue-500 to-blue-600",
      color: "blue",
      modal: modals.growth
    },
    {
      id: 'budget',
      title: "Budget Allocator",
      description: "Optimize resource allocation with real-time budgeting tools and automated approval workflows.",
      image: "/images/budget-allocator.png",
      icon: "💰",
      gradient: "from-green-500 to-green-600",
      color: "green",
      modal: modals.budget
    },
    {
      id: 'secure',
      title: "Secure Investments",
      description: "Global portfolio management with end-to-end encryption and compliance monitoring.",
      image: "/images/secure-investments.png",
      icon: "🔒",
      gradient: "from-purple-500 to-purple-600",
      color: "purple",
      modal: modals.secure
    }
  ];

  // Filter features based on search query
  const filteredFeatures = featuresData.filter(feature =>
    feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feature.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Enhanced Framer Motion variants for hero word-by-word animation
  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay: i * 0.1,
      },
    }),
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  // Stagger variants for features cards
  const featuresContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  // Ref for features section inView
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });

  // Team section ref
  const teamRef = useRef(null);
  const teamInView = useInView(teamRef, { once: true, margin: "-100px" });

  // Custom 3D Sphere with dynamic pulsing scale animation
  function PulsingSphere({ position }: { position: [number, number, number] }) {
    const meshRef = useRef<Mesh>(null!);
    useFrame((state) => {
      if (meshRef.current) {
        meshRef.current.rotation.y += 0.005; // Subtle additional rotation
        meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1); // Pulsing scale for dynamism
      }
    });

    return (
      <Sphere ref={meshRef} args={[1.5, 64, 64]} position={position}>
        <MeshDistortMaterial
          color="#3b82f6" // Blue for trust/security theme
          attach="material"
          distort={0.3} // Subtle distortion for fluid, modern feel
          speed={2} // Increased speed for more dynamism
          roughness={0}
        />
      </Sphere>
    );
  }

  // Custom Particle System with dynamic speed variation
  function DynamicParticles({ position }: { position: [number, number, number] }) {
    return (
      <Points
        limit={15000} // Increased particles for more density
        range={150} // Wider spread
        width={60}
        height={60}
        depth={60}
        speed={0.002} // Slightly faster floating
        factor={0.6} // Higher density
        position={position}
      >
        <PointMaterial
          transparent
          size={0.015} // Slightly smaller for subtlety
          sizeAttenuation={true}
          depthWrite={false}
          color="#60a5fa" // Light blue to match theme
          opacity={0.7} // Slightly more opaque
        />
      </Points>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      {/* Header with search props */}
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section with 3D Background Effect - Responsive text/button stacking; integrated Canvas with pulsing distorted sphere and dynamic particle system for immersive, futuristic depth with floating, subtle data-point particles; word-by-word animated text entrance */}
        <section className="relative flex min-h-[60vh] md:min-h-[70vh] items-center justify-center bg-gradient-to-br from-blue-900/20 via-zinc-900/10 to-black/20 dark:from-blue-900/30 dark:via-black/20 dark:to-black/30 overflow-hidden">
          {/* Background Image (futuristic office scene) - Reduced opacity for 3D overlay blend */}
          <Image
            src="/images/landing.png" // Placeholder; add the provided image to public/images/landing.png
            alt="Futuristic office with dashboards and global investments"
            fill
            className="object-cover opacity-20 z-0"
            priority
            onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/1920x1080/1e293b/ffffff?text=Futuristic+Office")}
          />
          
          {/* 3D Canvas Overlay - Absolute positioned behind text for depth; dynamic pulsing, auto-rotation, distortion, and enhanced particle system */}
          <div className="absolute inset-0 z-5 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
              <color attach="background" args={['transparent']} />
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              
              {/* Pulsing Distorted Sphere */}
              <PulsingSphere position={[0, 0, 0]} />
              
              {/* Dynamic Particle System */}
              <DynamicParticles position={[0, 0, 0]} />
              
              <OrbitControls 
                enablePan={false} 
                enableZoom={false} 
                enableRotate={true}
                autoRotate
                autoRotateSpeed={0.8} // Slightly faster rotation for dynamism
                maxPolarAngle={Math.PI / 2}
                minPolarAngle={Math.PI / 2}
              />
            </Canvas>
          </div>

          <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12 md:px-6 lg:px-8 text-center">
            {/* Animated Title - Word by word stagger */}
            <motion.h1 
              className="mb-4 max-w-4xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {["Secure", "Financial", "Management", "System"].map((word, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  variants={wordVariants}
                  custom={i}
                >
                  {word}{' '}
                </motion.span>
              ))}
            </motion.h1>
            {/* Animated Subtitle - Word by word stagger */}
            <motion.p 
              className="mx-auto mb-6 md:mb-8 max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed text-zinc-200"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {[
                "Streamline", "revenue", "tracking,", "expense",
                "approvals,", "and", "reporting", "with", "role-based",
                "hierarchy.", "Empower", "your", "team", "with", "real-time",
                "dashboards", "and", "compliance-ready", "workflows."
              ].map((word, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  variants={wordVariants}
                  custom={i}
                >
                  {word}{' '}
                </motion.span>
              ))}
            </motion.p>
            {/* CTA Buttons - Stacked on mobile, row on larger screens; add subtle hover animation */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Link href="/auth/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-4 text-base md:text-lg">
                    Get Started - Login
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section with Dashboard Visuals - Parallel grid: side by side from sm screens up (1 col xs, 3 col sm+); hover animations + click interactions + staggered entrance on scroll + live search filtering */}
        <section className="container relative mx-auto px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-8" ref={featuresRef}>
          <motion.h2 
            className="mb-8 md:mb-12 text-center text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? "visible" : "hidden"}
            variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}
            transition={{ duration: 0.6 }}
          >
            Key Features {searchQuery && <span className="text-sm text-zinc-500">({filteredFeatures.length})</span>}
          </motion.h2>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
            variants={featuresContainerVariants}
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
          >
            {filteredFeatures.map((feature, index) => (
              <motion.div 
                key={feature.id}
                className={`relative rounded-xl bg-white p-4 sm:p-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out dark:bg-zinc-800 group cursor-pointer`} 
                variants={cardVariants}
                whileHover={{ y: -5 }} // Lift on hover for dynamism
                onClick={() => setOpenModal(feature.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setOpenModal(feature.id)} // Keyboard accessibility
              >
                <div className={`mb-4 aspect-video rounded-lg ${feature.gradient} flex items-center justify-center`}>
                  <span className="text-white text-xl font-bold">{feature.icon}</span> {/* Fallback icon if image fails */}
                </div>
                <Image
                  src={feature.image} // Placeholder; add chart image to public/images/
                  alt={`${feature.title} Dashboard`}
                  width={300}
                  height={200}
                  className="mb-4 rounded-lg object-cover w-1/2 h-40 md:h-48 transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'; // Hide broken image
                    e.currentTarget.nextElementSibling.style.display = 'flex'; // Show icon
                  }}
                />
                <div className={`hidden mb-4 aspect-video rounded-lg ${feature.gradient} flex items-center justify-center`}>
                  <span className="text-white text-xl font-bold">{feature.icon}</span>
                </div>
                <h3 className="mb-2 text-lg sm:text-xl font-semibold text-black dark:text-white transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 transition-colors duration-300 group-hover:text-zinc-700 dark:group-hover:text-zinc-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
            {filteredFeatures.length === 0 && searchQuery && (
              <div className="col-span-full text-center py-8">
                <p className="text-zinc-500 dark:text-zinc-400">No features match "{searchQuery}". Try another search.</p>
              </div>
            )}
          </motion.div>
        </section>

        {/* Team Photo Section - Responsive image sizing + scroll-triggered entrance */}
        <section className="container relative mx-auto px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-8" ref={teamRef}>
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={teamInView ? "visible" : "hidden"}
            variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2 
              className="mb-6 text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={teamInView ? "visible" : "hidden"}
              variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Meet Our Team
            </motion.h2>
            <motion.div 
              className="mb-6 aspect-[2/1] sm:aspect-video max-w-full mx-auto rounded-xl shadow-lg overflow-hidden relative"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={teamInView ? "visible" : "hidden"}
              variants={{ visible: { scale: 1, opacity: 1 }, hidden: { scale: 0.95, opacity: 0 } }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Image
                src="/images/team-photo.png" // Placeholder; add team photo to public/images/
                alt="Our diverse team in a modern office"
                fill
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement.innerHTML = '<div class="absolute inset-0 h-48 sm:h-64 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400">Team Photo Placeholder</div>';
                }}
              />
            </motion.div>
            <motion.p 
              className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400"
              initial={{ opacity: 0, y: 20 }}
              animate={teamInView ? "visible" : "hidden"}
              variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              A global team of finance experts driving innovation in financial management.
            </motion.p>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals - Render based on openModal state */}
      {openModal && renderModal(openModal)}
    </div>
  );
}