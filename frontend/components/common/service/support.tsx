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
      margin: "0 0 1.3rem 0",
      fontSize: "1.06rem",
      color: "#d1d5db",
      lineHeight: 1.75,
      ...style,
    }}
  >
    {children}
  </p>
);

const List: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul
    style={{
      listStyle: "disc inside",
      margin: "0 0 1.3rem 0",
      paddingLeft: "1.25rem",
      color: "#d1d5db",
      fontSize: "1.06rem",
    }}
  >
    {children}
  </ul>
);

const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li style={{ margin: "0 0 0.6rem 0" }}>{children}</li>
);

export default function Support() {
  return (
    <Container>
      <Title>Support &amp; Help Center</Title>
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
  );
}
