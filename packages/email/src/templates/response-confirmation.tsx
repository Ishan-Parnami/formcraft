import * as React from "react";

interface ResponseConfirmationEmailProps {
  formTitle: string;
  answers: Array<{ label: string; value: string }>;
}

export function ResponseConfirmationEmail({ formTitle, answers }: ResponseConfirmationEmailProps) {
  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        maxWidth: 560,
        margin: "0 auto",
        padding: "32px 24px",
        backgroundColor: "#ffffff",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: 18 }}>FormForge</span>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
        We got your response!
      </h1>
      <p style={{ color: "#6b7280", fontSize: 15, margin: "0 0 24px" }}>
        Thank you for filling out <strong>{formTitle}</strong>. Here&apos;s a summary of your
        answers:
      </p>

      <div
        style={{
          backgroundColor: "#f9fafb",
          borderRadius: 8,
          padding: "16px 20px",
          marginBottom: 24,
        }}
      >
        {answers.map(({ label, value }) => (
          <div key={label} style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
            <p style={{ fontSize: 14, color: "#111827", margin: "2px 0 0", fontWeight: 500 }}>
              {value || "—"}
            </p>
          </div>
        ))}
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "24px 0 16px" }} />
      <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
        Powered by{" "}
        <a href="https://formforge.dev" style={{ color: "#7c3aed", textDecoration: "none" }}>
          FormForge
        </a>
        .
      </p>
    </div>
  );
}
