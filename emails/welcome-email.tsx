import { Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Text } from "@react-email/components";

export function WelcomeEmail({ name = "there" }: { name?: string }) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to MR Creativist</Preview>
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f3f7fc", padding: "28px" }}>
        <Container style={{ backgroundColor: "#ffffff", border: "1px solid #dbe7f5", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ backgroundColor: "#0f4fd0", padding: "28px 32px" }}>
            <Img src="https://mrcreativist.vercel.app/icons/logo.png" width="64" height="64" alt="MR Creativist" style={{ borderRadius: "14px", backgroundColor: "#ffffff", padding: "5px" }} />
            <Heading style={{ color: "#ffffff", marginBottom: 0 }}>Welcome to MR Creativist, {name}</Heading>
          </div>
          <div style={{ padding: "30px 32px" }}>
            <Text>Your learning, marketplace, consulting, wallet, certificates, jobs, business tools, and AI workspace is ready.</Text>
            <Button href="https://mrcreativist.vercel.app/dashboard" style={{ backgroundColor: "#1d5bd8", color: "#ffffff", borderRadius: "8px", fontWeight: 700, padding: "12px 18px" }}>
              Open dashboard
            </Button>
            <Hr />
            <Text>
              Support: <Link href="mailto:support@mrcreativist.ca">support@mrcreativist.ca</Link> · +250 789 223 887 / +1 (581) 990-1981 / +250 788 819 111
            </Text>
          </div>
        </Container>
      </Body>
    </Html>
  );
}
