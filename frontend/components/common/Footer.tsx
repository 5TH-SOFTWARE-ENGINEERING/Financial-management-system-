// components/common/Footer.tsx
"use client";
import Link from "next/link";
import styled from "styled-components";

const FooterWrapper = styled.footer`
  border-top: 1px solid rgb(51, 52, 53);
  background-color:rgb(51, 49, 49);
  color: #6b7280;
  .dark & {
    border-color: #27272a;
    background-color: #000;
    color: #a1a1aa;
  }
`;

const FooterContainer = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1.25rem;

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
  font-size: 0.875rem;
  text-align: center;

  @media (min-width: 640px) {
    text-align: left;
  }
`;

const Nav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  font-size: 0.875rem;
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.7;
    text-decoration: underline;
  }
`;

export default function Footer() {
  return (
    <FooterWrapper>
      <FooterContainer>
        <CopyText>© 2025 Financial Management System. All rights reserved.</CopyText>

        <Nav>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/privacy">Privacy</NavLink>
          <NavLink href="/terms">Terms</NavLink>
          <NavLink href="/contact">Contact</NavLink>
          <NavLink href="/support">Support</NavLink>
        </Nav>
      </FooterContainer>
    </FooterWrapper>
  );
}
