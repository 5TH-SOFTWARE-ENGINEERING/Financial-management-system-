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
  margin-bottom: 0.6rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
  letter-spacing: -0.01em;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.8rem;
  margin-bottom: 0.4rem;
  color: #818cf8;
  letter-spacing: -0.01em;
`;

const Paragraph = styled.p`
  margin: 0 0 1.2rem 0;
  font-size: 1.05rem;
  color: #d1d5db;
  line-height: 1.75;
`;

const List = styled.ul`
  list-style: disc inside;
  margin: 0 0 1.3rem 0;
  padding-left: 1.25rem;
  color: #d1d5db;
  font-size: 1.05rem;
`;

const ListItem = styled.li`
  margin: 0 0 0.6rem 0;
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

export default function Support() {
  return (
    <PageWrapper>
      <Container>
        <Title>Support &amp; Help Center</Title>
        <HomeButton href="/">← Back to Home</HomeButton>
        <Paragraph>
          Welcome to the Support &amp; Help Center for Financial Management System. We’re here to assist you with any questions, issues, and feedback about the platform.
        </Paragraph>

        <SectionTitle>1. Frequently Asked Questions (FAQ)</SectionTitle>
        <List>
          <ListItem>
            <strong>How do I reset my password?</strong>
            <br />
            Go to the <a href="/reset-password" style={{ color: "#818cf8", textDecoration: "underline" }}>Reset Password</a> page and follow the instructions.
          </ListItem>
          <ListItem>
            <strong>How do I report a bug or issue?</strong>
            <br />
            Use the <a href="/service/contact" style={{ color: "#818cf8", textDecoration: "underline" }}>Contact</a> form to send a detailed description of the issue. Include screenshots if possible.
          </ListItem>
          <ListItem>
            <strong>How do I delete my account?</strong>
            <br />
            Please reach out to our support team via the <a href="/service/contact" style={{ color: "#818cf8", textDecoration: "underline" }}>Contact</a> page and request account deletion. Some data may be retained as required by law.
          </ListItem>
          <ListItem>
            <strong>Where can I find more about privacy and terms?</strong>
            <br />
            Please see our <a href="/service/privacy" style={{ color: "#818cf8", textDecoration: "underline" }}>Privacy Policy</a> and <a href="/service/terms" style={{ color: "#818cf8", textDecoration: "underline" }}>Terms of Service</a>.
          </ListItem>
        </List>

        <SectionTitle>2. Contact Support</SectionTitle>
        <Paragraph>
          If your question isn’t answered above, you can contact our support team using the <a href="/service/contact" style={{ color: "#818cf8", textDecoration: "underline" }}>Contact</a> form. Our team typically replies within 1–2 business days.
        </Paragraph>

        <SectionTitle>3. Feedback &amp; Feature Requests</SectionTitle>
        <Paragraph>
          We value your feedback! If you have suggestions for improvements or feature requests, please let us know through the <a href="/service/contact" style={{ color: "#818cf8", textDecoration: "underline" }}>Contact</a> page. Your input helps us enhance the platform for everyone.
        </Paragraph>

        <SectionTitle>4. Security Concerns</SectionTitle>
        <Paragraph>
          If you believe you’ve discovered a security vulnerability, please report it responsibly to our team at <a href="mailto:support@finmanagersys.com" style={{ color: "#818cf8", textDecoration: "underline" }}>support@finmanagersys.com</a>. We take security seriously and appreciate your efforts to keep the platform safe.
        </Paragraph>

        <SectionTitle>5. Useful Resources</SectionTitle>
        <List>
          <ListItem>
            <a href="/service/about" style={{ color: "#818cf8", textDecoration: "underline" }}>About Financial Management System</a>
          </ListItem>
          <ListItem>
            <a href="/service/privacy" style={{ color: "#818cf8", textDecoration: "underline" }}>Privacy Policy</a>
          </ListItem>
          <ListItem>
            <a href="/service/terms" style={{ color: "#818cf8", textDecoration: "underline" }}>Terms of Service</a>
          </ListItem>
        </List>

        <Paragraph style={{ marginTop: "2rem", color: "#6b7280", fontSize: "0.97rem", textAlign: "right" }}>
          Last updated: June 2024
        </Paragraph>
      </Container>
    </PageWrapper>
  );
}
