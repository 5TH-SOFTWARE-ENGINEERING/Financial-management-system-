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

const Paragraph: React.FC<{
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ style, children }) => (
  <p
    style={{
      fontSize: "1.04rem",
      marginBottom: "1.15rem",
      color: "#e2e8f0",
      lineHeight: 1.65,
      ...style,
    }}
  >
    {children}
  </p>
);

const List: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul style={{ paddingLeft: "1.2rem", marginBottom: "1.1rem" }}>{children}</ul>
);

const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li style={{ marginBottom: "0.5rem" }}>{children}</li>
);

export default function PrivacyPolicy() {
  return (
    <Container>
      <Title>Privacy Policy</Title>
      <Paragraph>
        This Privacy Policy explains how Financial Management System (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) collects, uses, discloses, and protects your personal information when you use our services.
      </Paragraph>

      <SectionTitle>1. Information We Collect</SectionTitle>
      <List>
        <ListItem>
          <strong>Account Information:</strong> Name, email address, and authentication details when you create an account.
        </ListItem>
        <ListItem>
          <strong>Financial Data:</strong> Data you submit for tracking income, expenses, budgets, and any financial records.
        </ListItem>
        <ListItem>
          <strong>Usage Information:</strong> Information about how you interact with the platform, such as device, browser, and log data.
        </ListItem>
        <ListItem>
          <strong>Support Requests:</strong> Any information you provide when contacting support.
        </ListItem>
      </List>

      <SectionTitle>2. How We Use Your Information</SectionTitle>
      <List>
        <ListItem>To provide, maintain, and improve our services.</ListItem>
        <ListItem>To operate your account and manage your financial data.</ListItem>
        <ListItem>To communicate with you about updates, security, or support.</ListItem>
        <ListItem>To detect, prevent, and address technical or security issues.</ListItem>
        <ListItem>For analytics and performance monitoring (anonymized where possible).</ListItem>
      </List>

      <SectionTitle>3. Sharing and Disclosure</SectionTitle>
      <Paragraph>
        We do <strong>not</strong> sell or rent your personal information. We may share your data only in the following circumstances:
      </Paragraph>
      <List>
        <ListItem>
          With <strong>service providers</strong> who assist us (e.g., cloud hosting, analytics), under confidentiality agreements.
        </ListItem>
        <ListItem>
          To comply with <strong>legal obligations</strong> or respond to lawful requests.
        </ListItem>
        <ListItem>
          To protect the rights, property, or safety of our users or the public, as required or permitted by law.
        </ListItem>
      </List>

      <SectionTitle>4. Data Security</SectionTitle>
      <Paragraph>
        We implement a variety of technical and organizational measures to safeguard your information. However, no internet transmission or electronic storage is fully secure—use our services at your own risk.
      </Paragraph>

      <SectionTitle>5. Your Rights and Choices</SectionTitle>
      <List>
        <ListItem>
          <strong>Access or Update:</strong> You may access or update your account information at any time.
        </ListItem>
        <ListItem>
          <strong>Delete:</strong> You may delete your account by contacting us. Some data may be retained as required by law.
        </ListItem>
        <ListItem>
          <strong>Communications:</strong> You may opt-out of non-essential communications.
        </ListItem>
      </List>

      <SectionTitle>6. Data Retention</SectionTitle>
      <Paragraph>
        We retain your data as long as necessary to provide our services and for legitimate business or legal purposes.
      </Paragraph>

      <SectionTitle>7. Children&apos;s Privacy</SectionTitle>
      <Paragraph>
        Our services are not intended for children under 16. We do not knowingly collect data from children.
      </Paragraph>

      <SectionTitle>8. Changes to This Policy</SectionTitle>
      <Paragraph>
        We may update this Privacy Policy from time to time. We will notify you of significant changes, and your continued use of the platform signifies acceptance of the revised policy.
      </Paragraph>

      <SectionTitle>9. Contact Us</SectionTitle>
      <Paragraph>
        If you have questions or concerns about this Privacy Policy, please contact our support team through the <a href="/service/contact" style={{color:'#818cf8', textDecoration:'underline'}}>Contact</a> page.
      </Paragraph>

      <Paragraph style={{marginTop:"2rem", color:"#6b7280", fontSize: "0.97rem", textAlign:"right"}}>
        Last updated: June 2024
      </Paragraph>
    </Container>
  );
}
