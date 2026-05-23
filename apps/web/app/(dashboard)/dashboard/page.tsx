import { auth } from "~/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Plus, FileText, Eye, MessageSquare } from "lucide-react";
import db, { forms, responses, formViews } from "@formforge/db";
import { eq, count } from "@formforge/db";

async function getDashboardData(userId: string) {
  const userForms = await db.select().from(forms).where(eq(forms.userId, userId));
  const totalForms = userForms.length;

  let totalResponses = 0;
  let totalViews = 0;

  for (const form of userForms.slice(0, 5)) {
    const rResult = await db
      .select({ value: count() })
      .from(responses)
      .where(eq(responses.formId, form.id));
    totalResponses += rResult[0]?.value ?? 0;

    const vResult = await db
      .select({ value: count() })
      .from(formViews)
      .where(eq(formViews.formId, form.id));
    totalViews += vResult[0]?.value ?? 0;
  }

  return { userForms: userForms.slice(0, 6), totalForms, totalResponses, totalViews };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { userForms, totalForms, totalResponses, totalViews } = await getDashboardData(
    session.user.id!,
  );

  const stats = [
    { label: "Total Forms", value: totalForms, icon: FileText },
    { label: "Total Responses", value: totalResponses, icon: MessageSquare },
    { label: "Total Views", value: totalViews, icon: Eye },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, {session.user.name}</p>
        </div>
        <Link href="/forms/new">
          <Button className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4 mr-2" /> New Form
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <s.icon className="h-8 w-8 text-violet-500" />
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent forms */}
      <h2 className="text-lg font-semibold mb-4">Recent forms</h2>
      {userForms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">You haven&apos;t created any forms yet</p>
          <Link href="/forms/new">
            <Button className="bg-violet-600 hover:bg-violet-700">Create your first form</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {userForms.map((form) => (
            <Link key={form.id} href={`/forms/${form.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm line-clamp-2">{form.title}</h3>
                    <Badge
                      className={`text-xs shrink-0 ml-2 ${form.isPublished ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600"}`}
                      variant="outline"
                    >
                      {form.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  {form.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{form.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-3">
                    {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : ""}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
