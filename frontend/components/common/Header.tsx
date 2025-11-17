// components/common/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";


const HeaderWrapper = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);

  .dark & {
    background: rgba(0, 0, 0, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

const Container = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  height: 64px;
  padding: 0 1rem;

  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LeftGroup = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  text-decoration: none;
`;

const Title = styled(motion.span)`
  font-weight: bold;
  font-size: 1.25rem;
  color: black;

  .dark & {
    color: white;
  }

  transition: all 0.3s ease;

  &:hover {
    background-image: linear-gradient(to right, #3b82f6, #8b5cf6, #06b6d4);
    -webkit-background-clip: text;
    color: transparent;
  }
`;

const LoginWrapper = styled.div`
  display: flex;
  align-items: center;
`;

export default function Header() {
  return (
    <HeaderWrapper>
      <Container>
        <LeftGroup href="/">
          <motion.div
            initial={{ rotate: -15, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 10 }}
            whileHover={{ rotate: 10, scale: 1.1 }} 
          >
            <Image
              src="/log.png"
              alt="Financial Management System"
              width={40}
              height={40}
              className="dark:invert"
            />
          </motion.div>

          <Title
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            Financial Management System
          </Title>
        </LeftGroup>
        <LoginWrapper>
          <Link href="/auth/login">
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer text-zinc-700 dark:text-zinc-300 
                         hover:text-transparent hover:bg-clip-text 
                         hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 
                         hover:scale-105 hover:shadow-[0_0_10px_rgba(99,102,241,0.3)]"
            >
              Login
            </Button>
          </Link>
        </LoginWrapper>

      </Container>
    </HeaderWrapper>
  );
}
