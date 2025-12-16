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
  font-weight: 700;
  margin-bottom: 0.5rem;
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
  margin-bottom: 0.5rem;
  color: #818cf8;
  letter-spacing: -0.01em;
`;

const Paragraph = styled.p<{ $muted?: boolean; $small?: boolean }>`
  font-size: ${(props) => (props.$small ? "0.97rem" : "1.05rem")};
  margin-bottom: 1.15rem;
  color: ${(props) => (props.$muted ? "#a1a1aa" : "#e2e8f0")};
  line-height: 1.7;
`;

const List = styled.ul`
  padding-left: 1.2rem;
  margin-bottom: 1.1rem;
  color: #e2e8f0;
`;

const ListItem = styled.li`
  margin-bottom: 0.55rem;
  line-height: 1.55;
`;

const HomeButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0.4rem 0 1.4rem;
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

export default function PrivacyPolicy() {
  return (
    <PageWrapper>
      <Container>
        <Title>Privacy Policy</Title>
        <HomeButton href="/">← Back to Home</HomeButton>
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
          If you have questions or concerns about this Privacy Policy, please contact our support team through the{" "}
          <a href="/service/contact" style={{ color: "#818cf8", textDecoration: "underline" }}>Contact</a> page.
        </Paragraph>

        <Paragraph $small $muted style={{ marginTop: "2rem", textAlign: "right" }}>
          Last updated: June 2024
        </Paragraph>
      </Container>
    </PageWrapper>
  );
}
