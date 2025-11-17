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
`;

const GradientBackground = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;  /* ← IMPORTANT FIX */
  background: linear-gradient(
    135deg,
    rgb(9, 10, 10) 0%,
    rgb(112, 98, 100) 50%,
    rgb(116, 105, 105) 50%,
    rgb(12, 11, 11) 70%,
    rgb(13, 14, 13) 100%
  );
  z-index: 0;
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
`;

const FeatureGrid = styled.div`
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

  &:hover {
    transform: translateY(-8px);
    background-color: rgba(255, 255, 255, 0.1);
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
  background-color: #0b0c10;
`;

const TeamImage = styled(Image)`
  border-radius: ${theme.radius};
  box-shadow: ${theme.shadows.lg};
`;

const Word = styled(motion.span)`
  display: inline-block;
`;

// === 3D COMPONENTS ===
function PulsingSphere({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<Mesh>(null!);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
    }
  });
  return (
    <Sphere ref={meshRef} args={[1.5, 64, 64]} position={position}>
      <MeshDistortMaterial color="#3b82f6" distort={0.3} speed={2} roughness={0} />
    </Sphere>
  );
}

export default function Home() {
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: '-100px' });

  const modals = {
    growth: {
      title: 'Growth Analyzer',
      description: 'Dive deep into your business performance with our AI-driven analyzer.',
      features: ['AI Insights', 'Forecasting', 'Dashboards'],
      image: '/images/growth-analyzer.png',
    },
    budget: {
      title: 'Budget Allocator',
      description: 'Manage finances efficiently with automated allocation tools.',
      features: ['Automation', 'Tracking', 'Integrations'],
      image: '/images/budget-allocator.png',
    },
    secure: {
      title: 'Secure Investments',
      description: 'Protect and grow your portfolio with security and compliance.',
      features: ['Encryption', 'MFA', 'Risk Analytics'],
      image: '/images/secure-investments.png',
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
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ position: 'absolute', inset: 0, zIndex: 1 }}
        >
          <ambientLight intensity={0.5} />
          <PulsingSphere position={[0, 0, 0]} />
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.8} />
        </Canvas>

        <div style={{ zIndex: 10 }}>
          <Title initial="hidden" animate="visible">
            {['Secure', 'Financial', 'Management', 'System'].map((word, i) => (
              <Word key={i} variants={wordVariants} custom={i} initial="hidden" animate="visible">
                {word}{' '}
              </Word>
            ))}
          </Title>
          <Subtitle initial="hidden" animate="visible">
            Streamline revenue tracking, expense approvals, and compliance-ready reporting.
          </Subtitle>
          <Link href="/auth/login">
            <Button size="lg" className=" cursor-pointer transition-all duration-300 text-zinc-700 dark:text-zinc-300 
             hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 
             hover:scale-105 hover:shadow-[0_0_10px_rgba(99,102,241,0.3)]">Get Started</Button>
          </Link>
        </div>
      </HeroSection>

      <FeatureSection ref={featuresRef}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700 }}
        >
          Key Features
        </motion.h2>

        <FeatureGrid>
          {filteredFeatures.map((feature) => (
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
        </FeatureGrid>
      </FeatureSection>

      <TeamSection>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Meet Our Team</h2>
        <TeamImage
          src="/images/team-photo.png"
          alt="Team"
          width={800}
          height={400}
          style={{ objectFit: 'cover', marginBottom: '1rem' }}
        />
        <p>A global team of finance experts driving innovation.</p>
      </TeamSection>

      <Footer />

      {openModal && (
        <ModalOverlay onClick={() => setOpenModal(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => setOpenModal(null)}>×</CloseButton>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>
              {modals[openModal as keyof typeof modals].title}
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              {modals[openModal as keyof typeof modals].description}
            </p>
            <ul style={{ marginBottom: '1.5rem' }}>
              {modals[openModal as keyof typeof modals].features.map((f) => (
                <li key={f}>✅ {f}</li>
              ))}
            </ul>
            <Button onClick={() => setOpenModal(null)}>Close</Button>
          </ModalCard>
        </ModalOverlay>
      )}
    </Wrapper>
  );
}
