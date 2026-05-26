import db, { forms, formViews } from "@formforge/db";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { eq } from "@formforge/db";
import type { SelectField } from "@formforge/db";
import PublicFormClient from "./PublicFormClient";

export const dynamic = "force-dynamic";

async function getPublicForm(slug: string) {
  const [form] = await db.select().from(forms).where(eq(forms.slug, slug));
  if (!form || !form.isPublished) return null;
  if (!form.publishedSnapshot) return null;

  const raw = form.publishedSnapshot as unknown;
  // New format: { fields: SelectField[], theme: ThemeConfig | null }
  // Old format (backward compat): SelectField[]
  const snapshotFields: SelectField[] = Array.isArray(raw)
    ? raw
    : (raw as { fields: SelectField[] }).fields;
  const snapshotTheme: Record<string, unknown> | null = Array.isArray(raw)
    ? null
    : ((raw as { theme?: Record<string, unknown> | null }).theme ?? null);

  return { ...form, fields: snapshotFields, snapshotTheme };
}

async function trackView(formId: string) {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "";
    const ipHash = ip ? createHash("sha256").update(ip).digest("hex") : null;
    const referrer = h.get("referer") ?? null;
    await db.insert(formViews).values({ formId, ipHash, referrer });
  } catch {
    // never block form rendering for analytics
  }
}

function Unavailable({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Form not available</h1>
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  );
}

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await getPublicForm(slug);

  if (!form)
    return <Unavailable message="This form doesn't exist or is no longer accepting responses." />;

  const settings = (form.settings ?? {}) as Record<string, unknown>;

  if (settings.expiresAt && new Date(settings.expiresAt as string) < new Date()) {
    return <Unavailable message="This form has expired and is no longer accepting responses." />;
  }

  // Strip passwordHash before sending to client
  const { passwordHash: _, ...safeSettings } = settings as Record<string, unknown> & {
    passwordHash?: unknown;
  };
  const theme = (form.snapshotTheme ?? form.theme ?? {}) as Record<string, unknown>;

  void trackView(form.id);

  return <PublicFormClient form={{ ...form, settings: safeSettings }} theme={theme} />;
}
