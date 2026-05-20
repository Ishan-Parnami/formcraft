import { auth } from "~/auth";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { ArrowLeft } from "lucide-react";
import db, { forms, fields, responses } from "@formcraft/db";
import { eq, desc } from "@formcraft/db";

export default async function ResponsesPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [form] = await db.select().from(forms).where(eq(forms.id, formId));
  if (!form || form.userId !== session.user.id) notFound();

  const formFields = await db.select().from(fields).where(eq(fields.formId, formId));
  const formResponses = await db
    .select()
    .from(responses)
    .where(eq(responses.formId, formId))
    .orderBy(desc(responses.createdAt))
    .limit(50);

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/forms/${formId}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </Link>
        <h1 className="text-2xl font-bold">{form.title} — Responses</h1>
      </div>

      <p className="text-sm text-gray-500 mb-6">{formResponses.length} responses</p>

      {formResponses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>No responses yet. Share your form to start collecting!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {formResponses.map((r, i) => {
            const answers = (r.answers ?? {}) as Record<string, unknown>;
            return (
              <Card key={r.id}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-gray-700">Response #{formResponses.length - i}</span>
                    <span className="text-xs text-gray-400">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {formFields.map((field) => (
                      <div key={field.id} className="grid grid-cols-3 gap-2 text-sm">
                        <span className="text-gray-500 font-medium truncate">{field.label}</span>
                        <span className="col-span-2 text-gray-900">
                          {answers[field.id] !== undefined && answers[field.id] !== null
                            ? String(answers[field.id])
                            : <span className="text-gray-300 italic">—</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
