"use client";
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
  background: linear-gradient(180deg, rgba(35, 39, 47, 0.95), rgba(18, 22, 30, 0.98));
  border: 1px solid rgba(129, 140, 248, 0.16);
  border-radius: 16px;
  box-shadow: 0 14px 48px rgba(0, 0, 0, 0.32);
  color: #e5e7eb;

  @media (max-width: 600px) {
    padding: 1.4rem 1rem;
    border-radius: 14px;
  }
`;

const Heading = styled.h1`
  font-size: 2.4rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(135deg,#3b82f6,#8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 700;
  margin: 2rem 0 0.9rem 0;
  color: #a5b4fc;
`;

const SubSection = styled.h3`
  font-size: 1.05rem;
  font-weight: 600;
  margin-top: 1.45rem;
  margin-bottom: 0.5rem;
  color: #c4b5fd;
`;

const Paragraph = styled.p`
  margin-bottom: 1.05rem;
  line-height: 1.7;
`;

const List = styled.ul`
  margin-left: 1.2rem;
  margin-bottom: 1.3rem;
`;

const ListItem = styled.li`
  margin-bottom: 0.6rem;
  line-height: 1.7;
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

export default function TermsPage() {
  return (
    <PageWrapper>
      <Container>
        <Heading>Terms of Service</Heading>
        <HomeButton href="/">← Back to Home</HomeButton>
      <Paragraph>
        These Terms of Service (&quot;Terms&quot;) govern your use of Financial Management System, including all related features, content, and services. By accessing or using the platform, you agree to comply with these Terms. If you do not agree, please do not use the platform.
      </Paragraph>

      <SectionTitle>1. Acceptance of Terms</SectionTitle>
      <Paragraph>
        By creating an account, accessing, or using the Financial Management System, you confirm that you have read, understood, and agree to be bound by these Terms.
      </Paragraph>

      <SectionTitle>2. Use of the Platform</SectionTitle>
      <List>
        <ListItem>
          <strong>Eligibility:</strong> You must be at least 18 years old or the age of majority in your jurisdiction to use this platform.
        </ListItem>
        <ListItem>
          <strong>Account Responsibility:</strong> You are responsible for keeping your account credentials confidential and for all activity occurring under your account.
        </ListItem>
        <ListItem>
          <strong>Acceptable Use:</strong> You agree not to misuse the platform or use it for any unlawful or harmful purpose.
        </ListItem>
      </List>

      <SectionTitle>3. User Content and Data</SectionTitle>
      <Paragraph>
        Financial Management System allows you to upload, store, and manage financial data. You retain ownership of your data. By using the platform, you grant us a limited license to process your data solely for the purpose of providing and improving our services.
      </Paragraph>

      <SectionTitle>4. Privacy</SectionTitle>
      <Paragraph>
        Please review our <a href="/privacy" style={{color:'#818cf8', textDecoration:'underline'}}>Privacy Policy</a> to understand how we collect, use, and protect your information.
      </Paragraph>

      <SectionTitle>5. Intellectual Property</SectionTitle>
      <List>
        <ListItem>
          <strong>Platform Ownership:</strong> All rights, title, and interest in the platform and its content (excluding your data) are owned by Financial Management System or its licensors.
        </ListItem>
        <ListItem>
          <strong>Restrictions:</strong> You may not reproduce, distribute, modify, or create derivative works from any part of the platform without explicit permission.
        </ListItem>
      </List>

      <SectionTitle>6. Termination</SectionTitle>
      <Paragraph>
        We reserve the right to suspend or terminate your access to the platform at our sole discretion, with or without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
      </Paragraph>

      <SectionTitle>7. Disclaimers</SectionTitle>
      <Paragraph>
        The platform is provided &quot;as is&quot; and without warranties of any kind. We do not guarantee the accuracy, completeness, or reliability of the platform or its content. Use at your own risk.
      </Paragraph>

      <SectionTitle>8. Limitation of Liability</SectionTitle>
      <Paragraph>
        To the fullest extent permitted by law, Financial Management System shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.
      </Paragraph>

      <SectionTitle>9. Modifications</SectionTitle>
      <Paragraph>
        We may update these Terms at any time. We will notify you of significant changes, and continued use signifies your acceptance of the revised Terms.
      </Paragraph>

      <SectionTitle>10. Governing Law</SectionTitle>
      <Paragraph>
        These Terms are governed by the laws of the applicable jurisdiction, without regard to its conflict of law provisions.
      </Paragraph>

      <SectionTitle>Contact Us</SectionTitle>
      <Paragraph>
        For questions regarding these Terms, please contact our support team via the <a href="/contact" style={{color:'#818cf8', textDecoration:'underline'}}>Contact</a> page.
      </Paragraph>

      <Paragraph style={{marginTop:"2rem", color:"#6b7280", fontSize: "0.97rem", textAlign:"right"}}>
        Last updated: June 2024
      </Paragraph>
      </Container>
    </PageWrapper>
  );
}
