// components/common/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";


const HeaderWrapper = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  background: rgba(71, 69, 69, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
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


const LeftGroup = styled.a`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  text-decoration: none;
`;


const Title = styled.span`
  font-weight: bold;
  font-size: 1.25rem;
  color: white;
  transition: all 0.3s ease;

  &:hover {
    background-image: linear-gradient(to right, #3b82f6, #8b5cf6, #06b6d4);
    -webkit-background-clip: text;
    color: transparent;
  }
`;



const LoginButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;

  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
  }
`;


export default function Header() {
  return (
    <HeaderWrapper>
      <Container>
        <LeftGroup href="/">
          <div>
            <Image
              src="/log.png"
              alt="Financial Management System"
              width={40}
              height={40}
            />
          </div>

          <Title>
            Financial Management System
          </Title>
        </LeftGroup>

        {/* Styled Login Button */}
        <Link href="/auth/login">
          <LoginButton>
            Login
          </LoginButton>
        </Link>
      </Container>
    </HeaderWrapper>
  );
}
