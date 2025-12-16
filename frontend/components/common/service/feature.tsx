"use client";
import React from "react";
import Link from "next/link";
import styled from "styled-components";

const PageWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  background: radial-gradient(circle at 18% 18%, rgba(129, 140, 248, 0.16), transparent 32%),
    radial-gradient(circle at 84% 6%, rgba(59, 130, 246, 0.18), transparent 26%),
    #0f172a;
  padding: 2.5rem 1rem 3.25rem;
  display: flex;
  justify-content: center;
`;

const Container = styled.div`
  width: 100%;
  max-width: 960px;
  padding: 2.25rem 1.75rem;
  color: #d1d5db;
  background: linear-gradient(180deg, rgba(35, 39, 47, 0.95), rgba(18, 22, 30, 0.98));
  border: 1px solid rgba(129, 140, 248, 0.16);
  border-radius: 16px;
  box-shadow: 0 14px 48px rgba(0, 0, 0, 0.32);
`;

const Title = styled.h1`
  font-size: 2.3rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.01em;
`;

const Subtitle = styled.p`
  color: #a1a1aa;
  font-size: 1.05rem;
  margin-bottom: 1.6rem;
  line-height: 1.7;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 1.6rem 0 0.75rem 0;
  color: #a5b4fc;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
`;

const Card = styled.div`
  background: #111524;
  border: 1px solid rgba(129, 140, 248, 0.18);
  border-radius: 12px;
  padding: 1.1rem 1rem;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.32);
`;

const CardTitle = styled.h3`
  color: #e5e7eb;
  font-weight: 700;
  margin-bottom: 0.35rem;
  font-size: 1.05rem;
`;

const CardText = styled.p`
  color: #cbd5e1;
  line-height: 1.6;
  font-size: 0.98rem;
  margin: 0;
`;

const CTAWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.75rem;
`;

const PrimaryButton = styled(Link)`
  padding: 0.75rem 1.6rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #ffffff;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 12px 26px rgba(59, 130, 246, 0.35);
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;

  &:hover {
    transform: translateY(-1.5px);
    box-shadow: 0 16px 32px rgba(59, 130, 246, 0.45);
    opacity: 0.95;
  }

  &:active {
    transform: translateY(0);
  }
`;

const GhostButton = styled(Link)`
  padding: 0.72rem 1.35rem;
  border-radius: 999px;
  border: 1px solid rgba(129, 140, 248, 0.45);
  color: #cbd5ff;
  text-decoration: none;
  font-weight: 700;
  background: rgba(129, 140, 248, 0.08);
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;

  &:hover {
    transform: translateY(-1.5px);
    box-shadow: 0 10px 24px rgba(129, 140, 248, 0.28);
    opacity: 0.95;
  }

  &:active {
    transform: translateY(0);
  }
`;

const Feature = () => {
  return (
    <PageWrapper>
      <Container>
        <Title>Platform Features</Title>
        <Subtitle>
          Everything you need to run finance at scale—automation, insights, controls, and collaboration,
          designed for modern teams.
        </Subtitle>

        <SectionTitle>What you get</SectionTitle>
        <Grid>
          <Card>
            <CardTitle>Automation</CardTitle>
            <CardText>Approvals, invoicing, reconciliations, and recurring workflows with guardrails.</CardText>
          </Card>
          <Card>
            <CardTitle>Real-time Analytics</CardTitle>
            <CardText>Live dashboards, custom reports, and drill-down KPIs for instant visibility.</CardText>
          </Card>
          <Card>
            <CardTitle>Controls & Compliance</CardTitle>
            <CardText>Role-based access, audit trails, and policy checks built into every workflow.</CardText>
          </Card>
          <Card>
            <CardTitle>Collaboration</CardTitle>
            <CardText>Shared context, comments, and assignments to keep finance and ops in sync.</CardText>
          </Card>
        </Grid>

        <SectionTitle>Next steps</SectionTitle>
        <CTAWrap>
          <PrimaryButton href="/service/price">View pricing</PrimaryButton>
          <GhostButton href="/service/contact">Talk to us</GhostButton>
          <GhostButton href="/service/docs">Explore docs</GhostButton>
        </CTAWrap>
      </Container>
    </PageWrapper>
  );
};

export default Feature;
