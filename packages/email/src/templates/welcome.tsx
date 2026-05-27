interface WelcomeEmailProps {
  name: string;
  dashboardUrl: string;
}

export function WelcomeEmail({ name, dashboardUrl }: WelcomeEmailProps) {
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
        Welcome to FormForge, {name}!
      </h1>
      <p style={{ color: "#6b7280", fontSize: 15, margin: "0 0 24px" }}>
        Your account is ready. Start building beautiful forms in minutes — no design skills required.
      </p>

      <div
        style={{
          backgroundColor: "#f9fafb",
          borderRadius: 8,
          padding: "16px 20px",
          marginBottom: 24,
        }}
      >
        <p style={{ fontSize: 14, color: "#374151", margin: "0 0 8px", fontWeight: 600 }}>
          What you can do with FormForge:
        </p>
        {[
          "Drag-and-drop form builder with 10 field types",
          "Real-time analytics and response tracking",
          "Custom slugs, QR codes, and public sharing",
          "Email notifications when someone responds",
        ].map((item) => (
          <p key={item} style={{ fontSize: 14, color: "#6b7280", margin: "4px 0" }}>
            ✓ {item}
          </p>
        ))}
      </div>

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
        Go to your dashboard →
      </a>

      <hr style={{ border: "none", borderTop: "1px solid #f3f4f6", margin: "32px 0 16px" }} />
      <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
        You&apos;re receiving this because you just created a{" "}
        <a href="https://formforge.dev" style={{ color: "#7c3aed", textDecoration: "none" }}>
          FormForge
        </a>{" "}
        account.
      </p>
    </div>
  );
}
