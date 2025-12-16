"use client";
import React, { useState } from "react";

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

const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
  children,
  ...props
}) => (
  <label
    {...props}
    style={{
      display: "block",
      color: "#a5b4fc",
      fontWeight: 500,
      marginBottom: "0.3rem",
      letterSpacing: "-0.01em",
    }}
  >
    {children}
  </label>
);

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => (
  <input
    ref={ref}
    {...props}
    style={{
      width: "100%",
      padding: "0.5rem 0.7rem",
      borderRadius: "0.5rem",
      border: "1px solid #555",
      background: "#13151b",
      color: "#d1d5db",
      marginBottom: "1rem",
      fontSize: "1rem",
      outline: "none",
    }}
  />
));
Input.displayName = "Input";

const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>((props, ref) => (
  <textarea
    ref={ref}
    {...props}
    style={{
      width: "100%",
      minHeight: "100px",
      padding: "0.6rem 0.7rem",
      borderRadius: "0.5rem",
      border: "1px solid #555",
      background: "#13151b",
      color: "#d1d5db",
      fontSize: "1rem",
      marginBottom: "1rem",
      outline: "none",
      resize: "vertical",
    }}
  />
));
TextArea.displayName = "TextArea";

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  ...props
}) => (
  <button
    {...props}
    style={{
      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
      color: "#fff",
      fontWeight: 600,
      border: "none",
      borderRadius: "0.5rem",
      padding: "0.7rem 2.2rem",
      fontSize: "1rem",
      boxShadow: "0 1px 8px rgba(59,130,246,0.21)",
      cursor: "pointer",
      transition: "all 0.16s",
      marginTop: "0.2rem",
    }}
  >
    {children}
  </button>
);

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
    <Container>
      <Title>Contact Us</Title>

      <p style={{ color: "#a1a1aa", fontSize: "1.05rem", marginBottom: "1.7rem" }}>
        Have questions, feedback, or need support? Fill out the form below and our team will get back to you within 1–2 business days.
        <br />
        <span style={{ fontSize: "0.97rem", color: "#818cf8" }}>
          Or email us directly at <a href="mailto:support@finmgmt.co" style={{ color: "#818cf8", textDecoration: "underline" }}>support@finmgmt.co</a>
        </span>
      </p>

      {!submitted ? (
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: "1rm" }}>
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
          <div style={{ marginBottom: "1rm" }}>
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
          <div style={{ marginBottom: "1rm" }}>
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
          {error && (
            <div
              style={{
                color: "#f87171",
                marginBottom: "1rem",
                fontSize: "0.97rem",
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send Message"}
          </Button>
        </form>
      ) : (
        <div
          style={{
            background: "#223156",
            padding: "1.5rem 1rem",
            borderRadius: "0.75rem",
            marginTop: "2rem",
            textAlign: "center",
            color: "#a5b4fc",
            fontSize: "1.11rem",
            border: "1.5px solid #373e61",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🎉</div>
          Thank you for reaching out!<br />
          Our team has received your message and will be in touch soon.
        </div>
      )}
    </Container>
  );
}
