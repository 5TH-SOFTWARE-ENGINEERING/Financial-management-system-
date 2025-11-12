'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { LoginSchema, type LoginInput } from '@/lib/validation';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { Mesh } from 'three';
import { useRef } from 'react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, error } = useUserStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Custom 3D Sphere with dynamic pulsing scale animation for background
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

  // Custom Particle System with dynamic speed variation for background
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
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900/20 via-zinc-900/10 to-black/20 px-4 overflow-hidden">
      {/* Background 3D Animation */}
      <div className="absolute inset-0 z-0 pointer-events-none">
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

      {/* Centered Login Form */}
      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">
            Financial Management System
          </h1>
          <p className="mt-2 text-sm text-zinc-200">
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-white">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                {...register('email')}
                type="email"
                id="email"
                autoComplete="email"
                className={cn(
                  "w-full pl-10 pr-3 py-2 border rounded-md bg-white/10 backdrop-blur-sm text-white placeholder:text-zinc-400 border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  errors.email && "border-destructive focus:ring-destructive"
                )}
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-white">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                className={cn(
                  "w-full pl-10 pr-10 py-2 border rounded-md bg-white/10 backdrop-blur-sm text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  errors.password && "border-destructive focus:ring-destructive"
                )}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => router.push('/auth/reset-password')}
              className="text-sm text-zinc-300 hover:text-white hover:underline"
              disabled={isLoading}
            >
              Forgot your password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full py-2 px-4 rounded-md text-primary-foreground bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
              isLoading && "opacity-50"
            )}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}