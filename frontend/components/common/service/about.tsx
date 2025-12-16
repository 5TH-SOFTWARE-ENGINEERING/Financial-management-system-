"use client";
import React from "react";
import Link from "next/link";
import styled from "styled-components";

const teamMembers = [
  { name: "Amira Bennett", role: "CEO & Co‑Founder", focus: "Vision, partnerships, and customer success." },
  { name: "Rahul Mehta", role: "CTO & Co‑Founder", focus: "Platform architecture, scalability, and security." },
  { name: "Sophia Nguyen", role: "VP of Product", focus: "Product strategy, UX, and roadmap execution." },
  { name: "Marcus Lee", role: "Head of Engineering", focus: "Delivery excellence and engineering culture." },
];

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
  font-weight: 700;
  margin-bottom: 1.1rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
  letter-spacing: -0.01em;
`;

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  margin-top: 1.8rem;
  margin-bottom: 0.4rem;
  color: #818cf8;
  letter-spacing: -0.01em;
`;

const Paragraph = styled.p<{ $muted?: boolean; $large?: boolean }>`
  margin-bottom: 1.1rem;
  color: ${(props) => (props.$muted ? "#c7d0f3" : "#e5e7eb")};
  font-size: ${(props) => (props.$large ? "1.15rem" : "1rem")};
  line-height: 1.65;
`;

const List = styled.ul`
  margin: 1.2rem 0 1.2rem 1.7rem;
  color: #c7d0f3;
`;

const ListItem = styled.li`
  margin-bottom: 0.7rem;
  font-size: 1.07rem;
`;

const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const TeamCard = styled.div`
  background: #1c1f28;
  border: 1px solid rgba(129, 140, 248, 0.15);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
`;

const Avatar = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-bottom: 0.6rem;
  letter-spacing: 0.02em;
`;

const TeamName = styled.div`
  color: #e5e7eb;
  font-weight: 700;
  margin-bottom: 0.2rem;
`;

const TeamRole = styled.div`
  color: #a5b4fc;
  font-size: 0.95rem;
  margin-bottom: 0.4rem;
`;

const TeamBlurb = styled.p`
  color: #cbd5e1;
  font-size: 0.95rem;
  line-height: 1.55;
  margin: 0;
`;

const HomeButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0.5rem 0 1.25rem;
  padding: 0.65rem 1.5rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.35);
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

export default function AboutPage() {
  return (
    <PageWrapper>
      <Container>
        <Title>About Financial Management System</Title>
        <HomeButton href="/">← Back to Home</HomeButton>
        <Paragraph $large $muted>
        Financial Management System is a comprehensive, cloud-based platform designed to streamline enterprise financial operations,
        drive organizational efficiency, and enable better business decisions with real-time analytics and automation.
      </Paragraph>
      <Paragraph>
        Our all-in-one solution empowers finance teams to manage revenue, optimize expenses, maintain budgets, and ensure robust compliance—securely and at scale.
      </Paragraph>

      <SectionTitle>Our Mission</SectionTitle>
      <Paragraph>
        To revolutionize the way finance teams work by providing powerful, user-friendly software that automates routine tasks, ensures data integrity, and delivers actionable insights.
        We believe financial management should be simple, transparent, and empowering for organizations of all sizes.
      </Paragraph>

      <SectionTitle>Core Features</SectionTitle>
      <List>
        <ListItem>
          <strong>Intelligent Automation:</strong> Automate invoicing, approvals, reconciliations, and repetitive workflows to save valuable time.
        </ListItem>
        <ListItem>
          <strong>Real-Time Analytics:</strong> Get instant access to dashboards, customizable reports, and performance KPIs.
        </ListItem>
        <ListItem>
          <strong>Expense &amp; Budget Controls:</strong> Track spending, set budgets, and monitor compliance with ease.
        </ListItem>
        <ListItem>
          <strong>Integrated Modules:</strong> Collaborate across revenue, accounts payable, procurement, asset management, and more.
        </ListItem>
        <ListItem>
          <strong>Enterprise-Grade Security:</strong> Advanced data encryption, access controls, and audit trails keep your data safe.
        </ListItem>
      </List>

      <SectionTitle>Who We Serve</SectionTitle>
      <Paragraph>
        Our platform is trusted by finance professionals, accountants, and business owners worldwide—from startups and SMEs to global enterprises and nonprofit organizations. We are committed to supporting teams on their journey to financial excellence.
      </Paragraph>

      <SectionTitle>Meet the Team</SectionTitle>
      <Paragraph>
        A cross‑functional group of finance leaders, product thinkers, and engineers focused on building secure, intuitive tools.
      </Paragraph>
      <TeamGrid>
        {teamMembers.map((member) => (
          <TeamCard key={member.name}>
            <Avatar aria-hidden>{member.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</Avatar>
            <TeamName>{member.name}</TeamName>
            <TeamRole>{member.role}</TeamRole>
            <TeamBlurb>{member.focus}</TeamBlurb>
          </TeamCard>
        ))}
      </TeamGrid>

      <SectionTitle>Our Story</SectionTitle>
      <Paragraph>
        The Financial Management System was created by a multidisciplinary team of finance leaders and software developers who saw first-hand how traditional tools limited agility and insight.
        Our goal is to bridge the gap between complexity and clarity by building software that adapts to modern business needs.
      </Paragraph>

      <SectionTitle>Contact &amp; Support</SectionTitle>
      <Paragraph>
        Have questions, need support, or want to learn more? Reach out to our team via the{" "}
        <a href="/service/contact" style={{ color: "#818cf8", textDecoration: "underline" }}>Contact</a> page.
        We are here to help you get the most out of your financial operations.
      </Paragraph>

      <Paragraph style={{ marginTop: "2rem", color: "#6b7280", fontSize: "0.97rem", textAlign: "right" }}>
        Last updated: June 2024
      </Paragraph>
      </Container>
    </PageWrapper>
  );
}
