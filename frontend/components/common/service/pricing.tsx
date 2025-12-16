"use client";
import React from "react";
import styled from "styled-components";
import Link from "next/link";

const PageWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  background: radial-gradient(circle at 12% 18%, rgba(129, 140, 248, 0.14), transparent 32%),
    radial-gradient(circle at 82% 10%, rgba(59, 130, 246, 0.13), transparent 25%),
    #111827;
  padding: 2.5rem 1rem 3.25rem;
  display: flex;
  justify-content: center;
`;

const Container = styled.div`
  width: 100%;
  max-width: 960px;
  padding: 2rem 1.5rem;
  color: #d1d5db;
  background: linear-gradient(180deg, rgba(35, 39, 47, 0.96), rgba(18, 22, 30, 0.99));
  border: 1px solid rgba(129, 140, 248, 0.14);
  border-radius: 16px;
  box-shadow: 0 14px 48px rgba(0, 0, 0, 0.28);
`;

const Title = styled.h1`
  font-size: 2.4rem;
  font-weight: 800;
  margin-bottom: 0.4rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
  letter-spacing: -0.01em;
`;

const Intro = styled.p`
  color: #a1a1aa;
  font-size: 1.09rem;
  margin-bottom: 2rem;
  line-height: 1.65;
  max-width: 640px;
`;

const HomeButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  margin: 0.35rem 0 1.3rem;
  padding: 0.65rem 1.4rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #ffffff;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.95rem;
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.32);
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 32px rgba(59, 130, 246, 0.45);
    opacity: 0.95;
  }

  &:active {
    transform: translateY(0);
  }
`;

const PlansGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.2rem;
  @media (min-width: 690px) {
    flex-direction: row;
    gap: 2.8rem;
  }
`;

const PlanCard = styled.div<{ $featured?: boolean }>`
  flex: 1;
  background: ${({ $featured }) =>
    $featured
      ? "linear-gradient(110deg, #383e70 80%, #6d5afd 150%)"
      : "#171b26"};
  border-radius: 15px;
  border: ${({ $featured }) =>
    $featured ? "2.5px solid #818cf8" : "1.5px solid #262e45"};
  box-shadow: ${({ $featured }) =>
    $featured
      ? "0 8px 40px 0 rgba(129, 140, 248, 0.23)"
      : "0 6px 32px rgba(30, 41, 59, 0.12)"};
  padding: 2.1rem 1.5rem 2.3rem;
  color: ${({ $featured }) => ($featured ? "#e0e7ff" : "#cbd5e1")};
  position: relative;
  display: flex;
  flex-direction: column;
`;

const PlanName = styled.h2`
  font-size: 1.22rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #a5b4fc;
  letter-spacing: -0.01em;
`;

const Price = styled.div`
  font-size: 2.3rem;
  font-weight: 800;
  margin-bottom: 0.8rem;
  background: linear-gradient(130deg, #6366f1, #8b5cf6 65%, #c4b5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtext = styled.div`
  font-size: 1.05rem;
  margin-bottom: 1.3rem;
  color: #a1a1aa;
`;

const FeaturesList = styled.ul`
  list-style: none;
  margin: 0 0 1.5rem 0;
  padding: 0;
`;

const Feature = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.01rem;
  margin-bottom: 0.63rem;
  color: #c7d2fe;
  svg {
    flex-shrink: 0;
    color: #818cf8;
    margin-top: 2px;
  }
`;

const ActionButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  border-radius: 999px;
  background: linear-gradient(130deg, #3b82f6, #8b5cf6 70%);
  color: #fff;
  font-weight: 700;
  font-size: 1.07rem;
  padding: 0.77rem 1.8rem;
  text-decoration: none;
  margin-top: auto;
  box-shadow: 0 7px 23px rgba(59, 130, 246, 0.2);
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
  &:hover {
    transform: translateY(-2px) scale(1.03);
    opacity: 0.97;
    box-shadow: 0 12px 32px rgba(139, 92, 246, 0.20);
  }
  &:active {
    transform: translateY(0) scale(1);
  }
`;

const ContactCard = styled.div`
  margin-top: 2.3rem;
  background: #232750;
  border-radius: 13px;
  border: 1.5px solid #383e70;
  color: #b4b7e9;
  padding: 1.5rem 1.2rem 1.1rem;
  font-size: 1.09rem;
  text-align: center;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 6px 25px 0 rgba(55, 62, 97, 0.16);
`;

const EmailLink = styled(Link)`
  color: #a5b4fc;
  font-weight: 600;
  text-decoration: underline dotted;
  &:hover {
    color: #fff;
    text-decoration: underline;
  }
`;

function CheckIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 20 20">
      <path
        d="M16.7 6.85a1.12 1.12 0 0 0-1.58-1.6l-5.02 5.03-2.38-2.39A1.12 1.12 0 1 0 6.15 9.86l3.19 3.19a1.12 1.12 0 0 0 1.58 0l5.78-5.78Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Pricing() {
  return (
    <PageWrapper>
      <Container>
        <Title>Pricing</Title>
        <HomeButton href="/">← Back to Home</HomeButton>
        <Intro>
          Transparent, simple pricing. All plans include core accounting, up-to-date reporting, and premium customer support.
        </Intro>
        <PlansGrid>
          <PlanCard>
            <PlanName>Free</PlanName>
            <Price>$0<span style={{ fontSize: "1.1rem", fontWeight: 500 }}>/mo</span></Price>
            <Subtext>No credit card required</Subtext>
            <FeaturesList>
              <Feature><CheckIcon /> Unlimited users</Feature>
              <Feature><CheckIcon /> Up to 200 transactions/month</Feature>
              <Feature><CheckIcon /> Double-entry bookkeeping</Feature>
              <Feature><CheckIcon /> Basic financial reports</Feature>
              <Feature><CheckIcon /> Support via email</Feature>
            </FeaturesList>
            <ActionButton href="/auth/register">Get Started Free</ActionButton>
          </PlanCard>
          <PlanCard $featured>
            <PlanName>Pro</PlanName>
            <Price>$15<span style={{ fontSize: "1.1rem", fontWeight: 500 }}>/mo</span></Price>
            <Subtext>For growing businesses</Subtext>
            <FeaturesList>
              <Feature><CheckIcon /> Everything in Free, plus:</Feature>
              <Feature><CheckIcon /> Unlimited transactions</Feature>
              <Feature><CheckIcon /> Advanced financial reports</Feature>
              <Feature><CheckIcon /> Priority email support</Feature>
              <Feature><CheckIcon /> Tagging & segmented reports</Feature>
            </FeaturesList>
            <ActionButton href="/auth/register">Start 30 Day Trial</ActionButton>
          </PlanCard>
          <PlanCard>
            <PlanName>Enterprise</PlanName>
            <Price>Custom</Price>
            <Subtext>Bespoke solutions for larger teams</Subtext>
            <FeaturesList>
              <Feature><CheckIcon /> All Pro features</Feature>
              <Feature><CheckIcon /> Dedicated onboarding</Feature>
              <Feature><CheckIcon /> SSO & advanced controls</Feature>
              <Feature><CheckIcon /> Integrations & custom modules</Feature>
              <Feature><CheckIcon /> SLA & contract support</Feature>
            </FeaturesList>
            <ActionButton href="/service/contact">Contact Sales</ActionButton>
          </PlanCard>
        </PlansGrid>
        <ContactCard>
          Have questions or a custom need? Email us at&nbsp;
          <EmailLink href="mailto:support@finmgmt.co">support@finmgmt.co</EmailLink>
          &nbsp;or&nbsp;
          <Link style={{ color: "#a5b4fc", fontWeight: "600" }} href="/service/contact">
            contact us
          </Link>
          .
        </ContactCard>
      </Container>
    </PageWrapper>
  );
}
