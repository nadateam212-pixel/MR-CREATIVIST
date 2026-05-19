import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

export function WelcomeEmail({ name = "there" }: { name?: string }) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to MR Creativist</Preview>
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f7f7f7", padding: "24px" }}>
        <Container style={{ backgroundColor: "#ffffff", borderRadius: "8px", padding: "24px" }}>
          <Heading>Welcome, {name}</Heading>
          <Text>Your unified learning, commerce, and consulting workspace is ready.</Text>
        </Container>
      </Body>
    </Html>
  );
}
