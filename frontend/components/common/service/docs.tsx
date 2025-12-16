"use client";
import React from "react";
import Link from "next/link";
import styled from "styled-components";

const PageWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  background: radial-gradient(circle at 18% 14%, rgba(129, 140, 248, 0.13), transparent 32%),
    radial-gradient(circle at 85% 12%, rgba(59, 130, 246, 0.16), transparent 28%),
    #10192b;
  padding: 2.3rem 1rem 3rem;
  display: flex;
  justify-content: center;
`;

const Container = styled.div`
  width: 100%;
  max-width: 880px;
  padding: 2rem 1.5rem;
  color: #dde1ed;
  background: linear-gradient(180deg, rgba(32, 37, 52, 0.98), rgba(18, 22, 34, 0.96));
  border: 1px solid rgba(129, 140, 248, 0.13);
  border-radius: 16px;
  box-shadow: 0 14px 44px rgba(0, 0, 0, 0.24);
`;

const Title = styled.h1`
  font-size: 2.1rem;
  font-weight: 700;
  margin-bottom: 0.7rem;
  background: linear-gradient(135deg, #6366f1 40%, #8b5cf6 70%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.18;
  letter-spacing: -0.01em;
`;

const Intro = styled.p`
  color: #a1a1aa;
  font-size: 1.09rem;
  margin-bottom: 2.1rem;
  line-height: 1.65;
`;

const SectionTitle = styled.h2`
  color: #a5b4fc;
  font-size: 1.24rem;
  font-weight: 700;
  margin: 2.2rem 0 0.8rem 0;
  letter-spacing: -0.01em;
`;

const List = styled.ul`
  margin-bottom: 1.6rem;
  padding-left: 1.1em;
`;

const Item = styled.li`
  margin-bottom: 0.5rem;
  font-size: 1rem;
`;

const CodeBlock = styled.pre`
  background: #161d2e;
  color: #c7d0e0;
  font-size: 0.98rem;
  border-radius: 8px;
  padding: 1.1rem 1rem;
  margin: 1rem 0 1.5rem 0;
  overflow-x: auto;
`;

const EmailLink = styled.a`
  color: #a5b4fc;
  text-decoration: underline;
  font-weight: 600;

  &:hover {
    color: #818cf8;
  }
`;

const DocsLink = styled(Link)`
  color: #dbeafe;
  font-weight: 600;
  text-decoration: underline;
  &:hover {
    color: #818cf8;
  }
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

export default function Docs() {
  return (
    <PageWrapper>
      <Container>
        <Title>Documentation</Title>
        <HomeButton href="/">← Back to Home</HomeButton>
        <Intro>
          Welcome to the documentation for the Financial Management System.<br/> 
          Here you'll find guides, API references, and useful resources to help you get started.
        </Intro>

        <SectionTitle>Getting Started</SectionTitle>
        <List>
          <Item>
            <b>Sign Up</b>: <DocsLink href="/auth/register">Create an account</DocsLink> for your business.
          </Item>
          <Item>
            <b>Login</b>: Access your dashboard using your credentials.
          </Item>
          <Item>
            <b>Import Data</b>: Head to <DocsLink href="/dashboard/import">Import</DocsLink> to upload transactions and balances. (CSV supported)
          </Item>
          <Item>
            <b>Invite Team</b>: Collaborate by inviting users from <DocsLink href="/dashboard/settings">Settings</DocsLink>. Set roles and permissions.
          </Item>
        </List>

        <SectionTitle>User Roles & Permissions</SectionTitle>
        <List>
          <Item>
            <b>Owner</b>: Full access. Can manage all users and settings.
          </Item>
          <Item>
            <b>Admin</b>: Manage records, approve/submit transactions, manage some users.
          </Item>
          <Item>
            <b>Bookkeeper</b>: Record, view, and submit transactions.
          </Item>
          <Item>
            <b>Viewer</b>: View data and reports only.
          </Item>
        </List>

        <SectionTitle>REST API</SectionTitle>
        <p>
          You can programmatically access your financial data via the system REST API.
          All endpoints require a valid access token.
        </p>
        <CodeBlock>
{`GET /api/v1/reports/income-statement
Authorization: Bearer &lt;your_access_token&gt;

Response (JSON):
{
  "revenue": 12000,
  "expenses": 8000,
  "profit": 4000
}
`}
        </CodeBlock>
        <p>
          Visit the <DocsLink href="/docs/api">API Reference</DocsLink> for the full list of endpoints and authentication methods.
        </p>

        <SectionTitle>Need Help?</SectionTitle>
        <p>
          If you need support, check our <DocsLink href="/service/support">Support page</DocsLink>, or contact us at{" "}
          <EmailLink href="mailto:support@finmgmt.co">support@finmgmt.co</EmailLink>.
        </p>
      </Container>
    </PageWrapper>
  );
}
