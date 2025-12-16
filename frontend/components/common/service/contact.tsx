"use client";
import React, { useState } from "react";
import Link from "next/link";
import styled from "styled-components";

const PageWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  background: radial-gradient(circle at 12% 18%, rgba(129, 140, 248, 0.16), transparent 32%),
    radial-gradient(circle at 82% 10%, rgba(59, 130, 246, 0.18), transparent 28%),
    #0f172a;
  padding: 2.5rem 1rem 3.25rem;
  display: flex;
  justify-content: center;
`;

const Container = styled.div`
  width: 100%;
  max-width: 920px;
  padding: 2rem 1.5rem;
  color: #d1d5db;
  background: linear-gradient(180deg, rgba(35, 39, 47, 0.95), rgba(18, 22, 30, 0.98));
  border: 1px solid rgba(129, 140, 248, 0.16);
  border-radius: 16px;
  box-shadow: 0 14px 48px rgba(0, 0, 0, 0.32);
`;

const Title = styled.h1`
  font-size: 2.3rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
  letter-spacing: -0.01em;
`;

const Intro = styled.p`
  color: #a1a1aa;
  font-size: 1.05rem;
  margin-bottom: 1.5rem;
  line-height: 1.65;
`;

const Label = styled.label`
  display: block;
  color: #a5b4fc;
  font-weight: 500;
  margin-bottom: 0.35rem;
  letter-spacing: -0.01em;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  border: 1px solid #3b3f4c;
  background: #0f1118;
  color: #e5e7eb;
  font-size: 1rem;
  margin-bottom: 1rem;
  outline: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;

  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  border: 1px solid #3b3f4c;
  background: #0f1118;
  color: #e5e7eb;
  font-size: 1rem;
  margin-bottom: 1rem;
  outline: none;
  resize: vertical;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;

  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #fff;
  font-weight: 600;
  border: none;
  border-radius: 999px;
  padding: 0.75rem 1.8rem;
  font-size: 1rem;
  box-shadow: 0 10px 22px rgba(59, 130, 246, 0.28);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 30px rgba(59, 130, 246, 0.38);
    opacity: 0.95;
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const ErrorText = styled.div`
  color: #f87171;
  margin-bottom: 1rem;
  font-size: 0.97rem;
  font-weight: 500;
`;

const SuccessCard = styled.div`
  background: #223156;
  padding: 1.5rem 1rem;
  border-radius: 12px;
  margin-top: 2rem;
  text-align: center;
  color: #a5b4fc;
  font-size: 1.08rem;
  border: 1.5px solid #373e61;
  box-shadow: 0 10px 28px rgba(55, 62, 97, 0.35);
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

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple Input Handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  // Mock submit handler (replace with actual API in production)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.message.trim()
    ) {
      setError("Please fill in all fields.");
      return;
    }
    setSubmitting(true);

    // Simulate network delay & success
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <PageWrapper>
      <Container>
        <Title>Contact Us</Title>
        <HomeButton href="/">← Back to Home</HomeButton>

        <Intro>
          Have questions, feedback, or need support? Fill out the form below and our team will get back to you within 1–2 business days.
          <br />
          <span style={{ fontSize: "0.97rem", color: "#818cf8" }}>
            Or email us directly at{" "}
            <a href="mailto:support@finmgmt.co" style={{ color: "#818cf8", textDecoration: "underline" }}>
              support@finmgmt.co
            </a>
          </span>
        </Intro>

        {!submitted ? (
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: "0.8rem" }}>
              <Label htmlFor="name">Name</Label>
              <Input
                required
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
                autoComplete="name"
              />
            </div>
            <div style={{ marginBottom: "0.8rem" }}>
              <Label htmlFor="email">Email</Label>
              <Input
                required
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div style={{ marginBottom: "0.8rem" }}>
              <Label htmlFor="message">Message</Label>
              <TextArea
                required
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="How can we help you?"
              />
            </div>
            {error && <ErrorText>{error}</ErrorText>}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        ) : (
          <SuccessCard>
            <div style={{ fontSize: "2rem", marginBottom: "0.7rem" }}>🎉</div>
            Thank you for reaching out!<br />
            Our team has received your message and will be in touch soon.
          </SuccessCard>
        )}
      </Container>
    </PageWrapper>
  );
}
