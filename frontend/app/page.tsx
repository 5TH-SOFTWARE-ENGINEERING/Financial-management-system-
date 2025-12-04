//app/page.tsx
'use client';

import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { motion, useInView } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Points, PointMaterial } from '@react-three/drei';
import type { Mesh } from 'three';

// === THEME ===
const theme = {
  colors: {
    primary: '#3b82f6',
    bg: '#0b0c10',
    card: '#1f2937',
    text: '#f9fafb',
  },
  shadows: {
    lg: '0 10px 30px rgba(0,0,0,0.3)',
  },
  radius: '16px',
};

// === STYLED COMPONENTS ===
const Wrapper = styled.div`
  min-height: 100vh;
  background-color: ${theme.colors.bg};
  color: ${theme.colors.text};
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const GradientBackground = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(circle at 30% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
              linear-gradient(135deg, rgb(9, 10, 10) 0%, rgb(12, 11, 11) 100%);
  
  &::before {
    content: '';
    position: absolute;
    top: -100%;
    left: -100%;
    width: 300%;
    height: 300%;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(59, 130, 246, 0.3) 45deg,
      transparent 90deg,
      rgba(139, 92, 246, 0.3) 135deg,
      transparent 180deg,
      rgba(59, 130, 246, 0.3) 225deg,
      transparent 270deg,
      rgba(139, 92, 246, 0.3) 315deg,
      transparent 360deg
    );
    animation: spiralRotatePrimary 30s linear infinite;
    opacity: 0.6;
  }

  &::after {
    content: '';
    position: absolute;
    top: -100%;
    right: -100%;
    width: 300%;
    height: 300%;
    background: conic-gradient(
      from 180deg,
      transparent 0deg,
      rgba(139, 92, 246, 0.25) 60deg,
      transparent 120deg,
      rgba(59, 130, 246, 0.25) 180deg,
      transparent 240deg,
      rgba(139, 92, 246, 0.25) 300deg,
      transparent 360deg
    );
    animation: spiralRotateSecondary 35s linear infinite reverse;
    opacity: 0.5;
  }

  @keyframes spiralRotatePrimary {
    0% {
      transform: rotate(0deg) scale(1) translate(0, 0);
    }
    25% {
      transform: rotate(90deg) scale(1.1) translate(5%, 5%);
    }
    50% {
      transform: rotate(180deg) scale(1.2) translate(0, 0);
    }
    75% {
      transform: rotate(270deg) scale(1.1) translate(-5%, -5%);
    }
    100% {
      transform: rotate(360deg) scale(1) translate(0, 0);
    }
  }

  @keyframes spiralRotateSecondary {
    0% {
      transform: rotate(360deg) scale(1.1) translate(0, 0);
    }
    25% {
      transform: rotate(270deg) scale(1) translate(-5%, 5%);
    }
    50% {
      transform: rotate(180deg) scale(0.9) translate(0, 0);
    }
    75% {
      transform: rotate(90deg) scale(1) translate(5%, -5%);
    }
    100% {
      transform: rotate(0deg) scale(1.1) translate(0, 0);
    }
  }
`;


const HeroSection = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  overflow: hidden;
  text-align: center;
  padding: 3rem 1rem;
  z-index: 1;
  
  /* Additional spiral particles effect */
  &::before {
    content: '';
    position: absolute;
    width: 2px;
    height: 2px;
    background: rgba(59, 130, 246, 0.8);
    border-radius: 50%;
    box-shadow: 
      100px 200px 0 0 rgba(139, 92, 246, 0.6),
      -150px 300px 0 0 rgba(59, 130, 246, 0.5),
      200px -100px 0 0 rgba(139, 92, 246, 0.7),
      -200px -200px 0 0 rgba(59, 130, 246, 0.4),
      300px 100px 0 0 rgba(139, 92, 246, 0.5);
    animation: particleFloat 20s ease-in-out infinite;
    z-index: 0;
  }

  @keyframes particleFloat {
    0%, 100% {
      transform: translate(0, 0) rotate(0deg);
      opacity: 0.8;
    }
    25% {
      transform: translate(50px, -50px) rotate(90deg);
      opacity: 1;
    }
    50% {
      transform: translate(-30px, -100px) rotate(180deg);
      opacity: 0.6;
    }
    75% {
      transform: translate(-50px, 30px) rotate(270deg);
      opacity: 0.9;
    }
  }
`;

const Title = styled(motion.h1)`
  font-size: 3rem;
  font-weight: 700;
  color: white;
  max-width: 800px;
  line-height: 1.2;
  margin-bottom: 1.5rem;

  @media (min-width: 768px) {
    font-size: 4rem;
  }
`;

const Subtitle = styled(motion.p)`
  font-size: 1.2rem;
  color:rgb(99, 135, 189);
  max-width: 700px;
  margin: 0 auto 2rem auto;
  line-height: 1.6;
`;

const FeatureSection = styled.section`
  padding: 5rem 1.5rem;
  background-color: #111827;
  position: relative;
  z-index: 1;
  
  /* Subtle spiral accent */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(
      ellipse at top left,
      rgba(59, 130, 246, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at bottom right,
      rgba(139, 92, 246, 0.1) 0%,
      transparent 50%
    );
    pointer-events: none;
    z-index: 0;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const ParallelFeaturesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const RegularFeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const Card = styled(motion.div)`
  background-color: ${theme.colors.card};
  border-radius: ${theme.radius};
  padding: 1.5rem;
  box-shadow: ${theme.shadows.lg};
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(59, 130, 246, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(59, 130, 246, 0.1) 90deg,
      transparent 180deg,
      rgba(139, 92, 246, 0.1) 270deg,
      transparent 360deg
    );
    animation: cardSpiral 8s linear infinite;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-8px);
    background-color: rgba(255, 255, 255, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    box-shadow: 0 15px 40px rgba(59, 130, 246, 0.2);
    
    &::before {
      opacity: 1;
    }
  }

  @keyframes cardSpiral {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
`;

const ModalCard = styled.div`
  background-color: ${theme.colors.card};
  padding: 2rem;
  border-radius: ${theme.radius};
  color: white;
  width: 90%;
  max-width: 600px;
  box-shadow: ${theme.shadows.lg};
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #ccc;
  cursor: pointer;

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const TeamSection = styled.section`
  padding: 4rem 1rem;
  text-align: center;
  background-color: rgb(32, 35, 37);
  position: relative;
  z-index: 1;
  overflow: hidden;
  
  /* Spiral background accent */
  &::before {
    content: '';
    position: absolute;
    bottom: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 45deg,
      transparent 0deg,
      rgba(59, 130, 246, 0.08) 120deg,
      transparent 240deg,
      rgba(139, 92, 246, 0.08) 360deg
    );
    animation: teamSpiral 25s linear infinite;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 225deg,
      transparent 0deg,
      rgba(139, 92, 246, 0.06) 120deg,
      transparent 240deg,
      rgba(59, 130, 246, 0.06) 360deg
    );
    animation: teamSpiralReverse 30s linear infinite reverse;
    z-index: 0;
  }

  @keyframes teamSpiral {
    0% {
      transform: rotate(0deg) scale(1);
    }
    100% {
      transform: rotate(360deg) scale(1.1);
    }
  }

  @keyframes teamSpiralReverse {
    0% {
      transform: rotate(360deg) scale(1.1);
    }
    100% {
      transform: rotate(0deg) scale(1);
    }
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
`;

const TeamImage = styled(Image)`
  border-radius: ${theme.radius};
  box-shadow: ${theme.shadows.lg};
`;

const Word = styled(motion.span)`
  display: inline-block;
`;

// 3D Solar System Components
function Sun() {
  const meshRef = useRef<Mesh>(null!);
  const coronaRef = useRef<Mesh>(null!);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Realistic slow rotation
      meshRef.current.rotation.y += 0.001;
      meshRef.current.rotation.x += 0.0005;
      
      // Subtle pulsing like real sun
      const time = state.clock.elapsedTime;
      const scale = 1 + Math.sin(time * 0.8) * 0.08 + Math.cos(time * 1.2) * 0.05;
      meshRef.current.scale.setScalar(scale);
    }
    
    if (coronaRef.current) {
      // Corona rotation
      coronaRef.current.rotation.y += 0.0008;
      coronaRef.current.rotation.x += 0.0004;
      
      // Corona pulsing
      const time = state.clock.elapsedTime;
      const coronaScale = 1.15 + Math.sin(time * 0.6) * 0.1;
      coronaRef.current.scale.setScalar(coronaScale);
    }
  });
  
  return (
    <group>
      {/* Corona/Outer glow */}
      <Sphere ref={coronaRef} args={[2.1, 64, 64]} position={[0, 0, 0]}>
        <meshBasicMaterial 
          color="#ff6b35"
          transparent
          opacity={0.3}
          side={2}
        />
      </Sphere>
      
      {/* Main sun body */}
      <Sphere ref={meshRef} args={[1.8, 64, 64]} position={[0, 0, 0]}>
        <MeshDistortMaterial 
          color="#ff8c00"
          distort={0.5} 
          speed={4} 
          roughness={0.2}
          emissive="#ff6b35"
          emissiveIntensity={1.2}
          metalness={0.1}
        />
      </Sphere>
      
      {/* Inner core glow */}
      <Sphere args={[1.5, 64, 64]} position={[0, 0, 0]}>
        <meshBasicMaterial 
          color="#ffd700"
          transparent
          opacity={0.7}
        />
      </Sphere>
    </group>
  );
}

interface PlanetProps {
  radius: number;
  speed: number;
  size: number;
  color: string;
  angle: number;
  tilt?: number;
}

function Planet({ radius, speed, size, color, angle, tilt = 0 }: PlanetProps) {
  const meshRef = useRef<Mesh>(null!);
  const orbitRef = useRef<Mesh>(null!);
  
  useFrame((state) => {
    if (orbitRef.current && meshRef.current) {
      const time = state.clock.elapsedTime;
      const orbitAngle = angle + time * speed;
      
      // Calculate orbital position
      const x = Math.cos(orbitAngle) * radius;
      const z = Math.sin(orbitAngle) * radius;
      const y = Math.sin(time * speed * 0.5) * tilt;
      
      orbitRef.current.position.set(x, y, z);
      
      // Rotate planet on its own axis
      meshRef.current.rotation.y += speed * 0.5;
    }
  });
  
  return (
    <mesh ref={orbitRef}>
      <Sphere ref={meshRef} args={[size, 32, 32]} position={[0, 0, 0]}>
        <MeshDistortMaterial 
          color={color} 
          distort={0.2} 
          speed={2} 
          roughness={0.3}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </Sphere>
    </mesh>
  );
}

// Orbital ring visualization
function OrbitalRing({ radius, color }: { radius: number; color: string }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.05, radius + 0.05, 64]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={0.2} 
        side={2}
      />
    </mesh>
  );
}

// Solar System Component
function SolarSystem() {
  const planets = [
    { radius: 2.5, speed: 0.3, size: 0.3, color: '#3b82f6', angle: 0, tilt: 0.1 }, // Blue planet
    { radius: 3.5, speed: 0.2, size: 0.4, color: '#8b5cf6', angle: Math.PI / 2, tilt: 0.15 }, // Purple planet
    { radius: 4.5, speed: 0.15, size: 0.35, color: '#10b981', angle: Math.PI, tilt: 0.12 }, // Green planet
    { radius: 5.5, speed: 0.1, size: 0.5, color: '#f59e0b', angle: Math.PI * 1.5, tilt: 0.2 }, // Orange planet
    { radius: 6.5, speed: 0.08, size: 0.25, color: '#ef4444', angle: Math.PI / 4, tilt: 0.08 }, // Red planet
  ];
  
  return (
    <>
      <ambientLight intensity={0.3} />
      {/* Main sunlight - warm white/yellow */}
      <pointLight position={[0, 0, 0]} intensity={2.5} color="#ffd700" distance={20} decay={2} />
      <pointLight position={[0, 0, 0]} intensity={1.8} color="#ff8c00" distance={15} decay={2} />
      {/* Accent lights for atmosphere */}
      <pointLight position={[5, 5, 5]} intensity={0.4} color="#3b82f6" />
      <pointLight position={[-5, -5, -5]} intensity={0.4} color="#8b5cf6" />
      {/* Directional light simulating sunlight */}
      <directionalLight position={[0, 5, 5]} intensity={0.8} color="#ffd700" />
      
      <Sun />
      
      {planets.map((planet, index) => (
        <group key={index}>
          <OrbitalRing radius={planet.radius} color={planet.color} />
          <Planet {...planet} />
        </group>
      ))}
      
      <OrbitControls 
        enableZoom={false} 
        autoRotate 
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  );
}

export default function Home() {
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: '-100px' });

  const modals = {
    growth: {
      title: 'Advanced Financial Analytics',
      description: 'Transform raw financial data into actionable insights with real-time analytics, predictive modeling, and comprehensive reporting. Track revenue trends, identify cost-saving opportunities, and make data-driven decisions that drive business growth.',
      features: ['Real-time Revenue Tracking', 'Predictive Financial Forecasting', 'Interactive Dashboards', 'Profit Margin Analysis', 'Cash Flow Projections'],
      image: '/images/growth-analyzer.png',
    },
    budget: {
      title: 'Intelligent Budget Management',
      description: 'Streamline budget planning, allocation, and monitoring across departments. Set spending limits, track expenses in real-time, and receive automated alerts when budgets are exceeded. Optimize resource allocation with AI-powered recommendations.',
      features: ['Multi-Department Budgeting', 'Automated Expense Tracking', 'Real-time Budget Alerts', 'Spend Analytics', 'Approval Workflows'],
      image: '/images/budget-allocator.png',
    },
    secure: {
      title: 'Enterprise-Grade Security',
      description: 'Protect sensitive financial data with bank-level encryption, multi-factor authentication, and comprehensive audit trails. Ensure compliance with financial regulations while maintaining seamless user experience.',
      features: ['256-bit Encryption', 'Multi-Factor Authentication', 'Role-Based Access Control', 'Audit Logging', 'GDPR & SOX Compliance'],
      image: '/images/secure-investments.png',
    },
    inventory: {
      title: 'Inventory & Sales Management',
      description: 'Complete inventory control with real-time stock tracking, automated reorder points, and integrated sales management. Monitor product performance, manage suppliers, and optimize inventory turnover.',
      features: ['Real-time Stock Tracking', 'Automated Reorder Alerts', 'Sales Performance Analytics', 'Supplier Management', 'Inventory Valuation'],
      image: '/images/inventory-management.png',
    },
    reporting: {
      title: 'Comprehensive Financial Reporting',
      description: 'Generate professional financial reports, balance sheets, income statements, and custom analytics. Export to PDF, Excel, or share via email. Schedule automated reports for stakeholders.',
      features: ['Financial Statements', 'Custom Report Builder', 'Automated Scheduling', 'Multi-format Export', 'Interactive Charts'],
      image: '/images/financial-reporting.png',
    },
    approval: {
      title: 'Smart Approval Workflows',
      description: 'Streamline expense approvals with intelligent routing, multi-level authorization, and real-time notifications. Track approval status, set spending limits, and ensure policy compliance.',
      features: ['Multi-level Approvals', 'Automated Routing', 'Policy Enforcement', 'Approval History', 'Mobile Notifications'],
      image: '/images/approval-workflows.png',
    },
  };

  const featuresData = Object.keys(modals).map((key) => ({
    id: key,
    ...modals[key as keyof typeof modals],
  }));

  const filteredFeatures = featuresData.filter((feature) =>
    feature.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1 },
    }),
  };

  return (
    <Wrapper>
      <Header />

      <HeroSection>
        <GradientBackground />
        <Canvas
          camera={{ position: [0, 8, 12], fov: 50 }}
          style={{ position: 'absolute', inset: 0, zIndex: 1 }}
        >
          <SolarSystem />
        </Canvas>

        <div style={{ zIndex: 10 }}>
          <Title initial="hidden" animate="visible">
            {['Enterprise', 'Financial', 'Management', 'Platform'].map((word, i) => (
              <Word key={i} variants={wordVariants} custom={i} initial="hidden" animate="visible">
                {word}{' '}
              </Word>
            ))}
          </Title>
          <Subtitle initial="hidden" animate="visible">
            Transform your financial operations with intelligent automation, real-time analytics, and enterprise-grade security. 
            Manage revenue, control expenses, optimize budgets, and ensure compliance—all in one powerful platform designed for modern finance teams.
          </Subtitle>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Link href="/auth/login">
              <Button 
                size="lg" 
                className="cursor-pointer transition-all duration-300 text-zinc-700 dark:text-zinc-300 
                hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 
                hover:scale-105 hover:shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                style={{
                  fontSize: '1.1rem',
                  padding: '1rem 2.5rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  border: 'none',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                }}
              >
                Start Free Trial
              </Button>
            </Link>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              style={{ 
                marginTop: '1rem', 
                fontSize: '0.9rem', 
                color: '#9ca3af' 
              }}
            >
              No credit card required • 14-day free trial • Cancel anytime
            </motion.p>
          </motion.div>
        </div>
      </HeroSection>

      <FeatureSection ref={featuresRef}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '1rem' }}
        >
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Powerful Features for Modern Finance Teams
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#9ca3af', maxWidth: '700px', margin: '0 auto' }}>
            Everything you need to manage finances, control costs, and drive business growth
          </p>
        </motion.div>

        <ParallelFeaturesContainer>
          {filteredFeatures
            .filter(f => ['inventory', 'reporting', 'approval'].includes(f.id))
            .map((feature) => (
              <Card
                key={feature.id}
                onClick={() => setOpenModal(feature.id)}
                whileHover={{ scale: 1.03 }}
                style={{ minHeight: '280px', display: 'flex', flexDirection: 'column' }}
              >
                <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.75rem', lineHeight: '1.3' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#d1d5db', fontSize: '0.95rem', lineHeight: '1.6', flex: 1 }}>{feature.description}</p>
              </Card>
            ))}
        </ParallelFeaturesContainer>

        <RegularFeaturesGrid>
          {filteredFeatures
            .filter(f => !['inventory', 'reporting', 'approval'].includes(f.id))
            .map((feature) => (
            <Card
              key={feature.id}
              onClick={() => setOpenModal(feature.id)}
              whileHover={{ scale: 1.03 }}
            >
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {feature.title}
              </h3>
              <p style={{ color: '#d1d5db' }}>{feature.description}</p>
            </Card>
          ))}
        </RegularFeaturesGrid>
      </FeatureSection>

      <TeamSection>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Trusted by Finance Professionals Worldwide
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ 
            fontSize: '1.1rem', 
            color: '#9ca3af', 
            marginBottom: '2rem',
            maxWidth: '600px',
            margin: '0 auto 2rem auto'
          }}
        >
          Built by a global team of finance experts, accountants, and software engineers dedicated to transforming how businesses manage their finances.
        </motion.p>
        <TeamImage
          src="/images/team-photo.png"
          alt="Team"
          width={800}
          height={400}
          style={{ objectFit: 'cover', marginBottom: '1rem' }}
        />
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ 
            fontSize: '1rem', 
            color: '#d1d5db',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}
        >
          Our platform powers financial operations for businesses of all sizes—from startups to Fortune 500 companies. 
          We combine deep financial expertise with cutting-edge technology to deliver solutions that drive real business value.
        </motion.p>
      </TeamSection>

      <Footer />

      {openModal && (
        <ModalOverlay onClick={() => setOpenModal(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => setOpenModal(null)}>×</CloseButton>
            <h2 style={{ 
              fontSize: '2rem', 
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700
            }}>
              {modals[openModal as keyof typeof modals].title}
            </h2>
            <p style={{ 
              marginBottom: '1.5rem', 
              fontSize: '1.1rem',
              lineHeight: '1.7',
              color: '#d1d5db'
            }}>
              {modals[openModal as keyof typeof modals].description}
            </p>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ 
                fontSize: '1.2rem', 
                fontWeight: 600, 
                marginBottom: '1rem',
                color: 'white'
              }}>
                Key Capabilities:
              </h3>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '0.75rem'
              }}>
                {modals[openModal as keyof typeof modals].features.map((f) => (
                  <li key={f} style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>
                    <span style={{ color: '#10b981', fontSize: '1.2rem' }}>✓</span>
                    <span style={{ color: '#e5e7eb' }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <Button 
                onClick={() => setOpenModal(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
              >
                Close
              </Button>
              <Link href="/auth/login">
                <Button 
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  Try It Now
                </Button>
              </Link>
            </div>
          </ModalCard>
        </ModalOverlay>
      )}
    </Wrapper>
  );
}
