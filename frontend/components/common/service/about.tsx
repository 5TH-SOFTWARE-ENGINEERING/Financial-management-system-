"use client";
import React from "react";

const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      maxWidth: 800,
      margin: "0 auto",
      padding: "2rem 1rem",
      color: "#d1d5db",
      background: "#23272f",
      borderRadius: "0.75rem",
      boxShadow: "0 2px 16px rgba(36,37,39,.15)",
    }}
  >
    {children}
  </div>
);

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h1
    style={{
      fontSize: "2.3rem",
      fontWeight: 700,
      marginBottom: "1.1rem",
      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      lineHeight: 1.2,
      letterSpacing: "-0.01em",
    }}
  >
    {children}
  </h1>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2
    style={{
      fontSize: "1.3rem",
      fontWeight: 600,
      marginTop: "1.8rem",
      marginBottom: "0.4rem",
      color: "#818cf8",
      letterSpacing: "-0.01em",
    }}
  >
    {children}
  </h2>
);

const Paragraph: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <p
    style={{
      marginBottom: "1.1rem",
      color: "#e5e7eb",
      ...style,
    }}
  >
    {children}
  </p>
);

const List: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul style={{ margin: "1.2rem 0 1.2rem 1.7rem", color: "#c7d0f3" }}>{children}</ul>
);

const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li style={{ marginBottom: "0.7rem", fontSize: "1.07rem" }}>{children}</li>
);

export default function AboutPage() {
  return (
    <Container>
      <Title>About Financial Management System</Title>
      <Paragraph style={{ fontSize: "1.15rem", color: "#c7d0f3" }}>
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

      <SectionTitle>Our Story</SectionTitle>
      <Paragraph>
        The Financial Management System was created by a multidisciplinary team of finance leaders and software developers who saw first-hand how traditional tools limited agility and insight.
        Our goal is to bridge the gap between complexity and clarity by building software that adapts to modern business needs.
      </Paragraph>

      <SectionTitle>Contact &amp; Support</SectionTitle>
      <Paragraph>
        Have questions, need support, or want to learn more? Reach out to our team via the{" "}
        <a href="/contact" style={{ color: "#818cf8", textDecoration: "underline" }}>Contact</a> page.
        We are here to help you get the most out of your financial operations.
      </Paragraph>

      <Paragraph style={{ marginTop: "2rem", color: "#6b7280", fontSize: "0.97rem", textAlign: "right" }}>
        Last updated: June 2024
      </Paragraph>
    </Container>
  );
}
