import { auth } from "~/auth";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { ArrowLeft, Eye, MessageSquare, TrendingUp, Clock } from "lucide-react";
import db, { forms, responses, formViews } from "@formcraft/db";
import { eq, count, avg, sql } from "@formcraft/db";

export default async function AnalyticsPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [form] = await db.select().from(forms).where(eq(forms.id, formId));
  if (!form || form.userId !== session.user.id) notFound();

  const totalResponsesRes = await db.select({ totalResponses: count() }).from(responses).where(eq(responses.formId, formId));
  const totalResponses = totalResponsesRes[0]?.totalResponses ?? 0;

  const totalViewsRes = await db.select({ totalViews: count() }).from(formViews).where(eq(formViews.formId, formId));
  const totalViews = totalViewsRes[0]?.totalViews ?? 0;

  const completionRate = totalViews > 0 ? Math.round((totalResponses / totalViews) * 100) : 0;

  const avgTimeResult = await db
    .select({ avg: avg(responses.completionTime) })
    .from(responses)
    .where(eq(responses.formId, formId));
  const avgTime = avgTimeResult[0]?.avg ? Math.round(Number(avgTimeResult[0].avg)) : null;

  const stats = [
    { label: "Total Views", value: totalViews, icon: Eye, color: "text-blue-500" },
    { label: "Responses", value: totalResponses, icon: MessageSquare, color: "text-violet-500" },
    { label: "Completion Rate", value: `${completionRate}%`, icon: TrendingUp, color: "text-green-500" },
    { label: "Avg. Completion", value: avgTime ? `${avgTime}s` : "—", icon: Clock, color: "text-orange-500" },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/forms/${formId}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </Link>
        <h1 className="text-2xl font-bold">{form.title} — Analytics</h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl border text-center text-gray-500">
        <p className="text-sm">Response timeline chart coming in Part 2</p>
      </div>
    </div>
  );
}
