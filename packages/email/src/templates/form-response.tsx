import * as React from "react";

interface FormResponseEmailProps {
  formTitle: string;
  responseCount: number;
}

export function FormResponseEmail({ formTitle, responseCount }: FormResponseEmailProps) {
  return (
    <div style={{ fontFamily: "Inter, sans-serif", padding: "32px" }}>
      <h1>New response on "{formTitle}"</h1>
      <p>You now have {responseCount} total responses.</p>
    </div>
  );
}
