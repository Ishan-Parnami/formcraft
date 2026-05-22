import { auth } from "~/auth";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Edit, BarChart3, MessageSquare, Settings, Eye, Copy } from "lucide-react";
import db, { forms, fields, responses } from "@formcraft/db";
import { eq, count } from "@formcraft/db";

export default async function FormOverviewPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [form] = await db.select().from(forms).where(eq(forms.id, formId));
  if (!form || form.userId !== session.user.id) notFound();

  const formFields = await db.select().from(fields).where(eq(fields.formId, formId));
  const totalResponsesResult = await db.select({ total: count() }).from(responses).where(eq(responses.formId, formId));
  const totalResponses = totalResponsesResult[0]?.total ?? 0;

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/f/${form.slug}`;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{form.title}</h1>
          {form.description && <p className="text-gray-500 text-sm mt-1">{form.description}</p>}
          <Badge
            className={`mt-2 text-xs ${form.isPublished ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600"}`}
            variant="outline"
          >
            {form.isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
        <Link href={`/forms/${formId}/edit`}>
          <Button className="bg-violet-600 hover:bg-violet-700">
            <Edit className="h-4 w-4 mr-2" /> Edit form
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <div className="text-2xl font-bold">{formFields.length}</div>
            <div className="text-sm text-gray-500">Fields</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-2xl font-bold">{totalResponses}</div>
            <div className="text-sm text-gray-500">Responses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-2xl font-bold">{form.visibility}</div>
            <div className="text-sm text-gray-500">Visibility</div>
          </CardContent>
        </Card>
      </div>

      {/* Links */}
      {form.isPublished && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-800 mb-2">Form URL</p>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-white px-3 py-2 rounded border flex-1 truncate">{publicUrl}</code>
            <Link href={`/f/${form.slug}`} target="_blank">
              <Button size="sm" variant="outline" className="shrink-0"><Eye className="h-3 w-3 mr-1" /> View</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Nav links */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { href: `/forms/${formId}/responses`, icon: MessageSquare, label: "Responses" },
          { href: `/forms/${formId}/analytics`, icon: BarChart3, label: "Analytics" },
          { href: `/forms/${formId}/settings`, icon: Settings, label: "Settings" },
        ].map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-sm transition-shadow cursor-pointer">
              <CardContent className="p-5 flex items-center gap-3">
                <Icon className="h-5 w-5 text-violet-500" />
                <span className="font-medium text-sm">{label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
