import { notFound } from "next/navigation";
import db, { forms, fields } from "@formcraft/db";
import { eq, and } from "@formcraft/db";
import type { SelectField } from "@formcraft/db";
import PublicFormClient from "./PublicFormClient";

export const dynamic = "force-dynamic";

async function getPublicForm(slug: string) {
  const [form] = await db.select().from(forms).where(eq(forms.slug, slug));
  if (!form || !form.isPublished) return null;

  const formFields = await db
    .select()
    .from(fields)
    .where(eq(fields.formId, form.id))
    .orderBy(fields.order);

  return { ...form, fields: formFields };
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

  if (!form) return <Unavailable message="This form doesn't exist or is no longer accepting responses." />;

  const settings = (form.settings ?? {}) as Record<string, unknown>;

  if (settings.expiresAt && new Date(settings.expiresAt as string) < new Date()) {
    return <Unavailable message="This form has expired and is no longer accepting responses." />;
  }

  // Strip passwordHash before sending to client
  const { passwordHash: _, ...safeSettings } = settings as Record<string, unknown> & { passwordHash?: unknown };
  const theme = (form.theme ?? {}) as Record<string, unknown>;

  return (
    <PublicFormClient
      form={{ ...form, settings: safeSettings }}
      theme={theme}
    />
  );
}
