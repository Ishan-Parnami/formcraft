import * as React from "react";

interface NewResponseEmailProps {
  formTitle: string;
  formId: string;
  responseId: string;
  keyAnswers: Array<{ label: string; value: string }>;
  dashboardUrl: string;
}

export function NewResponseEmail({
  formTitle,
  responseId,
  keyAnswers,
  dashboardUrl,
}: NewResponseEmailProps) {
  return (
    <div style={{ fontFamily: "Inter, sans-serif", maxWidth: 560, margin: "0 auto", padding: "32px 24px", backgroundColor: "#ffffff" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: 18 }}>FormCraft</span>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
        You got a new response!
      </h1>
      <p style={{ color: "#6b7280", fontSize: 15, margin: "0 0 24px" }}>
        Someone just submitted <strong>{formTitle}</strong>.
      </p>

      {/* Key answers */}
      {keyAnswers.length > 0 && (
        <div style={{ backgroundColor: "#f9fafb", borderRadius: 8, padding: "16px 20px", marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
            Response summary
          </p>
          {keyAnswers.map(({ label, value }) => (
            <div key={label} style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
              <p style={{ fontSize: 14, color: "#111827", margin: "2px 0 0", fontWeight: 500 }}>{value || "—"}</p>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 24 }}>
        Response ID: <code style={{ fontSize: 11 }}>{responseId.slice(0, 8)}</code>
      </p>

      {/* CTA */}
      <a
        href={dashboardUrl}
        style={{
          display: "inline-block",
          backgroundColor: "#7c3aed",
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: 8,
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        View all responses →
      </a>

      {/* Footer */}
      <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "32px 0 16px" }} />
      <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
        Sent by <a href="https://formcraft.dev" style={{ color: "#7c3aed", textDecoration: "none" }}>FormCraft</a>.
        You&apos;re receiving this because you own this form.
      </p>
    </div>
  );
}
