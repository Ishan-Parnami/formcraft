import * as React from "react";

interface WelcomeEmailProps {
  name: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <div style={{ fontFamily: "Inter, sans-serif", padding: "32px" }}>
      <h1>Welcome to FormCraft, {name}!</h1>
      <p>Start building beautiful forms in minutes.</p>
    </div>
  );
}
