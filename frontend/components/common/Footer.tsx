// components/common/Footer.tsx
"use client";
import Link from "next/link";
import styled from "styled-components";

const FooterWrapper = styled.footer`
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: radial-gradient(circle at 20% 10%, rgba(129, 140, 248, 0.08), transparent 30%),
    radial-gradient(circle at 80% 0%, rgba(59, 130, 246, 0.1), transparent 26%),
    #0b1220;
  color: #a1a1aa;
  box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.25);

  .dark & {
    border-color: rgba(255, 255, 255, 0.08);
    background: #05070f;
  }
`;

const FooterContainer = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.75rem 1.25rem;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: space-between;
    gap: 0;
  }
`;

const CopyText = styled.p`
  font-size: 0.92rem;
  text-align: center;
  color: #cbd5e1;

  @media (min-width: 640px) {
    text-align: left;
  }
`;

const Nav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 1.15rem;
  font-size: 0.92rem;
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: #cbd5e1;
  font-weight: 600;
  letter-spacing: -0.01em;
  padding: 0.25rem 0;
  position: relative;
  transition: color 0.18s ease, opacity 0.18s ease;

  &:after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.2s ease;
  }

  &:hover {
    color: #e5e7eb;
  }

  &:hover:after {
    transform: scaleX(1);
  }
`;

export default function Footer() {
  return (
    <FooterWrapper>
      <FooterContainer>
        <CopyText>© 2025 Financial Management System. All rights reserved.</CopyText>

        <Nav>
          <NavLink href="/service/privacy">Privacy</NavLink>
          <NavLink href="/service/terms">Terms</NavLink>
          <NavLink href="/service/contact">Contact</NavLink>
          <NavLink href="/service/support">Support</NavLink>
          <NavLink href="/service/about">About</NavLink>
        </Nav>
      </FooterContainer>
    </FooterWrapper>
  );
}
